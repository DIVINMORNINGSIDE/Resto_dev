-- Mon Miam Miam : schéma initial
-- Rôles, restaurant, menu, commandes, fidélité, parrainage, réclamations, promotions.
-- Toutes les tables du schéma public ont la RLS activée.

create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
create type public.app_role as enum ('etudiant', 'employe', 'gerant', 'admin');
create type public.order_type as enum ('sur_place', 'livraison');
create type public.order_status as enum (
  'en_attente', 'en_preparation', 'prete', 'en_livraison', 'livree', 'annulee'
);
create type public.loyalty_kind as enum ('gain', 'utilisation', 'parrainage', 'expiration', 'ajustement');
create type public.complaint_status as enum ('ouverte', 'en_cours', 'reponse_proposee', 'resolue', 'rejetee');
create type public.promotion_kind as enum ('promotion', 'evenement');

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Restaurant (une seule ligne pour l'instant, prêt pour plusieurs restaurants)
-- ---------------------------------------------------------------------------
create table public.restaurants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  opening_hours jsonb not null default '{}'::jsonb,
  -- Fidélité : 1 point par tranche de fcfa_per_point dépensée
  fcfa_per_point integer not null default 1000 check (fcfa_per_point > 0),
  -- Utilisation : redeem_points_block points = redeem_value_fcfa de réduction
  redeem_points_block integer not null default 15 check (redeem_points_block > 0),
  redeem_value_fcfa integer not null default 1000 check (redeem_value_fcfa > 0),
  points_validity_months integer not null default 12 check (points_validity_months > 0),
  referral_bonus_points integer not null default 5 check (referral_bonus_points >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger restaurants_set_updated_at
  before update on public.restaurants
  for each row execute function private.set_updated_at();

create function private.default_restaurant_id()
returns uuid
language sql
stable
set search_path = ''
as $$
  select id from public.restaurants order by created_at limit 1;
$$;

-- ---------------------------------------------------------------------------
-- Profils (1 par compte auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  restaurant_id uuid references public.restaurants (id) on delete set null,
  email text not null,
  full_name text not null,
  phone text,
  delivery_address text,
  role public.app_role not null default 'etudiant',
  referral_code text not null unique,
  referred_by uuid references public.profiles (id) on delete set null,
  points_balance integer not null default 0 check (points_balance >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index profiles_restaurant_id_idx on public.profiles (restaurant_id);
create index profiles_referred_by_idx on public.profiles (referred_by);
create index profiles_role_idx on public.profiles (role);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- Rôle du compte connecté. SECURITY DEFINER pour éviter la récursion RLS sur
-- profiles ; ne renvoie que le rôle de l'appelant, dans un schéma non exposé.
create function private.user_role()
returns public.app_role
language sql
stable
security definer
set search_path = ''
as $$
  select role from public.profiles
  where id = (select auth.uid()) and is_active;
$$;

create function private.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.user_role() in ('employe', 'gerant', 'admin'), false);
$$;

create function private.is_manager()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.user_role() in ('gerant', 'admin'), false);
$$;

create function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.user_role() = 'admin', false);
$$;

revoke execute on all functions in schema private from public;
grant execute on function
  private.user_role(), private.is_staff(), private.is_manager(), private.is_admin(),
  private.default_restaurant_id()
to authenticated;

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null default private.default_restaurant_id()
    references public.restaurants (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  unique (restaurant_id, name)
);

create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null default private.default_restaurant_id()
    references public.restaurants (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete restrict,
  name text not null,
  description text,
  price_fcfa integer not null check (price_fcfa >= 0),
  image_url text,
  is_available boolean not null default true,
  is_dish_of_day boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index menu_items_restaurant_id_idx on public.menu_items (restaurant_id);
create index menu_items_category_id_idx on public.menu_items (category_id);

create trigger menu_items_set_updated_at
  before update on public.menu_items
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Commandes
-- ---------------------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null default private.default_restaurant_id()
    references public.restaurants (id) on delete restrict,
  customer_id uuid not null references public.profiles (id) on delete restrict,
  order_type public.order_type not null,
  status public.order_status not null default 'en_attente',
  arrival_time timestamptz,
  delivery_address text,
  subtotal_fcfa integer not null check (subtotal_fcfa >= 0),
  discount_fcfa integer not null default 0 check (discount_fcfa >= 0),
  total_fcfa integer not null check (total_fcfa >= 0),
  points_earned integer not null default 0 check (points_earned >= 0),
  points_used integer not null default 0 check (points_used >= 0),
  customer_comment text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (total_fcfa = subtotal_fcfa - discount_fcfa),
  check (order_type = 'sur_place' or delivery_address is not null)
);

create index orders_customer_id_idx on public.orders (customer_id);
create index orders_restaurant_status_idx on public.orders (restaurant_id, status, created_at desc);

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute function private.set_updated_at();

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete restrict,
  item_name text not null,
  unit_price_fcfa integer not null check (unit_price_fcfa >= 0),
  quantity integer not null check (quantity > 0)
);

