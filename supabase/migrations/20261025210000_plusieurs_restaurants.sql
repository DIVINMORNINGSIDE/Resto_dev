-- Plusieurs restaurants
-- L'administrateur crée et gère les restaurants de l'enseigne. Chaque
-- employé et chaque gérant est rattaché à un restaurant : il ne voit et ne
-- gère que celui-là (commandes, menu, promotions, réclamations, avis,
-- statistiques, paramètres). L'étudiant choisit le restaurant où il commande.
-- Les points de fidélité, le parrainage, le classement et les mini-jeux
-- restent communs à toute l'enseigne : les points gagnés dans un restaurant
-- se dépensent dans un autre.

-- ---------------------------------------------------------------------------
-- Restaurants : adresse et ouverture aux commandes
-- ---------------------------------------------------------------------------
-- Les règles de nom et d'adresse courte s'appliquent aux nouveaux restaurants
-- (not valid : le restaurant déjà en ligne n'est pas revérifié).
alter table public.restaurants
  add column address text,
  add column is_active boolean not null default true,
  add constraint restaurants_name_length check (char_length(trim(name)) between 2 and 60) not valid,
  add constraint restaurants_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 40) not valid,
  add constraint restaurants_address_length check (address is null or char_length(address) <= 200);

-- ---------------------------------------------------------------------------
-- Le personnel déjà en place est rattaché au premier restaurant
-- ---------------------------------------------------------------------------
update public.profiles
set restaurant_id = private.default_restaurant_id()
where role in ('employe', 'gerant', 'admin') and restaurant_id is null;

-- ---------------------------------------------------------------------------
-- Un plat appartient au même restaurant que sa catégorie
-- ---------------------------------------------------------------------------
alter table public.categories
  add constraint categories_id_restaurant_key unique (id, restaurant_id);
-- Remplace l'ancienne clé (une seule relation plat → catégorie pour l'API).
alter table public.menu_items
  drop constraint menu_items_category_id_fkey,
  add constraint menu_items_category_id_fkey
  foreign key (category_id, restaurant_id) references public.categories (id, restaurant_id) on delete restrict;

create index categories_restaurant_id_idx on public.categories (restaurant_id, position);

-- ---------------------------------------------------------------------------
-- Réclamations : rattachées au restaurant de la commande
-- ---------------------------------------------------------------------------
alter table public.complaints
  add column restaurant_id uuid references public.restaurants (id) on delete restrict;

update public.complaints c
set restaurant_id = coalesce(
  (select o.restaurant_id from public.orders o where o.id = c.order_id),
  private.default_restaurant_id()
);

alter table public.complaints
  alter column restaurant_id set not null,
  alter column restaurant_id set default private.default_restaurant_id();

create index complaints_restaurant_id_idx on public.complaints (restaurant_id, created_at desc);

-- Une réclamation sur une commande va toujours au restaurant de cette commande.
create function private.complaint_restaurant()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.order_id is not null then
    select restaurant_id into new.restaurant_id from public.orders where id = new.order_id;
  end if;
  return new;
end;
$$;

revoke execute on function private.complaint_restaurant() from public;

create trigger complaints_set_restaurant
  before insert on public.complaints
  for each row execute function private.complaint_restaurant();

-- ---------------------------------------------------------------------------
-- Qui travaille où
-- ---------------------------------------------------------------------------
-- Restaurant du compte connecté (null pour un étudiant).
create function private.user_restaurant_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select restaurant_id from public.profiles
  where id = (select auth.uid()) and is_active;
$$;

