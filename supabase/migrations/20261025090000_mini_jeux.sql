-- Mini-jeux : un quiz du jour et une roue de la chance, chacun jouable une
-- fois par jour (heure de Douala) par les étudiants, pour gagner des points.
-- Les tirages et les gains se font uniquement dans les fonctions ci-dessous.

alter type public.loyalty_kind add value if not exists 'jeu';

alter table public.restaurants
  add column games_enabled boolean not null default true,
  add column quiz_points integer not null default 2 check (quiz_points between 0 and 50);

-- ---------------------------------------------------------------------------
-- Questions du quiz (gérées par le gérant et l'admin)
-- Les étudiants ne lisent jamais cette table : la bonne réponse y figure.
-- ---------------------------------------------------------------------------
create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null default private.default_restaurant_id()
    references public.restaurants (id) on delete cascade,
  question text not null check (char_length(question) between 5 and 200),
  choices text[] not null check (
    array_length(choices, 1) between 2 and 4
    and array_position(choices, null) is null
  ),
  correct_index smallint not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint quiz_questions_correct_index check (correct_index >= 0 and correct_index < array_length(choices, 1))
);

create index quiz_questions_restaurant_id_idx on public.quiz_questions (restaurant_id);

create trigger quiz_questions_set_updated_at
  before update on public.quiz_questions
  for each row execute function private.set_updated_at();

alter table public.quiz_questions enable row level security;

create policy "Le gérant et l'admin voient les questions" on public.quiz_questions
  for select to authenticated using ((select private.is_manager()));
create policy "Le gérant et l'admin ajoutent des questions" on public.quiz_questions
  for insert to authenticated with check ((select private.is_manager()));
create policy "Le gérant et l'admin modifient les questions" on public.quiz_questions
  for update to authenticated
  using ((select private.is_manager()))
  with check ((select private.is_manager()));
create policy "Le gérant et l'admin suppriment des questions" on public.quiz_questions
  for delete to authenticated using ((select private.is_manager()));

-- ---------------------------------------------------------------------------
-- Parties jouées : une par jeu, par étudiant et par jour
-- ---------------------------------------------------------------------------
create table public.game_plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  game text not null check (game in ('quiz', 'roue')),
  played_on date not null,
  points integer not null default 0 check (points >= 0),
  question_id uuid references public.quiz_questions (id) on delete set null,
  answer_index smallint,
  correct_index smallint,
  wheel_segment smallint,
  created_at timestamptz not null default now(),
  constraint game_plays_once_a_day unique (user_id, game, played_on)
);

create index game_plays_question_id_idx on public.game_plays (question_id);

alter table public.game_plays enable row level security;

-- Aucune écriture directe : seules les fonctions de jeu insèrent une partie.
create policy "Voir ses parties, le gérant et l'admin voient tout" on public.game_plays
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_manager()));

-- ---------------------------------------------------------------------------
-- Outils internes
-- ---------------------------------------------------------------------------
-- Jour courant à Douala.
create function private.douala_today()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Douala')::date;
$$;

-- Segments de la roue, dans l'ordre d'affichage (points gagnés).
create function private.wheel_segments()
returns integer[]
language sql
immutable
set search_path = ''
as $$
  select array[0, 1, 2, 0, 1, 3, 0, 5];
$$;

-- Question du jour d'un étudiant : chaque étudiant a la sienne, stable sur la journée.
create function private.quiz_question_for(p_user uuid, p_day date)
returns uuid
language sql
stable
set search_path = ''
as $$
  with active as (
    select id, row_number() over (order by created_at, id) - 1 as n, count(*) over () as total
    from public.quiz_questions
    where is_active
  )
  select id from active
  where n = abs(hashtext(p_user::text || p_day::text)) % total;
$$;

-- Vérifie qu'un étudiant peut jouer aujourd'hui ; renvoie le restaurant.
create function private.require_player()
returns public.restaurants
language plpgsql
stable
set search_path = ''
as $$
declare
  v_restaurant public.restaurants%rowtype;
begin
  if private.user_role() is distinct from 'etudiant' then
    raise exception 'Les jeux sont réservés aux étudiants' using errcode = '42501';
  end if;
  select * into v_restaurant from public.restaurants order by created_at limit 1;
  if not v_restaurant.games_enabled then
    raise exception 'Les jeux sont en pause pour le moment' using errcode = '22023';
  end if;
  return v_restaurant;
end;
$$;

-- Crédite des points gagnés à un jeu, avec la même durée de validité que les autres.
create function private.credit_game_points(p_user uuid, p_points integer, p_note text, p_months integer)
returns void
language plpgsql
set search_path = ''
as $$
begin
  if p_points <= 0 then
    return;
  end if;
  update public.profiles set points_balance = points_balance + p_points where id = p_user;
  insert into public.loyalty_transactions (user_id, kind, points, expires_at, note)
  values (p_user, 'jeu', p_points, now() + make_interval(months => p_months), p_note);
end;
$$;

