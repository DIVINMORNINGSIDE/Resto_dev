-- Données de démonstration Mon Miam Miam (développement local uniquement).
-- Mot de passe de tous les comptes de démo : MiamMiam2026

insert into public.restaurants (id, name, slug, opening_hours)
values (
  '00000000-0000-4000-8000-000000000001',
  'ZeDuc@Space',
  'zeduc-space',
  '{"lundi": "11:00 – 22:00", "mardi": "11:00 – 22:00", "mercredi": "11:00 – 22:00", "jeudi": "11:00 – 22:00", "vendredi": "11:00 – 23:00", "samedi": "12:00 – 23:00", "dimanche": "Fermé"}'
);

insert into public.categories (id, name, position) values
  ('00000000-0000-4000-8000-000000000101', 'Plats', 1),
  ('00000000-0000-4000-8000-000000000102', 'Grillades', 2),
  ('00000000-0000-4000-8000-000000000103', 'Boissons', 3);

insert into public.menu_items (category_id, name, description, price_fcfa, image_url, is_available, is_dish_of_day) values
  ('00000000-0000-4000-8000-000000000101', 'Poulet DG', 'Poulet fermier, plantains mûrs, carottes et haricots verts sautés.', 3500, '/photos/poulet.jpg', true, true),
  ('00000000-0000-4000-8000-000000000101', 'Ndolé crevettes', 'Feuilles de ndolé, arachides, crevettes, servi avec miondo.', 4000, '/photos/ndole.jpg', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Poisson braisé', 'Bar braisé au feu de bois, bâton de manioc, piment maison.', 5000, '/photos/poisson.jpg', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Brochettes de bœuf', 'Trois brochettes marinées, oignons grillés, frites de plantain.', 2000, '/photos/brochette.jpg', true, false),
  ('00000000-0000-4000-8000-000000000101', 'Riz sauté poulet', 'Riz sauté, poulet, légumes croquants.', 2500, '/photos/riz.jpg', false, false),
  ('00000000-0000-4000-8000-000000000101', 'Spaghetti omelette', 'Le classique de la terrasse, sauce tomate épicée.', 1500, '/photos/spag.jpg', true, false),
  ('00000000-0000-4000-8000-000000000103', 'Jus de bissap', 'Fleurs d''hibiscus, gingembre, menthe. Fait maison.', 500, '/photos/bissap.jpg', true, false);

insert into public.promotions (kind, title, description, starts_at, ends_at) values
  ('evenement', 'Soirée Ligue des champions', 'Match sur grand écran, brochettes à 1 500 F pendant la mi-temps.', now(), now() + interval '30 days');

-- Comptes de démo : un par rôle
do $$
declare
  v_user record;
begin
  for v_user in
    select * from (values
      ('00000000-0000-4000-8000-00000000a001'::uuid, 'etudiant@miammiam.test', 'Awa Étudiante', 'etudiant'::public.app_role),
      ('00000000-0000-4000-8000-00000000a002'::uuid, 'employe@miammiam.test', 'Paul Employé', 'employe'::public.app_role),
      ('00000000-0000-4000-8000-00000000a003'::uuid, 'gerant@miammiam.test', 'Marie Gérante', 'gerant'::public.app_role),
      ('00000000-0000-4000-8000-00000000a004'::uuid, 'admin@miammiam.test', 'Mr Miam Miam', 'admin'::public.app_role)
    ) as t(id, email, full_name, role)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change
    ) values (
      '00000000-0000-0000-0000-000000000000', v_user.id, 'authenticated', 'authenticated',
      v_user.email, extensions.crypt('MiamMiam2026', extensions.gen_salt('bf')), now(),
      '{"provider": "email", "providers": ["email"]}',
      jsonb_build_object('full_name', v_user.full_name, 'phone', '+237 6 00 00 00 00'),
      now(), now(), '', '', '', ''
    );

    insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    values (
      gen_random_uuid(), v_user.id, v_user.id::text,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email, 'email_verified', true),
      'email', now(), now(), now()
    );

    update public.profiles
    set role = v_user.role,
        restaurant_id = case when v_user.role = 'etudiant' then null
                             else '00000000-0000-4000-8000-000000000001'::uuid end
    where id = v_user.id;
  end loop;
end;
$$;

update public.profiles
set points_balance = 42, delivery_address = 'Résidence La Terrasse, chambre 12'
where id = '00000000-0000-4000-8000-00000000a001';

insert into public.loyalty_transactions (user_id, kind, points, expires_at, note, created_at)
values ('00000000-0000-4000-8000-00000000a001', 'ajustement', 24, now() + interval '12 months', 'Points de démonstration', now() - interval '10 days');

-- Trois commandes livrées ces derniers jours, pour l'historique et les statistiques.
do $$
declare
  v_order uuid;
  v_line record;
begin
  for v_line in
    select * from (values
      (6, 'sur_place'::public.order_type, 'Poulet DG', 1, 'Jus de bissap', 4),
      (3, 'livraison'::public.order_type, 'Brochettes de bœuf', 2, 'Jus de bissap', 1),
      (1, 'sur_place'::public.order_type, 'Poisson braisé', 1, 'Ndolé crevettes', 1)
    ) as t(days_ago, kind, dish, dish_qty, extra, extra_qty)
  loop
    insert into public.orders (
      customer_id, order_type, status, arrival_time, delivery_address,
      subtotal_fcfa, total_fcfa, points_earned, created_at, updated_at
    )
    select
      '00000000-0000-4000-8000-00000000a001', v_line.kind, 'livree',
      case when v_line.kind = 'sur_place' then now() - make_interval(days => v_line.days_ago) + interval '30 minutes' end,
      case when v_line.kind = 'livraison' then 'Résidence La Terrasse, chambre 12' end,
      total, total, total / 1000,
      now() - make_interval(days => v_line.days_ago), now() - make_interval(days => v_line.days_ago)
    from (
      select sum(price_fcfa * case when name = v_line.dish then v_line.dish_qty else v_line.extra_qty end)::int as total
      from public.menu_items where name in (v_line.dish, v_line.extra)
    ) t
    returning id into v_order;

    insert into public.order_items (order_id, menu_item_id, item_name, unit_price_fcfa, quantity)
    select v_order, id, name, price_fcfa, case when name = v_line.dish then v_line.dish_qty else v_line.extra_qty end
    from public.menu_items where name in (v_line.dish, v_line.extra);

    insert into public.loyalty_transactions (user_id, order_id, kind, points, expires_at, note, created_at)
    select customer_id, id, 'gain', points_earned, now() + interval '12 months', 'Commande livrée', created_at
    from public.orders where id = v_order;
  end loop;
end;
$$;

-- Le solde suit le journal des points.
update public.profiles
set points_balance = (select sum(points) from public.loyalty_transactions where user_id = profiles.id)
where id = '00000000-0000-4000-8000-00000000a001';
