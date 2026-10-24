-- Mon compte : photo de profil pour tous les rôles.

-- ---------------------------------------------------------------------------
-- Chemin de la photo dans le bucket « avatars », toujours rangée dans le
-- dossier du compte (<id>/<fichier>). Le site en déduit l'adresse publique.
-- ---------------------------------------------------------------------------
alter table public.profiles add column avatar_path text;
alter table public.profiles add constraint profiles_avatar_path_check check (
  avatar_path is null
  or avatar_path ~ ('^' || id::text || '/[0-9a-f-]{36}\.(jpg|png|webp)$')
);

-- Chacun peut changer sa photo (le reste du profil suit les droits existants).
grant update (avatar_path) on public.profiles to authenticated;

-- ---------------------------------------------------------------------------
-- Photos de profil (Supabase Storage)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

-- Le bucket est public en lecture par adresse ; ces règles ne concernent que
-- les fichiers du dossier de l'utilisateur connecté.
create policy "Chacun voit ses photos de profil" on storage.objects
  for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Chacun ajoute sa photo de profil" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Chacun supprime ses photos de profil" on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text);