-- Le personnel de ce restaurant (l'admin travaille partout).
create function private.works_at(p_restaurant uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_admin()
    or (private.is_staff() and p_restaurant is not distinct from private.user_restaurant_id());
$$;

-- Le gérant de ce restaurant, ou l'admin.
create function private.manages(p_restaurant uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select private.is_admin()
    or (private.is_manager() and p_restaurant is not distinct from private.user_restaurant_id());
$$;

revoke execute on function
  private.user_restaurant_id(), private.works_at(uuid), private.manages(uuid)
from public;
grant execute on function
  private.user_restaurant_id(), private.works_at(uuid), private.manages(uuid)
to authenticated;

-- ---------------------------------------------------------------------------
-- Droits d'accès par restaurant
-- ---------------------------------------------------------------------------
-- restaurants : l'admin les crée ; le gérant modifie le sien.
grant insert on public.restaurants to authenticated;

drop policy "Gérant et admin modifient le restaurant" on public.restaurants;
create policy "Le gérant modifie son restaurant, l'admin tous" on public.restaurants
  for update to authenticated
  using ((select private.manages(id)))
  with check ((select private.manages(id)));
create policy "L'admin crée les restaurants" on public.restaurants
  for insert to authenticated
  with check ((select private.is_admin()));

-- categories
drop policy "Gérant et admin créent les catégories" on public.categories;
drop policy "Gérant et admin modifient les catégories" on public.categories;
drop policy "Gérant et admin suppriment les catégories" on public.categories;
create policy "Le gérant crée les catégories de son restaurant" on public.categories
  for insert to authenticated with check ((select private.manages(restaurant_id)));
create policy "Le gérant modifie les catégories de son restaurant" on public.categories
  for update to authenticated
  using ((select private.manages(restaurant_id)))
  with check ((select private.manages(restaurant_id)));
create policy "Le gérant supprime les catégories de son restaurant" on public.categories
  for delete to authenticated using ((select private.manages(restaurant_id)));

-- menu_items
drop policy "Gérant et admin créent les plats" on public.menu_items;
drop policy "Le personnel met à jour les plats" on public.menu_items;
drop policy "Gérant et admin suppriment les plats" on public.menu_items;
create policy "Le gérant crée les plats de son restaurant" on public.menu_items
  for insert to authenticated with check ((select private.manages(restaurant_id)));
create policy "Le personnel met à jour les plats de son restaurant" on public.menu_items
  for update to authenticated
  using ((select private.works_at(restaurant_id)))
  with check ((select private.works_at(restaurant_id)));
create policy "Le gérant supprime les plats de son restaurant" on public.menu_items
  for delete to authenticated using ((select private.manages(restaurant_id)));

-- promotions
drop policy "Promotions actives visibles par tous" on public.promotions;
drop policy "Gérant et admin créent les promotions" on public.promotions;
drop policy "Gérant et admin modifient les promotions" on public.promotions;
drop policy "Gérant et admin suppriment les promotions" on public.promotions;
create policy "Promotions actives visibles par tous" on public.promotions
  for select to anon, authenticated
  using (is_active or (select private.manages(restaurant_id)));
create policy "Le gérant crée les promotions de son restaurant" on public.promotions
  for insert to authenticated with check ((select private.manages(restaurant_id)));
create policy "Le gérant modifie les promotions de son restaurant" on public.promotions
  for update to authenticated
  using ((select private.manages(restaurant_id)))
  with check ((select private.manages(restaurant_id)));
create policy "Le gérant supprime les promotions de son restaurant" on public.promotions
  for delete to authenticated using ((select private.manages(restaurant_id)));

-- orders et order_items
drop policy "Voir ses commandes, le personnel voit tout" on public.orders;
create policy "Voir ses commandes, le personnel voit celles de son restaurant" on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.works_at(restaurant_id)));

drop policy "Lignes visibles avec leur commande" on public.order_items;
create policy "Lignes visibles avec leur commande" on public.order_items
  for select to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (o.customer_id = (select auth.uid()) or (select private.works_at(o.restaurant_id)))
    )
  );

-- complaints
drop policy "Voir ses réclamations, le gérant et l'admin voient tout" on public.complaints;
create policy "Voir ses réclamations, le gérant voit celles de son restaurant" on public.complaints
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.manages(restaurant_id)));

drop policy "Un client dépose une réclamation sur sa commande" on public.complaints;
create policy "Un client dépose une réclamation sur sa commande" on public.complaints
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'ouverte'
    and staff_response is null
    and responded_by is null
    and decided_by is null
    and exists (select 1 from public.restaurants r where r.id = restaurant_id and r.is_active)
    and (
      order_id is null
      or exists (
        select 1 from public.orders o
        where o.id = order_id and o.customer_id = (select auth.uid())
      )
    )
  );

-- ---------------------------------------------------------------------------
-- Passer commande dans le restaurant choisi
-- ---------------------------------------------------------------------------
drop function public.place_order(public.order_type, jsonb, timestamptz, text, integer);

