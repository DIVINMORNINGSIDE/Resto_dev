-- Deuxième version : expiration des points, top 10 des clients,
-- commentaire après livraison et affiches de promotions.

-- ---------------------------------------------------------------------------
-- Expiration des points
-- Les points utilisés consomment d'abord ceux qui expirent le plus tôt
-- (premier arrivé, premier sorti). Ce qui reste d'un gain arrivé à échéance
-- est retiré du solde par une ligne « expiration ».
-- ---------------------------------------------------------------------------
-- Reste de chaque gain de points d'un compte, après les retraits.
create function private.remaining_credits(p_user uuid)
returns table (expires_at timestamptz, remaining integer)
language sql
stable
set search_path = ''
as $$
  with debits as (
    select coalesce(sum(-points), 0) as total
    from public.loyalty_transactions
    where user_id = p_user and points < 0
  ),
  credits as (
    select t.expires_at, t.points,
      sum(t.points) over (
        order by coalesce(t.expires_at, 'infinity'::timestamptz), t.created_at, t.id
      ) as running
    from public.loyalty_transactions t
    where t.user_id = p_user and t.points > 0
  )
  select c.expires_at, greatest(0, least(c.points, c.running - d.total))::integer
  from credits c cross join debits d;
$$;

-- Retire les points arrivés à échéance d'un compte ; renvoie le nombre retiré.
create function private.expire_user_points(p_user uuid)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_expired integer;
begin
  perform 1 from public.profiles where id = p_user for update;
  select coalesce(sum(remaining), 0) into v_expired
  from private.remaining_credits(p_user)
  where expires_at <= now();

  if v_expired > 0 then
    update public.profiles set points_balance = points_balance - v_expired where id = p_user;
    insert into public.loyalty_transactions (user_id, kind, points, note)
    values (p_user, 'expiration', -v_expired, 'Points arrivés à échéance');
  end if;
  return v_expired;
end;
$$;

-- Passe sur tous les comptes qui ont des points échus (tâche planifiée).
create function private.expire_points()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
  v_total integer := 0;
begin
  for v_user in
    select distinct user_id from public.loyalty_transactions
    where points > 0 and expires_at <= now()
  loop
    v_total := v_total + private.expire_user_points(v_user);
  end loop;
  return v_total;
end;
$$;

revoke execute on function
  private.remaining_credits(uuid),
  private.expire_user_points(uuid),
  private.expire_points()
from public, anon, authenticated;

-- Prochaine échéance des points du client connecté.
create function public.my_next_points_expiry()
returns table (expires_at timestamptz, points integer)
language sql
stable
security definer
set search_path = ''
as $$
  select date_trunc('day', r.expires_at), sum(r.remaining)::integer
  from private.remaining_credits((select auth.uid())) r
  where r.expires_at > now() and r.remaining > 0
  group by 1
  order by 1
  limit 1;
$$;

create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule('expirer-points-fidelite', '5 * * * *', 'select private.expire_points()');

-- ---------------------------------------------------------------------------
-- Top 10 des clients (commandes servies ou livrées sur la période)
-- Les étudiants voient un prénom et une initiale ; le personnel, le nom complet.
-- ---------------------------------------------------------------------------
create function public.top_customers(p_period text)
returns table (rank integer, name text, orders integer, is_me boolean)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_staff boolean := private.is_staff();
  v_from timestamptz;
begin
  if v_uid is null then
    raise exception 'Connecte-toi pour voir le classement' using errcode = '42501';
  end if;
  if p_period not in ('jour', 'semaine', 'mois') then
    raise exception 'Période invalide' using errcode = '22023';
  end if;
  v_from := date_trunc(
    case p_period when 'jour' then 'day' when 'semaine' then 'week' else 'month' end,
    now() at time zone 'Africa/Douala'
  ) at time zone 'Africa/Douala';

  return query
  with counts as (
    select o.customer_id, count(*)::integer as n, max(o.updated_at) as last_at
    from public.orders o
    where o.status = 'livree' and o.created_at >= v_from
    group by o.customer_id
  )
  select
    (row_number() over (order by c.n desc, c.last_at))::integer,
    case
      when v_staff then p.full_name
      else split_part(trim(p.full_name), ' ', 1)
        || coalesce(' ' || nullif(left(split_part(trim(p.full_name), ' ', 2), 1), '') || '.', '')
    end,
    c.n,
    c.customer_id = v_uid
  from counts c
  join public.profiles p on p.id = c.customer_id
  order by c.n desc, c.last_at
  limit 10;
end;
$$;

-- ---------------------------------------------------------------------------
-- Commentaire du client une fois sa commande livrée
-- ---------------------------------------------------------------------------
alter table public.orders
  add column commented_at timestamptz,
  add constraint orders_customer_comment_length
    check (customer_comment is null or char_length(customer_comment) between 3 and 500);

create index orders_commented_at_idx on public.orders (commented_at desc) where commented_at is not null;

create function public.comment_my_order(p_order_id uuid, p_comment text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_comment text := nullif(trim(p_comment), '');
begin
  select * into v_order from public.orders
  where id = p_order_id and customer_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'Commande introuvable' using errcode = 'P0002';
  end if;
  if v_order.status <> 'livree' then
    raise exception 'Tu pourras laisser un commentaire une fois ta commande servie' using errcode = '22023';
  end if;
  if v_comment is null or char_length(v_comment) not between 3 and 500 then
    raise exception 'Ton commentaire doit faire entre 3 et 500 caractères' using errcode = '22023';
  end if;

  update public.orders
  set customer_comment = v_comment, commented_at = now()
  where id = p_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Affiches de promotions
-- ---------------------------------------------------------------------------
alter table public.promotions
  add constraint promotions_title_length check (char_length(title) between 3 and 80),
  add constraint promotions_description_length check (description is null or char_length(description) <= 300);

create index promotions_active_idx on public.promotions (starts_at desc) where is_active;

revoke execute on function
  public.my_next_points_expiry(),
  public.top_customers(text),
  public.comment_my_order(uuid, text)
from public, anon;
grant execute on function
  public.my_next_points_expiry(),
  public.top_customers(text),
  public.comment_my_order(uuid, text)
to authenticated;
