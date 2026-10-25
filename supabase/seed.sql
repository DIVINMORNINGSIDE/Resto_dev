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
  ('00000000-0000-4000-8000-000000000103', 'Boissons', 3),
  ('00000000-0000-4000-8000-000000000104', 'Desserts', 4);

insert into public.menu_items (category_id, name, description, price_fcfa, image_url, is_available, is_dish_of_day) values
  ('00000000-0000-4000-8000-000000000101', 'Poulet DG', 'Poulet fermier, plantains mûrs, carottes et haricots verts sautés.', 3500, '/photos/poulet.jpg', true, true),
  ('00000000-0000-4000-8000-000000000101', 'Ndolé crevettes', 'Feuilles de ndolé, arachides, crevettes, servi avec miondo.', 4000, '/photos/ndole.jpg', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Poisson braisé', 'Bar braisé au feu de bois, bâton de manioc, piment maison.', 5000, '/photos/poisson.jpg', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Brochettes de bœuf', 'Trois brochettes marinées, oignons grillés, frites de plantain.', 2000, '/photos/brochette.jpg', true, false),
  ('00000000-0000-4000-8000-000000000101', 'Riz sauté poulet', 'Riz sauté, poulet, légumes croquants.', 2500, '/photos/riz.jpg', false, false),
  ('00000000-0000-4000-8000-000000000101', 'Spaghetti omelette', 'Le classique de la terrasse, sauce tomate épicée.', 1500, '/photos/spag.jpg', true, false),
  ('00000000-0000-4000-8000-000000000103', 'Jus de bissap', 'Fleurs d''hibiscus, gingembre, menthe. Fait maison.', 500, '/photos/bissap.jpg', true, false),
  -- Plats de démonstration pour une carte de plus de 8 plats (photos Unsplash).
  ('00000000-0000-4000-8000-000000000101', 'Sauce gombo', 'Gombo frais, viande fumée et poisson sec, servi avec couscous de maïs.', 3000, 'https://images.unsplash.com/photo-1665332561290-cc6757172890?auto=format&fit=crop&w=900&q=80', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Poulet braisé', 'Demi-poulet mariné aux épices, braisé au feu de bois, frites ou plantain.', 3500, 'https://images.unsplash.com/photo-1610057098265-05f2bcbedd55?auto=format&fit=crop&w=900&q=80', true, false),
  ('00000000-0000-4000-8000-000000000102', 'Bar et alloco', 'Bar grillé, plantains frits, oignons rouges et citron vert.', 4500, 'https://images.unsplash.com/photo-1783408356251-f4953f943bb2?auto=format&fit=crop&w=900&q=80', true, false),
  ('00000000-0000-4000-8000-000000000103', 'Jus de gingembre', 'Gingembre frais, citron et ananas. Bien relevé.', 500, 'https://images.unsplash.com/photo-1631029098074-be99eb2b425c?auto=format&fit=crop&w=900&q=80', true, false),
  ('00000000-0000-4000-8000-000000000104', 'Salade de fruits', 'Fruits de saison coupés minute.', 1000, 'https://images.unsplash.com/photo-1658431618300-a69b07fb5782?auto=format&fit=crop&w=900&q=80', true, false),
  ('00000000-0000-4000-8000-000000000104', 'Beignets sucrés', 'Six beignets maison, sucre glace.', 500, 'https://images.unsplash.com/photo-1618411640018-972400a01458?auto=format&fit=crop&w=900&q=80', true, false);

insert into public.promotions (kind, title, description, starts_at, ends_at) values
  ('evenement', 'Soirée Ligue des champions', 'Match sur grand écran, brochettes à 1 500 F pendant la mi-temps.', now(), now() + interval '30 days');

-- Deuxième restaurant de l'enseigne, avec sa propre carte et son gérant.
insert into public.restaurants (id, name, slug, address, opening_hours, created_at)
values (
  '00000000-0000-4000-8000-000000000002',
  'ZeDuc@Campus',
  'zeduc-campus',
  'Campus universitaire, bâtiment B',
  '{"lundi": "10:00 – 20:00", "mardi": "10:00 – 20:00", "mercredi": "10:00 – 20:00", "jeudi": "10:00 – 20:00", "vendredi": "10:00 – 20:00", "samedi": "Fermé", "dimanche": "Fermé"}',
  now() + interval '1 minute'
);

update public.restaurants
set address = 'Terrasse du restaurant universitaire'
where id = '00000000-0000-4000-8000-000000000001';

insert into public.categories (id, restaurant_id, name, position) values
  ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000002', 'Plats', 1),
  ('00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000002', 'Boissons', 2);

insert into public.menu_items (restaurant_id, category_id, name, description, price_fcfa, image_url, is_available, is_dish_of_day) values
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', 'Riz sauce arachide', 'Riz blanc, sauce arachide et poulet, la formule étudiante.', 1500, '/photos/riz.jpg', true, true),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', 'Omelette spaghetti', 'Spaghetti sautés, omelette aux oignons.', 1000, '/photos/spag.jpg', true, false),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000201', 'Poulet pané', 'Filet de poulet pané, frites de plantain.', 2500, '/photos/poulet.jpg', true, false),
  ('00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000202', 'Bissap glacé', 'Jus d''hibiscus maison, servi frais.', 300, '/photos/bissap.jpg', true, false);

