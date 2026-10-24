-- Étape 3 : commande, cuisine, fidélité, parrainage, réclamations, statistiques.
-- Tout ce qui touche à l'argent ou aux points passe par des fonctions SQL
-- transactionnelles : le navigateur n'écrit jamais un prix, un total ou un solde.

-- ---------------------------------------------------------------------------
-- Les commandes et les réclamations ne se modifient plus directement par l'API
-- ---------------------------------------------------------------------------
drop policy "Le personnel fait avancer les commandes" on public.orders;
revoke update on public.orders from authenticated;

drop policy "Le personnel traite les réclamations" on public.complaints;
revoke update on public.complaints from authenticated;

alter table public.complaints
  add constraint complaints_subject_length check (char_length(subject) between 3 and 120),
  add constraint complaints_message_length check (char_length(message) between 10 and 2000);

-- Le client suit sa réclamation en direct, comme sa commande.
alter publication supabase_realtime add table public.complaints;

create index orders_created_at_idx on public.orders (restaurant_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Cycle de vie d'une commande
-- ---------------------------------------------------------------------------
create function private.next_order_statuses(p_type public.order_type, p_status public.order_status)
returns public.order_status[]
language sql
immutable
set search_path = ''
as $$
  select case p_status
    when 'en_attente' then array['en_preparation', 'annulee']::public.order_status[]
    when 'en_preparation' then array['prete', 'annulee']::public.order_status[]
    when 'prete' then case p_type
      when 'livraison' then array['en_livraison', 'annulee']::public.order_status[]
      else array['livree', 'annulee']::public.order_status[]
    end
    when 'en_livraison' then array['livree']::public.order_status[]
    else array[]::public.order_status[]
  end;
$$;

-- Crédite les points d'une commande livrée et, si c'est la première commande
-- livrée d'un filleul, la récompense de son parrain.
create function private.reward_delivered_order(p_order public.orders)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant public.restaurants%rowtype;
  v_referral public.referrals%rowtype;
  v_expires timestamptz;
begin
  select * into v_restaurant from public.restaurants where id = p_order.restaurant_id;
  v_expires := now() + make_interval(months => v_restaurant.points_validity_months);

  if p_order.points_earned > 0 then
    update public.profiles set points_balance = points_balance + p_order.points_earned
    where id = p_order.customer_id;
    insert into public.loyalty_transactions (user_id, order_id, kind, points, expires_at, note)
    values (p_order.customer_id, p_order.id, 'gain', p_order.points_earned, v_expires, 'Commande livrée');
  end if;

  select * into v_referral from public.referrals
  where referee_id = p_order.customer_id and rewarded_at is null
  for update;

  if found and not exists (
    select 1 from public.orders
    where customer_id = p_order.customer_id and status = 'livree' and id <> p_order.id
  ) then
    if v_restaurant.referral_bonus_points > 0 then
      update public.profiles set points_balance = points_balance + v_restaurant.referral_bonus_points
      where id = v_referral.referrer_id;
      insert into public.loyalty_transactions (user_id, order_id, kind, points, expires_at, note)
      values (
        v_referral.referrer_id, p_order.id, 'parrainage', v_restaurant.referral_bonus_points, v_expires,
        'Première commande de ton filleul'
      );
    end if;
    update public.referrals
    set reward_points = v_restaurant.referral_bonus_points, rewarded_at = now()
    where id = v_referral.id;
  end if;
end;
$$;

-- Rend les points utilisés sur une commande annulée.
create function private.refund_cancelled_order(p_order public.orders)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_order.points_used > 0 then
    update public.profiles set points_balance = points_balance + p_order.points_used
    where id = p_order.customer_id;
    insert into public.loyalty_transactions (user_id, order_id, kind, points, note)
    values (p_order.customer_id, p_order.id, 'ajustement', p_order.points_used, 'Points rendus : commande annulée');
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Passer commande
-- p_items : [{"menu_item_id": "<uuid>", "quantity": 2}, …]
-- p_redeem_blocks : nombre de tranches de points utilisées (15 points = 1 000 F par défaut)
-- ---------------------------------------------------------------------------
create function public.place_order(
  p_order_type public.order_type,
  p_items jsonb,
  p_arrival_time timestamptz default null,
  p_delivery_address text default null,
  p_redeem_blocks integer default 0
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_profile public.profiles%rowtype;
  v_restaurant public.restaurants%rowtype;
  v_lines jsonb;
  v_wanted integer;
  v_found integer;
  v_missing text;
  v_subtotal integer;
  v_discount integer := 0;
  v_points_used integer := 0;
  v_address text;
  v_arrival timestamptz;
  v_order_id uuid;
begin
  select * into v_profile from public.profiles where id = v_uid and is_active for update;
  if not found then
    raise exception 'Connecte-toi avec un compte actif pour commander' using errcode = '42501';
  end if;
  select * into v_restaurant from public.restaurants where id = private.default_restaurant_id();

  if (select count(*) from public.orders
      where customer_id = v_uid and status in ('en_attente', 'en_preparation', 'prete', 'en_livraison')) >= 3 then
    raise exception 'Tu as déjà 3 commandes en cours. Attends qu''une soit servie.' using errcode = '22023';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Ton panier est vide' using errcode = '22023';
  end if;
  if jsonb_array_length(p_items) > 30 then
    raise exception 'Trop de plats différents dans une seule commande' using errcode = '22023';
  end if;
  if exists (
    select 1 from jsonb_array_elements(p_items) e
    where jsonb_typeof(e -> 'quantity') <> 'number'
       or (e ->> 'quantity')::numeric <> floor((e ->> 'quantity')::numeric)
       or (e ->> 'quantity')::int not between 1 and 20
  ) then
    raise exception 'Quantité invalide : entre 1 et 20 par plat' using errcode = '22023';
  end if;

  -- Lignes regroupées par plat ; les prix viennent toujours de la base.
  select jsonb_agg(jsonb_build_object('menu_item_id', menu_item_id, 'quantity', quantity))
  into v_lines
  from (
    select (e ->> 'menu_item_id')::uuid as menu_item_id, sum((e ->> 'quantity')::int) as quantity
    from jsonb_array_elements(p_items) e
    group by 1
  ) grouped;

  if exists (select 1 from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int) where w.quantity > 20) then
    raise exception 'Quantité invalide : entre 1 et 20 par plat' using errcode = '22023';
  end if;

  select count(m.id), count(*), sum(m.price_fcfa * w.quantity)
  into v_found, v_wanted, v_subtotal
  from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int)
  left join public.menu_items m
    on m.id = w.menu_item_id and m.is_available and m.restaurant_id = v_restaurant.id;

  if v_found <> v_wanted then
    select m.name into v_missing
    from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int)
    left join public.menu_items m on m.id = w.menu_item_id
    where m.id is null or not m.is_available
    limit 1;
    raise exception '% n''est plus disponible. Retire-le du panier.', coalesce(v_missing, 'Un plat')
      using errcode = '22023';
  end if;

  -- Sur place : heure d'arrivée ; livraison : adresse.
  if p_order_type = 'sur_place' then
    v_arrival := p_arrival_time;
    if v_arrival is null or v_arrival < now() - interval '10 minutes' or v_arrival > now() + interval '12 hours' then
      raise exception 'Choisis une heure d''arrivée dans les 12 prochaines heures' using errcode = '22023';
    end if;
  else
    v_address := coalesce(nullif(trim(p_delivery_address), ''), v_profile.delivery_address);
    if v_address is null then
      raise exception 'Indique une adresse de livraison' using errcode = '22023';
    end if;
    if char_length(v_address) > 200 then
      raise exception 'Adresse trop longue : 200 caractères maximum' using errcode = '22023';
    end if;
  end if;

  -- Points de fidélité utilisés comme réduction.
  if coalesce(p_redeem_blocks, 0) < 0 then
    raise exception 'Nombre de points invalide' using errcode = '22023';
  end if;
  if coalesce(p_redeem_blocks, 0) > 0 then
    v_points_used := p_redeem_blocks * v_restaurant.redeem_points_block;
    v_discount := p_redeem_blocks * v_restaurant.redeem_value_fcfa;
    if v_points_used > v_profile.points_balance then
      raise exception 'Tu n''as pas assez de points pour cette réduction' using errcode = '22023';
    end if;
    if v_discount > v_subtotal then
      raise exception 'La réduction dépasse le montant de la commande' using errcode = '22023';
    end if;
  end if;

  insert into public.orders (
    restaurant_id, customer_id, order_type, arrival_time, delivery_address,
    subtotal_fcfa, discount_fcfa, total_fcfa, points_earned, points_used
  ) values (
    v_restaurant.id, v_uid, p_order_type, v_arrival, v_address,
    v_subtotal, v_discount, v_subtotal - v_discount,
    (v_subtotal - v_discount) / v_restaurant.fcfa_per_point, v_points_used
  )
  returning id into v_order_id;

  insert into public.order_items (order_id, menu_item_id, item_name, unit_price_fcfa, quantity)
  select v_order_id, m.id, m.name, m.price_fcfa, w.quantity
  from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int)
  join public.menu_items m on m.id = w.menu_item_id;

  if v_points_used > 0 then
    update public.profiles set points_balance = points_balance - v_points_used where id = v_uid;
    insert into public.loyalty_transactions (user_id, order_id, kind, points, note)
    values (v_uid, v_order_id, 'utilisation', -v_points_used, 'Réduction sur la commande');
  end if;

  return v_order_id;
