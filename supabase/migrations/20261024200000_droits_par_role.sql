-- Droits de chaque rôle
-- Étudiant : seul compte qui passe commande.
-- Employé : voit les commandes et le menu, fait avancer une commande déjà
--   validée (prête, servie, livrée) et change la disponibilité des plats.
-- Gérant : en plus, valide ou annule les commandes, gère le menu, les
--   réclamations, les statistiques, les paramètres et les promotions.
-- Admin : tout, y compris la gestion du personnel (seul à pouvoir le faire).

-- ---------------------------------------------------------------------------
-- Seul un compte étudiant passe commande
-- ---------------------------------------------------------------------------
create function private.only_students_order()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.profiles where id = new.customer_id and role = 'etudiant'
  ) then
    raise exception 'Seul un compte étudiant peut passer commande' using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function private.only_students_order() from public;

create trigger orders_only_students
  before insert on public.orders
  for each row execute function private.only_students_order();

-- ---------------------------------------------------------------------------
-- Commandes : l'employé fait avancer, le gérant et l'admin valident
-- (en attente -> en préparation) et annulent.
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

-- ---------------------------------------------------------------------------
-- Réclamations : gérant et admin seulement, leur réponse clôt la réclamation.
-- ---------------------------------------------------------------------------
drop policy "Voir ses réclamations, le personnel voit tout" on public.complaints;
create policy "Voir ses réclamations, le gérant et l'admin voient tout" on public.complaints
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_manager()));

create or replace function public.respond_complaint(p_complaint_id uuid, p_response text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status public.complaint_status;
begin
  if not private.is_manager() then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
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

  update public.complaints
  set staff_response = trim(p_response),
      responded_by = (select auth.uid()),
      status = 'resolue',
      decided_by = (select auth.uid())
  where id = p_complaint_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Statistiques, points et parrainages : gérant et admin seulement
-- ---------------------------------------------------------------------------
create or replace function public.get_stats(p_from timestamptz, p_to timestamptz)
returns jsonb
language plpgsql
stable
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not private.is_manager() then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
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

drop policy "Voir ses points, le personnel voit tout" on public.loyalty_transactions;
create policy "Voir ses points, le gérant et l'admin voient tout" on public.loyalty_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_manager()));

drop policy "Voir ses parrainages, le personnel voit tout" on public.referrals;
create policy "Voir ses parrainages, le gérant et l'admin voient tout" on public.referrals
  for select to authenticated
  using (
    referrer_id = (select auth.uid())
    or referee_id = (select auth.uid())
    or (select private.is_manager())
  );

-- ---------------------------------------------------------------------------
-- Promotions et paramètres : gérant et admin
-- ---------------------------------------------------------------------------
drop policy "Promotions actives visibles par tous" on public.promotions;
create policy "Promotions actives visibles par tous" on public.promotions
  for select to anon, authenticated
  using (is_active or (select private.is_manager()));

drop policy "Admin modifie le restaurant" on public.restaurants;
create policy "Gérant et admin modifient le restaurant" on public.restaurants
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));

-- ---------------------------------------------------------------------------
-- Personnel : seul l'admin crée, modifie ou désactive un compte du personnel.
-- Un gérant ne peut donc ni nommer un admin ni toucher à un autre compte.
-- ---------------------------------------------------------------------------
create or replace function private.assert_can_manage_staff(p_target uuid, p_new_role public.app_role)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'Réservé à l''administrateur' using errcode = '42501';
  end if;

  if p_target = (select auth.uid()) then
    raise exception 'Tu ne peux pas modifier ton propre compte' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = p_target) then
    raise exception 'Compte introuvable' using errcode = 'P0002';
  end if;
end;
$$;

create or replace function public.assign_staff_role(p_email text, p_role public.app_role)
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

  perform public.set_staff_role(v_target, p_role);
  return v_target;
end;
$$;