revoke execute on function
  private.douala_today(),
  private.wheel_segments(),
  private.quiz_question_for(uuid, date),
  private.require_player(),
  private.credit_game_points(uuid, integer, text, integer)
from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- Fonctions appelées par l'espace étudiant
-- ---------------------------------------------------------------------------
-- État des jeux du jour pour l'étudiant connecté. La bonne réponse n'est
-- renvoyée qu'une fois la question jouée.
create function public.my_games_today()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_day date := private.douala_today();
  v_restaurant public.restaurants%rowtype;
  v_quiz public.game_plays%rowtype;
  v_wheel public.game_plays%rowtype;
  v_question public.quiz_questions%rowtype;
begin
  if private.user_role() is distinct from 'etudiant' then
    raise exception 'Les jeux sont réservés aux étudiants' using errcode = '42501';
  end if;
  select * into v_restaurant from public.restaurants order by created_at limit 1;
  select * into v_quiz from public.game_plays where user_id = v_uid and game = 'quiz' and played_on = v_day;
  select * into v_wheel from public.game_plays where user_id = v_uid and game = 'roue' and played_on = v_day;

  if v_quiz.id is not null then
    select * into v_question from public.quiz_questions where id = v_quiz.question_id;
  else
    select * into v_question from public.quiz_questions where id = private.quiz_question_for(v_uid, v_day);
  end if;

  return jsonb_build_object(
    'enabled', v_restaurant.games_enabled,
    'quizPoints', v_restaurant.quiz_points,
    'wheelSegments', to_jsonb(private.wheel_segments()),
    'quiz', case when v_question.id is null then null else jsonb_build_object(
      'id', v_question.id,
      'question', v_question.question,
      'choices', to_jsonb(v_question.choices)
    ) end,
    'quizPlay', case when v_quiz.id is null then null else jsonb_build_object(
      'answerIndex', v_quiz.answer_index,
      'correctIndex', v_quiz.correct_index,
      'points', v_quiz.points
    ) end,
    'wheelPlay', case when v_wheel.id is null then null else jsonb_build_object(
      'segment', v_wheel.wheel_segment,
      'points', v_wheel.points
    ) end
  );
end;
$$;

-- Répond à la question du jour. Renvoie la bonne réponse et les points gagnés.
create function public.play_quiz(p_question_id uuid, p_answer integer)
returns table (correct_index integer, points integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_day date := private.douala_today();
  v_restaurant public.restaurants%rowtype := private.require_player();
  v_question public.quiz_questions%rowtype;
  v_points integer := 0;
begin
  perform 1 from public.profiles where id = v_uid for update;
  if exists (select 1 from public.game_plays where user_id = v_uid and game = 'quiz' and played_on = v_day) then
    raise exception 'Tu as déjà répondu au quiz aujourd''hui. Reviens demain !' using errcode = '22023';
  end if;
  if p_question_id is distinct from private.quiz_question_for(v_uid, v_day) then
    raise exception 'La question du jour a changé. Actualise la page.' using errcode = '22023';
  end if;
  select * into v_question from public.quiz_questions where id = p_question_id;
  if p_answer is null or p_answer < 0 or p_answer >= array_length(v_question.choices, 1) then
    raise exception 'Choisis une réponse' using errcode = '22023';
  end if;

  if p_answer = v_question.correct_index then
    v_points := v_restaurant.quiz_points;
  end if;
  insert into public.game_plays (user_id, game, played_on, points, question_id, answer_index, correct_index)
  values (v_uid, 'quiz', v_day, v_points, v_question.id, p_answer, v_question.correct_index);
  perform private.credit_game_points(v_uid, v_points, 'Quiz du jour', v_restaurant.points_validity_months);

  return query select v_question.correct_index::integer, v_points;
end;
$$;

-- Lance la roue : le tirage se fait ici, jamais dans le navigateur.
create function public.spin_wheel()
returns table (segment integer, points integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_day date := private.douala_today();
  v_restaurant public.restaurants%rowtype := private.require_player();
  v_segments integer[] := private.wheel_segments();
  v_segment integer;
begin
  perform 1 from public.profiles where id = v_uid for update;
  if exists (select 1 from public.game_plays where user_id = v_uid and game = 'roue' and played_on = v_day) then
    raise exception 'Tu as déjà lancé la roue aujourd''hui. Reviens demain !' using errcode = '22023';
  end if;

  v_segment := floor(random() * array_length(v_segments, 1))::integer;
  insert into public.game_plays (user_id, game, played_on, points, wheel_segment)
  values (v_uid, 'roue', v_day, v_segments[v_segment + 1], v_segment);
  perform private.credit_game_points(v_uid, v_segments[v_segment + 1], 'Roue de la chance', v_restaurant.points_validity_months);

  return query select v_segment, v_segments[v_segment + 1];
end;
$$;

revoke execute on function public.my_games_today(), public.play_quiz(uuid, integer), public.spin_wheel()
from public, anon;
grant execute on function public.my_games_today(), public.play_quiz(uuid, integer), public.spin_wheel()
to authenticated;