insert into public.promotions (restaurant_id, kind, title, description, starts_at, ends_at) values
  ('00000000-0000-4000-8000-000000000002', 'promotion', 'Formule midi à 1 500 F', 'Plat du jour et bissap glacé, du lundi au vendredi.', now(), now() + interval '30 days');

-- Questions du quiz du jour.
insert into public.quiz_questions (question, choices, correct_index) values
  ('Quel plat camerounais est préparé avec des feuilles amères ?', array['Le ndolé', 'Le koki', 'Le poulet DG', 'Le eru'], 0),
  ('Que veut dire « DG » dans poulet DG ?', array['Délice garni', 'Directeur général', 'Double grillé', 'Dîner gourmand'], 1),
  ('Avec quelle fleur prépare-t-on le jus de bissap ?', array['La rose', 'Le jasmin', 'L''hibiscus', 'La citronnelle'], 2),
  ('Le koki est préparé à base de…', array['Manioc', 'Plantain', 'Haricots cornille', 'Arachides'], 2),
  ('Le miondo est fait à partir de…', array['Maïs', 'Manioc', 'Igname', 'Riz'], 1),
  ('Combien de points faut-il pour 1 000 F de réduction chez ZeDuc@Space ?', array['5', '10', '15', '20'], 2);

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
      ('00000000-0000-4000-8000-00000000a004'::uuid, 'admin@miammiam.test', 'Mr Miam Miam', 'admin'::public.app_role),
      ('00000000-0000-4000-8000-00000000a005'::uuid, 'gerant.campus@miammiam.test', 'Jean Gérant', 'gerant'::public.app_role)
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
                             when v_user.email = 'gerant.campus@miammiam.test' then '00000000-0000-4000-8000-000000000002'::uuid
                             else '00000000-0000-4000-8000-000000000001'::uuid end
    where id = v_user.id;
  end loop;
end;
$$;

update public.profiles
set points_balance = 42, delivery_address = 'Résidence La Terrasse, chambre 12'
where id = '00000000-0000-4000-8000-00000000a001';

insert into public.loyalty_transactions (user_id, kind, points, expires_at, note, created_at)
values ('00000000-0000-4000-8000-00000000a001', 'ajustement', 24, now() + interval '20 days', 'Points de démonstration', now() - interval '10 days');

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
      from public.menu_items where name in (v_line.dish, v_line.extra) and restaurant_id = '00000000-0000-4000-8000-000000000001'
    ) t
    returning id into v_order;

    insert into public.order_items (order_id, menu_item_id, item_name, unit_price_fcfa, quantity)
    select v_order, id, name, price_fcfa, case when name = v_line.dish then v_line.dish_qty else v_line.extra_qty end
    from public.menu_items where name in (v_line.dish, v_line.extra) and restaurant_id = '00000000-0000-4000-8000-000000000001';

    insert into public.loyalty_transactions (user_id, order_id, kind, points, expires_at, note, created_at)
    select customer_id, id, 'gain', points_earned, now() + interval '12 months', 'Commande livrée', created_at
    from public.orders where id = v_order;
  end loop;
end;
$$;

-- Un avis laissé sur la plus ancienne commande.
update public.orders
set customer_comment = 'Poulet DG excellent et servi bien chaud. Merci !', commented_at = created_at + interval '2 hours'
where id = (
  select id from public.orders
  where customer_id = '00000000-0000-4000-8000-00000000a001'
  order by created_at
  limit 1
);

-- Le solde suit le journal des points.
update public.profiles
set points_balance = (select sum(points) from public.loyalty_transactions where user_id = profiles.id)
where id = '00000000-0000-4000-8000-00000000a001';