create function public.place_order(
  p_order_type public.order_type,
  p_items jsonb,
  p_arrival_time timestamptz default null,
  p_delivery_address text default null,
  p_redeem_blocks integer default 0,
  p_restaurant_id uuid default null
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
  select * into v_restaurant from public.restaurants
  where id = coalesce(p_restaurant_id, private.default_restaurant_id());
  if not found or not v_restaurant.is_active then
    raise exception 'Ce restaurant ne prend pas de commandes pour le moment. Choisis-en un autre.'
      using errcode = '22023';
  end if;

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

  -- Tous les plats doivent venir de la carte du restaurant choisi.
  select count(m.id), count(*), sum(m.price_fcfa * w.quantity)
  into v_found, v_wanted, v_subtotal
  from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int)
  left join public.menu_items m
    on m.id = w.menu_item_id and m.is_available and m.restaurant_id = v_restaurant.id;

  if v_found <> v_wanted then
    select m.name into v_missing
    from jsonb_to_recordset(v_lines) as w(menu_item_id uuid, quantity int)
    left join public.menu_items m on m.id = w.menu_item_id
    where m.id is null or not m.is_available or m.restaurant_id <> v_restaurant.id
    limit 1;
    raise exception '% n''est plus disponible dans ce restaurant. Retire-le du panier.', coalesce(v_missing, 'Un plat')
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

  -- Points de fidélité utilisés comme réduction, selon les règles du restaurant.
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