create index order_items_order_id_idx on public.order_items (order_id);
create index order_items_menu_item_id_idx on public.order_items (menu_item_id);

-- ---------------------------------------------------------------------------
-- Fidélité et parrainage
-- ---------------------------------------------------------------------------
create table public.loyalty_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  kind public.loyalty_kind not null,
  points integer not null check (points <> 0),
  expires_at timestamptz,
  note text,
  created_at timestamptz not null default now()
);

create index loyalty_transactions_user_id_idx on public.loyalty_transactions (user_id, created_at desc);
create index loyalty_transactions_order_id_idx on public.loyalty_transactions (order_id);

create table public.referrals (
  id uuid primary key default gen_random_uuid(),
  referrer_id uuid not null references public.profiles (id) on delete cascade,
  referee_id uuid not null unique references public.profiles (id) on delete cascade,
  reward_points integer,
  rewarded_at timestamptz,
  created_at timestamptz not null default now(),
  check (referrer_id <> referee_id)
);

create index referrals_referrer_id_idx on public.referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- Réclamations
-- ---------------------------------------------------------------------------
create table public.complaints (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.profiles (id) on delete cascade,
  order_id uuid references public.orders (id) on delete set null,
  subject text not null,
  message text not null,
  status public.complaint_status not null default 'ouverte',
  staff_response text,
  responded_by uuid references public.profiles (id) on delete set null,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index complaints_customer_id_idx on public.complaints (customer_id);
create index complaints_order_id_idx on public.complaints (order_id);
create index complaints_status_idx on public.complaints (status, created_at desc);
create index complaints_responded_by_idx on public.complaints (responded_by);
create index complaints_decided_by_idx on public.complaints (decided_by);

create trigger complaints_set_updated_at
  before update on public.complaints
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Promotions et événements
-- ---------------------------------------------------------------------------
create table public.promotions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null default private.default_restaurant_id()
    references public.restaurants (id) on delete cascade,
  kind public.promotion_kind not null default 'promotion',
  title text not null,
  description text,
  poster_url text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at is null or ends_at >= starts_at)
);

create index promotions_restaurant_id_idx on public.promotions (restaurant_id);

-- ---------------------------------------------------------------------------
-- Création automatique du profil à l'inscription
-- Le rôle vient toujours de la valeur par défaut (etudiant), jamais des
-- métadonnées fournies par l'utilisateur.
-- ---------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_referrer uuid;
  v_meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
begin
  loop
    v_code := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));
    exit when not exists (select 1 from public.profiles where referral_code = v_code);
  end loop;

  if nullif(trim(v_meta ->> 'referral_code'), '') is not null then
    select id into v_referrer
    from public.profiles
    where referral_code = upper(trim(v_meta ->> 'referral_code'));
  end if;

  insert into public.profiles (id, email, full_name, phone, delivery_address, referral_code, referred_by)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(v_meta ->> 'full_name'), ''), split_part(new.email, '@', 1)),
    nullif(trim(v_meta ->> 'phone'), ''),
    nullif(trim(v_meta ->> 'delivery_address'), ''),
    v_code,
    v_referrer
  );

  if v_referrer is not null then
    insert into public.referrals (referrer_id, referee_id) values (v_referrer, new.id);
  end if;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- ---------------------------------------------------------------------------
