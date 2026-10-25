-- Plats favoris : un étudiant met un plat en favori depuis la carte et
-- retrouve ses favoris dans son espace. Seul l'étudiant a des favoris ; le
-- personnel ne voit pas ceux des clients.

create table public.favorites (
  customer_id uuid not null references public.profiles (id) on delete cascade,
  menu_item_id uuid not null references public.menu_items (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (customer_id, menu_item_id)
);

create index favorites_menu_item_id_idx on public.favorites (menu_item_id);

alter table public.favorites enable row level security;

create policy "Voir ses favoris" on public.favorites
  for select to authenticated
  using (customer_id = (select auth.uid()));

create policy "Un étudiant ajoute un favori" on public.favorites
  for insert to authenticated
  with check (customer_id = (select auth.uid()) and (select private.user_role()) = 'etudiant');

create policy "Retirer un favori" on public.favorites
  for delete to authenticated
  using (customer_id = (select auth.uid()));

grant select, insert, delete on public.favorites to authenticated;