revoke execute on function public.place_order(public.order_type, jsonb, timestamptz, text, integer, uuid) from public, anon;
grant execute on function public.place_order(public.order_type, jsonb, timestamptz, text, integer, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Le personnel ne fait avancer que les commandes de son restaurant
-- ---------------------------------------------------------------------------
create or replace function public.advance_order(p_order_id uuid, p_status public.order_status)
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
  if p_status in ('en_preparation', 'annulee') and not private.is_manager() then
    raise exception 'Seuls le gérant et l''administrateur valident ou annulent une commande'
      using errcode = '42501';
  end if;

  select * into v_order from public.orders where id = p_order_id for update;
  if not found or not private.works_at(v_order.restaurant_id) then
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

-- ---------------------------------------------------------------------------
-- Réclamations : traitées par le gérant du restaurant concerné
-- ---------------------------------------------------------------------------
create or replace function public.respond_complaint(p_complaint_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_complaint public.complaints%rowtype;
begin
  if not private.is_manager() then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
  end if;
  if p_response is null or char_length(trim(p_response)) not between 5 and 2000 then
    raise exception 'La réponse doit faire entre 5 et 2000 caractères' using errcode = '22023';
  end if;

  select * into v_complaint from public.complaints where id = p_complaint_id for update;
  if not found or not private.manages(v_complaint.restaurant_id) then
    raise exception 'Réclamation introuvable' using errcode = 'P0002';
  end if;
  if v_complaint.status not in ('ouverte', 'en_cours') then
    raise exception 'Cette réclamation a déjà une réponse' using errcode = '22023';
  end if;

  update public.complaints
  set staff_response = trim(p_response),
      responded_by = (select auth.uid()),
      status = 'resolue',
      decided_by = (select auth.uid())
  where id = p_complaint_id;
end;
$$;

create or replace function public.decide_complaint(p_complaint_id uuid, p_decision text, p_bonus_points integer default 0)
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
  if not found or not private.manages(v_complaint.restaurant_id) then
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
    select points_validity_months into v_validity from public.restaurants where id = v_complaint.restaurant_id;
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
-- Avis : le gérant gère ceux de son restaurant ; l'accueil montre ceux du
-- restaurant affiché.
-- ---------------------------------------------------------------------------
create or replace function public.set_review_hidden(p_order_id uuid, p_hidden boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_manager() then
    raise exception 'Seuls le gérant et l''administrateur gèrent les avis' using errcode = '42501';
  end if;

  update public.orders
  set review_hidden = coalesce(p_hidden, true)
  where id = p_order_id and commented_at is not null and private.manages(restaurant_id);
  if not found then
    raise exception 'Avis introuvable' using errcode = 'P0002';
  end if;
end;
$$;

drop function public.public_reviews(integer);

create function public.public_reviews(p_limit integer default 6, p_restaurant_id uuid default null)
returns table (author text, comment text, commented_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  -- Même forme de nom que le classement des clients.
  select
    split_part(trim(p.full_name), ' ', 1)
      || coalesce(' ' || nullif(left(split_part(trim(p.full_name), ' ', 2), 1), '') || '.', ''),
    o.customer_comment,
    o.commented_at
  from public.orders o
  join public.profiles p on p.id = o.customer_id
  where o.commented_at is not null
    and o.customer_comment is not null
    and not o.review_hidden
    and p.is_active
    and (p_restaurant_id is null or o.restaurant_id = p_restaurant_id)
  order by o.commented_at desc
  limit least(greatest(coalesce(p_limit, 6), 1), 12);
$$;

revoke execute on function public.public_reviews(integer, uuid) from public;
grant execute on function public.public_reviews(integer, uuid) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Notifications : seulement le personnel du restaurant de la commande
-- ---------------------------------------------------------------------------
create or replace function public.order_push_targets(p_order_id uuid, p_status public.order_status)
returns table (endpoint text, p256dh text, auth text, order_type public.order_type)
language sql
stable
security definer
set search_path = ''
as $$
  select s.endpoint, s.p256dh, s.auth, o.order_type
  from public.orders o
  join public.push_subscriptions s on s.user_id = o.customer_id
  where o.id = p_order_id
    and o.status = p_status
    and o.updated_at > now() - interval '2 minutes'
    and private.works_at(o.restaurant_id);
$$;

-- ---------------------------------------------------------------------------
-- Statistiques d'un restaurant. Le gérant voit toujours le sien ; l'admin
-- choisit un restaurant, ou toute l'enseigne avec null.
-- ---------------------------------------------------------------------------
drop function public.get_stats(timestamptz, timestamptz);

create function public.get_stats(p_from timestamptz, p_to timestamptz, p_restaurant_id uuid default null)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_result jsonb;
  v_restaurant uuid := case when private.is_admin() then p_restaurant_id else private.user_restaurant_id() end;
begin
  if not private.is_manager() then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
  end if;
  if p_to <= p_from or p_to - p_from > interval '400 days' then
    raise exception 'Période invalide' using errcode = '22023';
  end if;

  with period_orders as (
    select * from public.orders
    where created_at >= p_from and created_at < p_to
      and (v_restaurant is null or restaurant_id = v_restaurant)
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
  -- Points gagnés sur les commandes du restaurant (toute l'enseigne sinon).
  loyalty as (
    select
      coalesce(sum(t.points) filter (where t.kind = 'gain'), 0) as earned,
      coalesce(sum(t.points) filter (where t.kind = 'parrainage'), 0) as referral
    from public.loyalty_transactions t
    left join public.orders o on o.id = t.order_id
    where t.created_at >= p_from and t.created_at < p_to
      and (v_restaurant is null or o.restaurant_id = v_restaurant)
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

revoke execute on function public.get_stats(timestamptz, timestamptz, uuid) from public, anon;
grant execute on function public.get_stats(timestamptz, timestamptz, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Personnel : l'admin choisit le restaurant de chaque employé et gérant
-- ---------------------------------------------------------------------------
drop function public.assign_staff_role(text, public.app_role);
drop function public.set_staff_role(uuid, public.app_role);

create function public.set_staff_role(p_user_id uuid, p_role public.app_role, p_restaurant_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_restaurant uuid;
begin
  perform private.assert_can_manage_staff(p_user_id, p_role);

  if p_role <> 'etudiant' then
    v_restaurant := coalesce(
      p_restaurant_id,
      (select restaurant_id from public.profiles where id = p_user_id),
      private.default_restaurant_id()
    );
    if not exists (select 1 from public.restaurants where id = v_restaurant) then
      raise exception 'Restaurant introuvable' using errcode = 'P0002';
    end if;
  end if;

  update public.profiles
  set role = p_role, restaurant_id = v_restaurant
  where id = p_user_id;
end;
$$;

-- Donne un rôle à un compte existant. Renvoie null si l'email est inconnu.
create function public.assign_staff_role(p_email text, p_role public.app_role, p_restaurant_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  if not private.is_admin() then
    raise exception 'Réservé à l''administrateur' using errcode = '42501';
  end if;

  select id into v_target from public.profiles where email = lower(trim(p_email));
  if v_target is null then
    return null;
  end if;

  perform public.set_staff_role(v_target, p_role, p_restaurant_id);
  return v_target;
end;
$$;

revoke execute on function
  public.assign_staff_role(text, public.app_role, uuid),
  public.set_staff_role(uuid, public.app_role, uuid)
from public, anon;
grant execute on function
  public.assign_staff_role(text, public.app_role, uuid),
  public.set_staff_role(uuid, public.app_role, uuid)
to authenticated;
