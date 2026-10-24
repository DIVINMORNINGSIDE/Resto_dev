-- Étape 2 : back-office
-- Photos des plats, limites de l'employé sur le menu, gestion du personnel.

-- ---------------------------------------------------------------------------
-- Photos des plats (Supabase Storage)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('menu-photos', 'menu-photos', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "Gérant et admin voient les photos du menu" on storage.objects
  for select to authenticated
  using (bucket_id = 'menu-photos' and (select private.is_manager()));
create policy "Gérant et admin ajoutent des photos du menu" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'menu-photos' and (select private.is_manager()));
create policy "Gérant et admin remplacent des photos du menu" on storage.objects
  for update to authenticated
  using (bucket_id = 'menu-photos' and (select private.is_manager()))
  with check (bucket_id = 'menu-photos' and (select private.is_manager()));
create policy "Gérant et admin suppriment des photos du menu" on storage.objects
  for delete to authenticated
  using (bucket_id = 'menu-photos' and (select private.is_manager()));

-- ---------------------------------------------------------------------------
-- Un employé ne change que la disponibilité et le plat du jour
-- (le gérant et l'admin modifient tout). Les mises à jour faites hors de
-- l'API (migrations, tableau de bord Supabase) ne sont pas concernées.
-- ---------------------------------------------------------------------------
create function private.limit_employee_menu_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if current_user = 'authenticated'
     and not private.is_manager()
     and (new.restaurant_id, new.category_id, new.name, new.description, new.price_fcfa, new.image_url)
         is distinct from
         (old.restaurant_id, old.category_id, old.name, old.description, old.price_fcfa, old.image_url)
  then
    raise exception 'Un employé ne peut modifier que la disponibilité et le plat du jour'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger menu_items_limit_employee_update
  before update on public.menu_items
  for each row execute function private.limit_employee_menu_update();

revoke execute on function private.limit_employee_menu_update() from public;
grant execute on function private.limit_employee_menu_update() to authenticated;

-- ---------------------------------------------------------------------------
-- Gestion du personnel
-- Le gérant gère les employés ; l'admin gère tous les rôles.
-- Personne ne modifie son propre compte (évite de se retirer l'accès).
-- ---------------------------------------------------------------------------
create function private.assert_can_manage_staff(p_target uuid, p_new_role public.app_role)
returns void
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_caller public.app_role := private.user_role();
  v_target_role public.app_role;
begin
  if v_caller is null or v_caller not in ('gerant', 'admin') then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
  end if;

  if p_target = (select auth.uid()) then
    raise exception 'Tu ne peux pas modifier ton propre compte' using errcode = '42501';
  end if;

  select role into v_target_role from public.profiles where id = p_target;
  if v_target_role is null then
    raise exception 'Compte introuvable' using errcode = 'P0002';
  end if;

  if v_caller = 'gerant'
     and (v_target_role not in ('etudiant', 'employe')
          or coalesce(p_new_role, 'employe') not in ('etudiant', 'employe')) then
    raise exception 'Un gérant ne gère que les comptes employés' using errcode = '42501';
  end if;
end;
$$;

-- Donne un rôle à un compte existant. Renvoie null si l'email est inconnu.
create function public.assign_staff_role(p_email text, p_role public.app_role)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid;
begin
  if private.user_role() is null or private.user_role() not in ('gerant', 'admin') then
    raise exception 'Réservé au gérant et à l''administrateur' using errcode = '42501';
  end if;

  select id into v_target from public.profiles where email = lower(trim(p_email));
  if v_target is null then
    return null;
  end if;

  perform public.set_staff_role(v_target, p_role);
  return v_target;
end;
$$;

create function public.set_staff_role(p_user_id uuid, p_role public.app_role)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_can_manage_staff(p_user_id, p_role);

  update public.profiles
  set role = p_role,
      restaurant_id = case
        when p_role = 'etudiant' then null
        else coalesce(
          (select restaurant_id from public.profiles where id = (select auth.uid())),
          private.default_restaurant_id()
        )
      end
  where id = p_user_id;
end;
$$;

create function public.set_staff_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.assert_can_manage_staff(p_user_id, null);
  update public.profiles set is_active = p_active where id = p_user_id;
end;
$$;

revoke execute on function private.assert_can_manage_staff(uuid, public.app_role) from public;
revoke execute on function public.assign_staff_role(text, public.app_role) from public, anon;
revoke execute on function public.set_staff_role(uuid, public.app_role) from public, anon;
revoke execute on function public.set_staff_active(uuid, boolean) from public, anon;
grant execute on function public.assign_staff_role(text, public.app_role) to authenticated;
grant execute on function public.set_staff_role(uuid, public.app_role) to authenticated;
grant execute on function public.set_staff_active(uuid, boolean) to authenticated;
