-- Notifications sur le téléphone (Web Push) : chaque appareil d'un client
-- s'abonne, et le serveur le prévient quand sa commande change de statut.

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  endpoint text not null unique check (endpoint like 'https://%' and char_length(endpoint) <= 1000),
  p256dh text not null check (char_length(p256dh) <= 200),
  auth text not null check (char_length(auth) <= 100),
  user_agent text check (char_length(user_agent) <= 300),
  created_at timestamptz not null default now()
);

create index push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;

-- Chacun ne voit et ne gère que les appareils de son compte.
create policy "Voir ses appareils" on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
create policy "Retirer ses appareils" on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));

-- Abonne l'appareil au compte connecté. Un même appareil qui change de compte
-- passe au nouveau compte (l'adresse d'abonnement est unique).
create function public.save_push_subscription(p_endpoint text, p_p256dh text, p_auth text, p_user_agent text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then
    raise exception 'Connecte-toi pour activer les notifications' using errcode = '42501';
  end if;
  if p_endpoint is null or p_endpoint not like 'https://%' or char_length(p_endpoint) > 1000
     or coalesce(char_length(p_p256dh), 0) not between 1 and 200
     or coalesce(char_length(p_auth), 0) not between 1 and 100 then
    raise exception 'Abonnement invalide' using errcode = '22023';
  end if;

  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (v_uid, p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth,
        user_agent = excluded.user_agent, created_at = now();
end;
$$;

-- Appareils à prévenir après un changement de statut. Réservé au personnel,
-- et seulement juste après le changement (la commande doit être dans ce
-- statut depuis moins de deux minutes) : on ne peut pas s'en servir pour
-- lister les appareils des clients.
create function public.order_push_targets(p_order_id uuid, p_status public.order_status)
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
    and private.is_staff();
$$;

-- Le serveur retire un appareil dont l'abonnement a expiré (réponse 404/410).
create function public.forget_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = ''
as $$
  delete from public.push_subscriptions s
  where s.endpoint = p_endpoint
    and (s.user_id = (select auth.uid()) or private.is_staff());
$$;

revoke execute on function
  public.save_push_subscription(text, text, text, text),
  public.order_push_targets(uuid, public.order_status),
  public.forget_push_subscription(text)
from public, anon;
grant execute on function
  public.save_push_subscription(text, text, text, text),
  public.order_push_targets(uuid, public.order_status),
  public.forget_push_subscription(text)
to authenticated;