-- Droits d'accès aux tables (Data API)
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon, authenticated;

grant select on public.restaurants, public.categories, public.menu_items, public.promotions to anon;

grant select on all tables in schema public to authenticated;
grant update on public.restaurants to authenticated;
grant insert, update, delete on public.categories, public.menu_items, public.promotions to authenticated;
grant update on public.orders to authenticated;
grant insert, update on public.complaints to authenticated;
-- Un utilisateur ne modifie que ces colonnes de son profil (jamais son rôle ni ses points).
grant update (full_name, phone, delivery_address) on public.profiles to authenticated;
-- Commandes, lignes, points et parrainages : écrits uniquement par des fonctions
-- serveur (étape 3), jamais directement par le navigateur.

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.restaurants enable row level security;
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.menu_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.loyalty_transactions enable row level security;
alter table public.referrals enable row level security;
alter table public.complaints enable row level security;
alter table public.promotions enable row level security;

-- restaurants
create policy "Restaurant visible par tous" on public.restaurants
  for select to anon, authenticated using (true);
create policy "Admin modifie le restaurant" on public.restaurants
  for update to authenticated
  using ((select private.is_admin()))
  with check ((select private.is_admin()));

-- profiles
create policy "Voir son profil, le personnel voit tous les profils" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.is_staff()));
create policy "Modifier son propre profil" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- categories
create policy "Catégories visibles par tous" on public.categories
  for select to anon, authenticated using (true);
create policy "Gérant et admin créent les catégories" on public.categories
  for insert to authenticated with check ((select private.is_manager()));
create policy "Gérant et admin modifient les catégories" on public.categories
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Gérant et admin suppriment les catégories" on public.categories
  for delete to authenticated using ((select private.is_manager()));

-- menu_items
create policy "Plats visibles par tous" on public.menu_items
  for select to anon, authenticated using (true);
create policy "Gérant et admin créent les plats" on public.menu_items
  for insert to authenticated with check ((select private.is_manager()));
create policy "Le personnel met à jour les plats" on public.menu_items
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));
create policy "Gérant et admin suppriment les plats" on public.menu_items
  for delete to authenticated using ((select private.is_manager()));

-- orders
create policy "Voir ses commandes, le personnel voit tout" on public.orders
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_staff()));
create policy "Le personnel fait avancer les commandes" on public.orders
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- order_items
create policy "Lignes visibles avec leur commande" on public.order_items
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.orders o
      where o.id = order_id and o.customer_id = (select auth.uid())
    )
  );

-- loyalty_transactions
create policy "Voir ses points, le personnel voit tout" on public.loyalty_transactions
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_staff()));

-- referrals
create policy "Voir ses parrainages, le personnel voit tout" on public.referrals
  for select to authenticated
  using (
    referrer_id = (select auth.uid())
    or referee_id = (select auth.uid())
    or (select private.is_staff())
  );

-- complaints
create policy "Voir ses réclamations, le personnel voit tout" on public.complaints
  for select to authenticated
  using (customer_id = (select auth.uid()) or (select private.is_staff()));
create policy "Un client dépose une réclamation sur sa commande" on public.complaints
  for insert to authenticated
  with check (
    customer_id = (select auth.uid())
    and status = 'ouverte'
    and staff_response is null
    and responded_by is null
    and decided_by is null
    and (
      order_id is null
      or exists (
        select 1 from public.orders o
        where o.id = order_id and o.customer_id = (select auth.uid())
      )
    )
  );
create policy "Le personnel traite les réclamations" on public.complaints
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- promotions
create policy "Promotions actives visibles par tous" on public.promotions
  for select to anon, authenticated
  using (is_active or (select private.is_staff()));
create policy "Gérant et admin créent les promotions" on public.promotions
  for insert to authenticated with check ((select private.is_manager()));
create policy "Gérant et admin modifient les promotions" on public.promotions
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Gérant et admin suppriment les promotions" on public.promotions
  for delete to authenticated using ((select private.is_manager()));

-- ---------------------------------------------------------------------------
-- Temps réel : l'écran employé suit les commandes en direct
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.orders;