end;
$$;

-- Le personnel fait avancer une commande d'une étape.
create function public.advance_order(p_order_id uuid, p_status public.order_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  if not private.is_staff() then
    raise exception 'Réservé au personnel' using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found then
    raise exception 'Commande introuvable' using errcode = 'P0002';
  end if;
  if not p_status = any (private.next_order_statuses(v_order.order_type, v_order.status)) then
    raise exception 'Cette commande a déjà changé de statut. Actualise la page.' using errcode = '22023';
  end if;

  update public.orders set status = p_status where id = p_order_id returning * into v_order;

  if p_status = 'livree' then
    perform private.reward_delivered_order(v_order);
  elsif p_status = 'annulee' then
    perform private.refund_cancelled_order(v_order);
  end if;
end;
$$;

-- Le client annule sa commande tant que la cuisine ne l'a pas prise.
create function public.cancel_my_order(p_order_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
begin
  select * into v_order from public.orders
  where id = p_order_id and customer_id = (select auth.uid())
  for update;
  if not found then
    raise exception 'Commande introuvable' using errcode = 'P0002';
  end if;
  if v_order.status <> 'en_attente' then
    raise exception 'La cuisine a déjà commencé ta commande : elle ne peut plus être annulée.' using errcode = '22023';
  end if;

  update public.orders set status = 'annulee' where id = p_order_id returning * into v_order;
  perform private.refund_cancelled_order(v_order);
end;
$$;

-- ---------------------------------------------------------------------------
-- Réclamations : l'employé propose une réponse, le gérant la valide.
-- ---------------------------------------------------------------------------
create function public.respond_complaint(p_complaint_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.complaint_status;
  v_manager boolean := private.is_manager();
begin
  if not private.is_staff() then
    raise exception 'Réservé au personnel' using errcode = '42501';
  end if;
  if p_response is null or char_length(trim(p_response)) not between 5 and 2000 then
    raise exception 'La réponse doit faire entre 5 et 2000 caractères' using errcode = '22023';
  end if;

  select status into v_status from public.complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Réclamation introuvable' using errcode = 'P0002';
  end if;
  if v_status not in ('ouverte', 'en_cours') then
    raise exception 'Cette réclamation a déjà une réponse' using errcode = '22023';
  end if;

  -- La réponse du gérant ou de l'admin vaut décision.
  update public.complaints
  set staff_response = trim(p_response),
      responded_by = (select auth.uid()),
      status = (case when v_manager then 'resolue' else 'reponse_proposee' end)::public.complaint_status,
      decided_by = case when v_manager then (select auth.uid()) end
  where id = p_complaint_id;
end;
$$;

-- p_decision : 'valider' (la réponse est envoyée), 'renvoyer' (l'employé
-- la reprend) ou 'rejeter' (réclamation non fondée).
create function public.decide_complaint(p_complaint_id uuid, p_decision text, p_bonus_points integer default 0)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_complaint public.complaints%rowtype;
  v_validity integer;
begin
  if not private.is_manager() then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
  end if;
  if p_decision not in ('valider', 'renvoyer', 'rejeter') then
    raise exception 'Décision inconnue' using errcode = '22023';
  end if;
  if coalesce(p_bonus_points, 0) not between 0 and 100 then
    raise exception 'Le geste commercial va de 0 à 100 points' using errcode = '22023';
  end if;

  select * into v_complaint from public.complaints where id = p_complaint_id for update;
  if not found then
    raise exception 'Réclamation introuvable' using errcode = 'P0002';
  end if;
  if v_complaint.status in ('resolue', 'rejetee') then
    raise exception 'Cette réclamation est déjà close' using errcode = '22023';
  end if;
  if p_decision in ('valider', 'renvoyer') and v_complaint.status <> 'reponse_proposee' then
    raise exception 'Aucune réponse à valider pour cette réclamation' using errcode = '22023';
  end if;

  update public.complaints
  set status = case p_decision
        when 'valider' then 'resolue'
        when 'renvoyer' then 'en_cours'
        else 'rejetee'
      end::public.complaint_status,
      decided_by = case when p_decision = 'renvoyer' then null else (select auth.uid()) end
  where id = p_complaint_id;

  if p_decision = 'valider' and coalesce(p_bonus_points, 0) > 0 then
    select points_validity_months into v_validity from public.restaurants where id = private.default_restaurant_id();
    update public.profiles set points_balance = points_balance + p_bonus_points where id = v_complaint.customer_id;
    insert into public.loyalty_transactions (user_id, order_id, kind, points, expires_at, note)
    values (
      v_complaint.customer_id, v_complaint.order_id, 'ajustement', p_bonus_points,
      now() + make_interval(months => v_validity), 'Geste commercial suite à ta réclamation'
    );
  end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- Statistiques (personnel uniquement), jours comptés à l'heure de Douala.
-- ---------------------------------------------------------------------------
create function public.get_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_staff() then
    raise exception 'Réservé au personnel' using errcode = '42501';
  end if;
  if p_to <= p_from or p_to - p_from > interval '400 days' then
    raise exception 'Période invalide' using errcode = '22023';
  end if;

  with period_orders as (
    select * from public.orders where created_at >= p_from and created_at < p_to
  ),
  kept as (
    select * from period_orders where status <> 'annulee'
  ),
  days as (
    select (d at time zone 'Africa/Douala')::date as day
    from generate_series(
      date_trunc('day', p_from at time zone 'Africa/Douala') at time zone 'Africa/Douala',
      p_to - interval '1 second',
      interval '1 day'
    ) d
  ),
  by_day as (
    select d.day,
           count(k.id) as orders,
           coalesce(sum(k.total_fcfa), 0) as revenue
    from days d
    left join kept k on (k.created_at at time zone 'Africa/Douala')::date = d.day
    group by d.day
    order by d.day
  ),
  top_items as (
    select oi.item_name as name, sum(oi.quantity) as quantity, sum(oi.quantity * oi.unit_price_fcfa) as revenue
    from public.order_items oi
    join kept k on k.id = oi.order_id
    group by oi.item_name
    order by quantity desc, revenue desc
    limit 5
  ),
  loyalty as (
    select
      coalesce(sum(points) filter (where kind = 'gain'), 0) as earned,
      coalesce(sum(points) filter (where kind = 'parrainage'), 0) as referral
    from public.loyalty_transactions
    where created_at >= p_from and created_at < p_to
  )
  select jsonb_build_object(
    'orders', (select count(*) from kept),
    'cancelled', (select count(*) from period_orders where status = 'annulee'),
    'delivered', (select count(*) from kept where status = 'livree'),
    'revenue', (select coalesce(sum(total_fcfa), 0) from kept),
    'discounts', (select coalesce(sum(discount_fcfa), 0) from kept),
    'average_basket', (select coalesce(round(avg(total_fcfa)), 0) from kept),
    'dine_in', (select count(*) from kept where order_type = 'sur_place'),
    'delivery', (select count(*) from kept where order_type = 'livraison'),
    'customers', (select count(distinct customer_id) from kept),
    'by_day', coalesce((select jsonb_agg(jsonb_build_object('day', day, 'orders', orders, 'revenue', revenue)) from by_day), '[]'::jsonb),
    'top_items', coalesce((select jsonb_agg(to_jsonb(t)) from top_items t), '[]'::jsonb),
    'points_earned', (select earned from loyalty),
    'points_used', (select coalesce(sum(points_used), 0) from kept),
    'referral_points', (select referral from loyalty),
    'referrals_rewarded', (select count(*) from public.referrals where rewarded_at >= p_from and rewarded_at < p_to),
    'new_students', (select count(*) from public.profiles where role = 'etudiant' and created_at >= p_from and created_at < p_to)
  ) into v_result;

  return v_result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Filleuls de l'utilisateur connecté : seulement le prénom, pas le profil.
-- ---------------------------------------------------------------------------
create function public.my_referrals()
returns table (first_name text, joined_at timestamptz, reward_points integer, rewarded_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select split_part(p.full_name, ' ', 1), r.created_at, r.reward_points, r.rewarded_at
  from public.referrals r
  join public.profiles p on p.id = r.referee_id
  where r.referrer_id = (select auth.uid())
  order by r.created_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------
revoke execute on function
  private.next_order_statuses(public.order_type, public.order_status),
  private.reward_delivered_order(public.orders),
  private.refund_cancelled_order(public.orders)
from public;

revoke execute on function
  public.place_order(public.order_type, jsonb, timestamptz, text, integer),
  public.advance_order(uuid, public.order_status),
  public.cancel_my_order(uuid),
  public.respond_complaint(uuid, text),
  public.decide_complaint(uuid, text, integer),
  public.get_stats(timestamptz, timestamptz),
  public.my_referrals()
from public, anon;
grant execute on function
  public.place_order(public.order_type, jsonb, timestamptz, text, integer),
  public.advance_order(uuid, public.order_status),
  public.cancel_my_order(uuid),
  public.respond_complaint(uuid, text),
  public.decide_complaint(uuid, text, integer),
  public.get_stats(timestamptz, timestamptz),
  public.my_referrals()
to authenticated;
