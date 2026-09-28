-- =============================================================================
-- SPORTS LEAGUE · 0001_init.sql
-- =============================================================================
-- Reescritura completa (DB vacía). Roles: admin, team_manager (Delegado), referee.
-- Estructura: Club → Team (club+division+grupo) · Credencial · Cédula de partido.
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

create type public.membership_role as enum (
  'admin',
  'team_manager',
  'referee'
);

create type public.score_type as enum (
  'goals',
  'points',
  'sets'
);

create type public.tournament_status as enum (
  'registration',
  'active',
  'finished'
);

create type public.match_status as enum (
  'programado',
  'en_vivo',
  'finalizado',
  'aplazado',
  'cancelado'
);

create type public.branch as enum (
  'varonil',
  'femenil',
  'mixto'
);

create type public.approval_status as enum (
  'pendiente',
  'aprobado',
  'rechazado'
);

create type public.eligibility_status as enum (
  'pendiente',
  'elegible',
  'no_elegible'
);

create type public.match_event_type as enum (
  'gol',
  'pts',
  'carrera',
  'amonestacion',
  'expulsion'
);

create type public.protest_status as enum (
  'pendiente',
  'en_revision',
  'resuelta',
  'rechazada'
);

create type public.notice_audience as enum (
  'general',
  'sport',
  'club'
);

create type public.schedule_change_type as enum (
  'reprogramar',
  'aplazar',
  'cancelar'
);

-- -----------------------------------------------------------------------------
-- 2. NÚCLEO
-- -----------------------------------------------------------------------------

create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  settings     jsonb not null default '{}'::jsonb,
  is_public    boolean not null default false,
  logo_url     text,
  tagline      text,
  created_by   uuid not null default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_organizations_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);

create table public.sports (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,
  name          text not null unique,
  points_win    integer not null,
  points_draw   integer not null,
  points_loss   integer not null,
  points_shootout_win  integer not null default 0,
  points_shootout_loss integer not null default 0,
  allows_draws  boolean not null default true,
  draw_requires_shootout boolean not null default false,
  score_type    public.score_type not null,
  created_at    timestamptz not null default now(),
  constraint chk_sports_points_non_negative check (
    points_win >= 0 and points_draw >= 0 and points_loss >= 0
    and points_shootout_win >= 0 and points_shootout_loss >= 0
  )
);

insert into public.sports (
  key, name, points_win, points_draw, points_loss,
  points_shootout_win, points_shootout_loss,
  allows_draws, draw_requires_shootout, score_type
) values
  ('soccer',      'Soccer',      3, 1, 0, 2, 1, true,  true,  'goals'),
  ('futbol_7x7',  'Fútbol 7x7',  3, 1, 0, 2, 1, true,  true,  'goals'),
  ('basquetbol',  'Basquetbol',  2, 0, 1, 0, 0, false, false, 'points'),
  ('softbol',     'Softbol',     1, 0, 0, 0, 0, false, false, 'points'),
  ('tochito',     'Tochito',     3, 1, 0, 0, 0, true,  false, 'points'),
  ('voleibol',    'Voleibol',    2, 0, 1, 0, 0, false, false, 'sets')
on conflict (key) do nothing;

create table public.org_sports (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations (id) on delete cascade,
  sport_id                 uuid not null references public.sports (id) on delete restrict,
  active                   boolean not null default true,
  points_win               integer,
  points_draw              integer,
  points_loss              integer,
  points_shootout_win      integer,
  points_shootout_loss     integer,
  draw_requires_shootout   boolean,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  unique (organization_id, sport_id)
);

create table public.org_sport_branches (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  sport_id         uuid not null references public.sports (id) on delete restrict,
  branch           public.branch not null,
  active           boolean not null default true,
  created_at       timestamptz not null default now(),
  unique (organization_id, sport_id, branch)
);

create table public.categories (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  sort_order       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default '',
  apellido    text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.clubs (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.tournaments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  season           text not null,
  format           text not null default 'round_robin',
  legs             integer not null default 1,
  status           public.tournament_status not null default 'registration',
  start_date       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name, season),
  constraint chk_tournaments_format check (format in ('round_robin', 'knockout', 'groups')),
  constraint chk_tournaments_legs check (legs in (1, 2))
);

create table public.divisions (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  tournament_id    uuid not null references public.tournaments (id) on delete cascade,
  sport_id         uuid not null references public.sports (id) on delete restrict,
  branch           public.branch not null,
  category_id      uuid not null references public.categories (id) on delete restrict,
  name             text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (tournament_id, sport_id, branch, category_id)
);

create table public.groups (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  division_id      uuid not null references public.divisions (id) on delete cascade,
  name             text not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (division_id, name)
);

create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  club_id          uuid not null references public.clubs (id) on delete cascade,
  division_id      uuid not null references public.divisions (id) on delete cascade,
  group_id         uuid references public.groups (id) on delete set null,
  name             text not null,
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (division_id, name)
);

create table public.memberships (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  team_id          uuid references public.teams (id) on delete cascade,
  role             public.membership_role not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, organization_id, role),
  constraint chk_memberships_team_id_only_for_team_manager check (
    team_id is null or role = 'team_manager'
  )
);

create table public.players (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  club_id          uuid not null references public.clubs (id) on delete cascade,
  first_names      text not null,
  last_names       text not null,
  id_number        text,
  photo_url        text,
  classification   text,
  profile_id       uuid unique references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.player_registrations (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  player_id        uuid not null references public.players (id) on delete cascade,
  team_id          uuid not null references public.teams (id) on delete cascade,
  jersey_number    integer,
  status           public.approval_status not null default 'pendiente',
  eligibility      public.eligibility_status not null default 'pendiente',
  folio            text not null unique,
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (player_id, team_id),
  constraint chk_player_registrations_jersey_positive check (
    jersey_number is null or jersey_number > 0
  )
);

-- -----------------------------------------------------------------------------
-- 3. PARTIDOS Y CÉDULA
-- -----------------------------------------------------------------------------

create table public.matches (
  id                       uuid primary key default gen_random_uuid(),
  organization_id          uuid not null references public.organizations (id) on delete cascade,
  tournament_id            uuid not null references public.tournaments (id) on delete cascade,
  division_id              uuid not null references public.divisions (id) on delete cascade,
  group_id                 uuid references public.groups (id) on delete set null,
  home_team_id             uuid not null references public.teams (id) on delete cascade,
  away_team_id             uuid not null references public.teams (id) on delete cascade,
  jornada                  integer,
  stage                    text not null default 'regular',
  scheduled_at             timestamptz,
  venue                    text,
  referee_id               uuid references auth.users (id) on delete set null,
  status                   public.match_status not null default 'programado',
  status_reason            text,
  home_score               integer not null default 0,
  away_score               integer not null default 0,
  shootout_winner_team_id  uuid references public.teams (id) on delete set null,
  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now(),
  constraint chk_matches_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint chk_matches_teams_are_different check (home_team_id <> away_team_id),
  constraint chk_matches_stage check (
    stage in ('regular', 'cuartos', 'semifinal', 'final')
  ),
  unique (division_id, home_team_id, away_team_id, jornada)
);

create table public.match_schedule_changes (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  match_id         uuid not null references public.matches (id) on delete cascade,
  change_type      public.schedule_change_type not null,
  reason           text,
  previous_scheduled_at timestamptz,
  new_scheduled_at timestamptz,
  previous_venue   text,
  new_venue        text,
  previous_status  public.match_status,
  new_status       public.match_status,
  changed_by       uuid not null default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now()
);

create table public.match_sheets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  match_id         uuid not null unique references public.matches (id) on delete cascade,
  observations     text,
  referee_name     text,
  closed_at        timestamptz,
  closed_by        uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.match_participants (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  match_sheet_id            uuid not null references public.match_sheets (id) on delete cascade,
  player_registration_id    uuid not null references public.player_registrations (id) on delete cascade,
  team_id                   uuid not null references public.teams (id) on delete cascade,
  created_at                timestamptz not null default now(),
  unique (match_sheet_id, player_registration_id)
);

create table public.match_events (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  match_sheet_id            uuid not null references public.match_sheets (id) on delete cascade,
  player_registration_id    uuid not null references public.player_registrations (id) on delete cascade,
  team_id                   uuid not null references public.teams (id) on delete cascade,
  event_type                public.match_event_type not null,
  quantity                  integer not null default 1,
  minute                    integer,
  note                      text,
  created_at                timestamptz not null default now(),
  created_by                uuid default auth.uid() references auth.users (id),
  constraint chk_match_events_quantity_positive check (quantity > 0)
);

create table public.match_sets (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  match_id         uuid not null references public.matches (id) on delete cascade,
  set_number       integer not null,
  home_set_score   integer not null default 0,
  away_set_score   integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (match_id, set_number),
  constraint chk_match_sets_number_positive check (set_number > 0),
  constraint chk_match_sets_scores_non_negative check (home_set_score >= 0 and away_set_score >= 0)
);

-- -----------------------------------------------------------------------------
-- 4. EXTRAS (stubs de schema)
-- -----------------------------------------------------------------------------

create table public.sanctions (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  player_registration_id    uuid not null references public.player_registrations (id) on delete cascade,
  team_id                   uuid not null references public.teams (id) on delete cascade,
  match_event_id            uuid references public.match_events (id) on delete set null,
  reason                    text not null,
  jornada                   integer,
  sanction                  text not null,
  created_by                uuid default auth.uid() references auth.users (id),
  created_at                timestamptz not null default now()
);

create table public.bracket_slots (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  division_id      uuid not null references public.divisions (id) on delete cascade,
  stage            text not null,
  slot             integer not null,
  seed_position    integer,
  match_id         uuid references public.matches (id) on delete set null,
  created_at       timestamptz not null default now(),
  unique (division_id, stage, slot),
  constraint chk_bracket_slots_stage check (
    stage in ('cuartos', 'semifinal', 'final')
  )
);

create table public.protests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  match_id         uuid references public.matches (id) on delete set null,
  team_id          uuid not null references public.teams (id) on delete cascade,
  reason           text not null,
  description      text,
  status           public.protest_status not null default 'pendiente',
  response         text,
  filed_by         uuid not null default auth.uid() references auth.users (id),
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.protest_evidence (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  protest_id       uuid not null references public.protests (id) on delete cascade,
  storage_path     text not null,
  created_at       timestamptz not null default now()
);

create table public.notices (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  title            text not null,
  body             text not null,
  audience         public.notice_audience not null default 'general',
  target_sport_id  uuid references public.sports (id) on delete set null,
  target_club_id   uuid references public.clubs (id) on delete set null,
  featured         boolean not null default false,
  is_public        boolean not null default false,
  published_at     timestamptz,
  created_by       uuid not null default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  user_id          uuid not null references auth.users (id) on delete cascade,
  title            text not null,
  body             text,
  link             text,
  read_at          timestamptz,
  created_at       timestamptz not null default now()
);

create table public.audit_log (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  actor_id         uuid references auth.users (id) on delete set null,
  action           text not null,
  entity_type      text not null,
  entity_id        uuid,
  diff             jsonb,
  created_at       timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. ÍNDICES
-- -----------------------------------------------------------------------------

create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_organization_id on public.memberships (organization_id);
create index idx_memberships_org_user on public.memberships (organization_id, user_id);
create index idx_memberships_team_id on public.memberships (team_id) where team_id is not null;

create index idx_org_sports_org on public.org_sports (organization_id);
create index idx_categories_org on public.categories (organization_id);
create index idx_clubs_org on public.clubs (organization_id);
create index idx_divisions_tournament on public.divisions (tournament_id);
create index idx_groups_division on public.groups (division_id);
create index idx_teams_club on public.teams (club_id);
create index idx_teams_division on public.teams (division_id);
create index idx_players_org on public.players (organization_id);
create index idx_players_club on public.players (club_id);
create index idx_player_registrations_team on public.player_registrations (team_id);
create index idx_player_registrations_folio on public.player_registrations (folio);
create index idx_player_registrations_status on public.player_registrations (organization_id, status);

create index idx_matches_org on public.matches (organization_id);
create index idx_matches_division on public.matches (division_id);
create index idx_matches_tournament on public.matches (tournament_id);
create index idx_matches_status on public.matches (status);
create index idx_matches_scheduled_at on public.matches (scheduled_at);
create index idx_matches_referee on public.matches (referee_id) where referee_id is not null;
create index idx_matches_jornada on public.matches (division_id, jornada);

create index idx_match_sheets_match on public.match_sheets (match_id);
create index idx_match_events_sheet on public.match_events (match_sheet_id);
create index idx_notifications_user on public.notifications (user_id, read_at);
create index idx_audit_log_org on public.audit_log (organization_id, created_at desc);

-- -----------------------------------------------------------------------------
-- 6. FUNCIONES AUXILIARES
-- -----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_org_member(p_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.has_org_role(
  p_organization_id uuid,
  p_roles public.membership_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = p_organization_id
      and m.user_id = (select auth.uid())
      and m.role = any (p_roles)
  );
$$;

create or replace function public.manages_team(p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m
    where m.team_id = p_team_id
      and m.role = 'team_manager'
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.shares_org_with(p_target_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.memberships m1
    join public.memberships m2 on m2.organization_id = m1.organization_id
    where m1.user_id = (select auth.uid())
      and m2.user_id = p_target_user_id
  );
$$;

create or replace function public.is_assigned_referee(p_match_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.matches m
    where m.id = p_match_id
      and m.referee_id = (select auth.uid())
  );
$$;

create or replace function public.effective_sport_points(p_organization_id uuid, p_sport_id uuid)
returns table (
  points_win integer,
  points_draw integer,
  points_loss integer,
  points_shootout_win integer,
  points_shootout_loss integer,
  allows_draws boolean,
  draw_requires_shootout boolean,
  score_type public.score_type
)
language sql
stable
security definer
set search_path = public
as $$
  select
    coalesce(os.points_win, s.points_win),
    coalesce(os.points_draw, s.points_draw),
    coalesce(os.points_loss, s.points_loss),
    coalesce(os.points_shootout_win, s.points_shootout_win),
    coalesce(os.points_shootout_loss, s.points_shootout_loss),
    s.allows_draws,
    coalesce(os.draw_requires_shootout, s.draw_requires_shootout),
    s.score_type
  from public.sports s
  left join public.org_sports os
    on os.sport_id = s.id
   and os.organization_id = p_organization_id
  where s.id = p_sport_id;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nombre, apellido)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', ''),
    coalesce(new.raw_user_meta_data ->> 'apellido', '')
  );
  return new;
end;
$$;

create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, organization_id, role)
  values (new.created_by, new.id, 'admin');

  -- Activa todos los deportes y ramas por defecto.
  insert into public.org_sports (organization_id, sport_id, active)
  select new.id, s.id, true from public.sports s;

  insert into public.org_sport_branches (organization_id, sport_id, branch, active)
  select new.id, s.id, b.branch, true
  from public.sports s
  cross join (values
    ('varonil'::public.branch),
    ('femenil'::public.branch),
    ('mixto'::public.branch)
  ) as b(branch);

  insert into public.categories (organization_id, name, sort_order)
  values
    (new.id, 'Única', 0),
    (new.id, '1RA', 1),
    (new.id, '2DA', 2),
    (new.id, '3RA', 3);

  return new;
end;
$$;

create or replace function public.generate_registration_folio()
returns trigger
language plpgsql
as $$
begin
  if new.folio is null or length(trim(new.folio)) = 0 then
    new.folio := upper(substr(encode(gen_random_bytes(6), 'hex'), 1, 10));
  end if;
  return new;
end;
$$;

create or replace function public.force_registration_pending_on_insert()
returns trigger
language plpgsql
as $$
begin
  new.status := 'pendiente';
  new.eligibility := 'pendiente';
  new.reviewed_by := null;
  new.reviewed_at := null;
  return new;
end;
$$;

create or replace function public.restrict_registration_status_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status
     or new.eligibility is distinct from old.eligibility
  then
    if not public.has_org_role(old.organization_id, array['admin']::public.membership_role[]) then
      raise exception 'Solo el administrador puede cambiar status o elegibilidad de la credencial';
    end if;
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;
  return new;
end;
$$;

create or replace function public.sync_division_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.tournaments where id = new.tournament_id;
  if v_org is null then
    raise exception 'tournament_id % no existe', new.tournament_id;
  end if;
  new.organization_id := v_org;
  return new;
end;
$$;

create or replace function public.sync_group_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  select organization_id into v_org from public.divisions where id = new.division_id;
  if v_org is null then
    raise exception 'division_id % no existe', new.division_id;
  end if;
  new.organization_id := v_org;
  return new;
end;
$$;

create or replace function public.sync_team_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_div record;
  v_club_org uuid;
  v_group_div uuid;
begin
  select * into v_div from public.divisions where id = new.division_id;
  if v_div.id is null then
    raise exception 'division_id % no existe', new.division_id;
  end if;

  select organization_id into v_club_org from public.clubs where id = new.club_id;
  if v_club_org is null or v_club_org <> v_div.organization_id then
    raise exception 'El club debe pertenecer a la misma organización que la división';
  end if;

  if new.group_id is not null then
    select division_id into v_group_div from public.groups where id = new.group_id;
    if v_group_div is distinct from new.division_id then
      raise exception 'El grupo debe pertenecer a la misma división';
    end if;
  end if;

  new.organization_id := v_div.organization_id;
  return new;
end;
$$;

create or replace function public.sync_matches_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_div record;
  v_home record;
  v_away record;
begin
  select * into v_div from public.divisions where id = new.division_id;
  if v_div.id is null then
    raise exception 'division_id % no existe', new.division_id;
  end if;

  if new.tournament_id <> v_div.tournament_id then
    raise exception 'El partido debe pertenecer al torneo de la división';
  end if;

  select * into v_home from public.teams where id = new.home_team_id;
  select * into v_away from public.teams where id = new.away_team_id;

  if v_home.id is null or v_away.id is null then
    raise exception 'home_team_id/away_team_id inválido';
  end if;

  if v_home.division_id <> new.division_id or v_away.division_id <> new.division_id then
    raise exception 'Ambos equipos deben pertenecer a la misma división';
  end if;

  if new.group_id is not null then
    if not exists (
      select 1 from public.groups g
      where g.id = new.group_id and g.division_id = new.division_id
    ) then
      raise exception 'El grupo no pertenece a la división';
    end if;
  end if;

  if new.shootout_winner_team_id is not null
     and new.shootout_winner_team_id not in (new.home_team_id, new.away_team_id)
  then
    raise exception 'shootout_winner_team_id debe ser local o visitante';
  end if;

  new.organization_id := v_div.organization_id;
  return new;
end;
$$;

create or replace function public.sync_match_child_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
begin
  if tg_table_name = 'match_sets' then
    select organization_id into v_org from public.matches where id = new.match_id;
  elsif tg_table_name = 'match_sheets' then
    select organization_id into v_org from public.matches where id = new.match_id;
  elsif tg_table_name in ('match_participants', 'match_events') then
    select organization_id into v_org from public.match_sheets where id = new.match_sheet_id;
  elsif tg_table_name = 'match_schedule_changes' then
    select organization_id into v_org from public.matches where id = new.match_id;
  end if;

  if v_org is null then
    raise exception 'No se pudo resolver organization_id para %', tg_table_name;
  end if;
  new.organization_id := v_org;
  return new;
end;
$$;

create or replace function public.validate_match_participant()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match record;
  v_reg record;
begin
  select m.* into v_match
  from public.matches m
  join public.match_sheets ms on ms.match_id = m.id
  where ms.id = new.match_sheet_id;

  select * into v_reg from public.player_registrations where id = new.player_registration_id;

  if v_reg.status <> 'aprobado' or v_reg.eligibility <> 'elegible' then
    raise exception 'Solo jugadores aprobados y elegibles pueden participar';
  end if;

  if v_reg.team_id not in (v_match.home_team_id, v_match.away_team_id) then
    raise exception 'El jugador no pertenece a los equipos del partido';
  end if;

  new.team_id := v_reg.team_id;
  return new;
end;
$$;

create or replace function public.ensure_sheet_not_closed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closed timestamptz;
  v_sheet_id uuid;
begin
  if tg_table_name = 'match_sheets' then
    if tg_op = 'UPDATE' and old.closed_at is not null and not public.has_org_role(old.organization_id, array['admin']::public.membership_role[]) then
      raise exception 'La cédula está cerrada; solo el admin puede reabrirla';
    end if;
    return new;
  end if;

  if tg_table_name in ('match_participants', 'match_events') then
    v_sheet_id := coalesce(new.match_sheet_id, old.match_sheet_id);
  elsif tg_table_name = 'match_sets' then
    select ms.id into v_sheet_id
    from public.match_sheets ms
    where ms.match_id = coalesce(new.match_id, old.match_id);
  end if;

  if v_sheet_id is not null then
    select closed_at into v_closed from public.match_sheets where id = v_sheet_id;
    if v_closed is not null then
      raise exception 'La cédula está cerrada y no admite cambios';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

create or replace function public.close_match_sheet()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match public.matches%rowtype;
  v_sport_id uuid;
  v_pts record;
  v_home_score integer := 0;
  v_away_score integer := 0;
  v_home_sets integer := 0;
  v_away_sets integer := 0;
begin
  -- Solo al cerrar (closed_at pasa de null a valor).
  if old.closed_at is not null or new.closed_at is null then
    return new;
  end if;

  select * into v_match from public.matches where id = new.match_id;
  select sport_id into v_sport_id from public.divisions where id = v_match.division_id;
  select * into v_pts from public.effective_sport_points(v_match.organization_id, v_sport_id);

  if v_pts.score_type = 'sets' then
    select
      count(*) filter (where home_set_score > away_set_score),
      count(*) filter (where away_set_score > home_set_score)
    into v_home_sets, v_away_sets
    from public.match_sets
    where match_id = v_match.id;

    v_home_score := v_home_sets;
    v_away_score := v_away_sets;
  else
    select
      coalesce(sum(me.quantity) filter (where me.team_id = v_match.home_team_id and me.event_type in ('gol', 'pts', 'carrera')), 0),
      coalesce(sum(me.quantity) filter (where me.team_id = v_match.away_team_id and me.event_type in ('gol', 'pts', 'carrera')), 0)
    into v_home_score, v_away_score
    from public.match_events me
    where me.match_sheet_id = new.id;
  end if;

  if v_home_score = v_away_score and v_pts.draw_requires_shootout then
    if v_match.shootout_winner_team_id is null then
      raise exception 'Empate: se requiere ganador por penales (J.E.G.)';
    end if;
  end if;

  if v_home_score = v_away_score and not v_pts.allows_draws and not v_pts.draw_requires_shootout then
    raise exception 'Este deporte no permite empates';
  end if;

  update public.matches
  set
    home_score = v_home_score,
    away_score = v_away_score,
    status = 'finalizado',
    updated_at = now()
  where id = v_match.id;

  if new.closed_by is null then
    new.closed_by := auth.uid();
  end if;

  return new;
end;
$$;

create or replace function public.restrict_match_writes_after_final()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.status = 'finalizado'
     and not public.has_org_role(old.organization_id, array['admin']::public.membership_role[])
  then
    if new.home_score is distinct from old.home_score
       or new.away_score is distinct from old.away_score
       or new.shootout_winner_team_id is distinct from old.shootout_winner_team_id
       or new.status is distinct from old.status
    then
      raise exception 'Partido finalizado: solo el admin puede modificar resultado o estado';
    end if;
  end if;
  return new;
end;
$$;

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org uuid;
  v_id uuid;
  v_action text;
begin
  v_action := lower(tg_op);
  if tg_op = 'DELETE' then
    v_org := old.organization_id;
    v_id := old.id;
  else
    v_org := new.organization_id;
    v_id := new.id;
  end if;

  insert into public.audit_log (organization_id, actor_id, action, entity_type, entity_id, diff)
  values (
    v_org,
    auth.uid(),
    v_action,
    tg_table_name,
    v_id,
    case
      when tg_op = 'INSERT' then to_jsonb(new)
      when tg_op = 'DELETE' then to_jsonb(old)
      else jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new))
    end
  );

  return coalesce(new, old);
end;
$$;

-- -----------------------------------------------------------------------------
-- 7. TRIGGERS
-- -----------------------------------------------------------------------------

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_organizations_bootstrap_admin
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger trg_org_sports_updated_at
  before update on public.org_sports
  for each row execute function public.set_updated_at();

create trigger trg_categories_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_clubs_updated_at
  before update on public.clubs
  for each row execute function public.set_updated_at();

create trigger trg_tournaments_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();

create trigger trg_divisions_updated_at
  before update on public.divisions
  for each row execute function public.set_updated_at();

create trigger trg_groups_updated_at
  before update on public.groups
  for each row execute function public.set_updated_at();

create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create trigger trg_memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

create trigger trg_players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

create trigger trg_player_registrations_updated_at
  before update on public.player_registrations
  for each row execute function public.set_updated_at();

create trigger trg_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger trg_match_sheets_updated_at
  before update on public.match_sheets
  for each row execute function public.set_updated_at();

create trigger trg_match_sets_updated_at
  before update on public.match_sets
  for each row execute function public.set_updated_at();

create trigger trg_protests_updated_at
  before update on public.protests
  for each row execute function public.set_updated_at();

create trigger trg_notices_updated_at
  before update on public.notices
  for each row execute function public.set_updated_at();

create trigger trg_divisions_sync_org
  before insert or update on public.divisions
  for each row execute function public.sync_division_organization();

create trigger trg_groups_sync_org
  before insert or update on public.groups
  for each row execute function public.sync_group_organization();

create trigger trg_teams_sync_org
  before insert or update on public.teams
  for each row execute function public.sync_team_organization();

create trigger trg_matches_sync_org
  before insert or update on public.matches
  for each row execute function public.sync_matches_organization();

create trigger trg_match_sets_sync_org
  before insert or update on public.match_sets
  for each row execute function public.sync_match_child_organization();

create trigger trg_match_sheets_sync_org
  before insert or update on public.match_sheets
  for each row execute function public.sync_match_child_organization();

create trigger trg_match_participants_sync_org
  before insert or update on public.match_participants
  for each row execute function public.sync_match_child_organization();

create trigger trg_match_events_sync_org
  before insert or update on public.match_events
  for each row execute function public.sync_match_child_organization();

create trigger trg_schedule_changes_sync_org
  before insert or update on public.match_schedule_changes
  for each row execute function public.sync_match_child_organization();

create trigger trg_player_registrations_folio
  before insert on public.player_registrations
  for each row execute function public.generate_registration_folio();

create trigger trg_player_registrations_force_pending
  before insert on public.player_registrations
  for each row execute function public.force_registration_pending_on_insert();

create trigger trg_player_registrations_restrict_status
  before update on public.player_registrations
  for each row execute function public.restrict_registration_status_changes();

create trigger trg_match_participants_validate
  before insert or update on public.match_participants
  for each row execute function public.validate_match_participant();

create trigger trg_match_sheets_lock
  before update on public.match_sheets
  for each row execute function public.ensure_sheet_not_closed();

create trigger trg_match_participants_lock
  before insert or update or delete on public.match_participants
  for each row execute function public.ensure_sheet_not_closed();

create trigger trg_match_events_lock
  before insert or update or delete on public.match_events
  for each row execute function public.ensure_sheet_not_closed();

create trigger trg_match_sets_lock
  before insert or update or delete on public.match_sets
  for each row execute function public.ensure_sheet_not_closed();

create trigger trg_match_sheets_close
  before update on public.match_sheets
  for each row execute function public.close_match_sheet();

create trigger trg_matches_restrict_final
  before update on public.matches
  for each row execute function public.restrict_match_writes_after_final();

create trigger trg_audit_matches
  after insert or update or delete on public.matches
  for each row execute function public.audit_row_change();

create trigger trg_audit_match_sheets
  after insert or update or delete on public.match_sheets
  for each row execute function public.audit_row_change();

create trigger trg_audit_registrations
  after insert or update or delete on public.player_registrations
  for each row execute function public.audit_row_change();

create trigger trg_audit_protests
  after insert or update or delete on public.protests
  for each row execute function public.audit_row_change();

create trigger trg_audit_sanctions
  after insert or update or delete on public.sanctions
  for each row execute function public.audit_row_change();

-- -----------------------------------------------------------------------------
-- 8. VISTAS
-- -----------------------------------------------------------------------------

create view public.standings
with (security_invoker = true) as
select
  t.organization_id,
  t.division_id,
  t.group_id,
  d.tournament_id,
  d.sport_id,
  d.branch,
  d.category_id,
  t.id as team_id,
  t.name as team_name,
  count(m.id) filter (where m.status = 'finalizado') as jugados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and (
        (m.home_team_id = t.id and m.home_score > m.away_score)
        or (m.away_team_id = t.id and m.away_score > m.home_score)
        or (m.home_score = m.away_score and m.shootout_winner_team_id = t.id)
      )
  ) as ganados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and (
        (m.home_team_id = t.id and m.home_score < m.away_score)
        or (m.away_team_id = t.id and m.away_score < m.home_score)
        or (
          m.home_score = m.away_score
          and m.shootout_winner_team_id is not null
          and m.shootout_winner_team_id <> t.id
        )
      )
  ) as perdidos,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id is null
  ) as empatados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id = t.id
  ) as empates_ganados,
  count(m.id) filter (
    where m.status = 'finalizado'
      and m.home_score = m.away_score
      and m.shootout_winner_team_id is not null
      and m.shootout_winner_team_id <> t.id
  ) as empates_perdidos,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.home_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.away_score
      else 0
    end
  ), 0) as a_favor,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.away_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.home_score
      else 0
    end
  ), 0) as en_contra,
  coalesce(sum(
    case
      when m.status = 'finalizado' and m.home_team_id = t.id then m.home_score - m.away_score
      when m.status = 'finalizado' and m.away_team_id = t.id then m.away_score - m.home_score
      else 0
    end
  ), 0) as diferencia,
  coalesce(sum(
    case
      when m.status <> 'finalizado' then 0
      when (m.home_team_id = t.id and m.home_score > m.away_score)
        or (m.away_team_id = t.id and m.away_score > m.home_score)
        then coalesce(os.points_win, s.points_win)
      when m.home_score = m.away_score and m.shootout_winner_team_id = t.id
        then coalesce(os.points_shootout_win, s.points_shootout_win)
      when m.home_score = m.away_score
           and m.shootout_winner_team_id is not null
           and m.shootout_winner_team_id <> t.id
        then coalesce(os.points_shootout_loss, s.points_shootout_loss)
      when m.home_score = m.away_score
        then coalesce(os.points_draw, s.points_draw)
      else coalesce(os.points_loss, s.points_loss)
    end
  ), 0) as puntos
from public.teams t
join public.divisions d on d.id = t.division_id
join public.sports s on s.id = d.sport_id
left join public.org_sports os
  on os.sport_id = d.sport_id
 and os.organization_id = t.organization_id
left join public.matches m
  on m.division_id = t.division_id
 and (m.home_team_id = t.id or m.away_team_id = t.id)
 and (t.group_id is null or m.group_id is null or m.group_id = t.group_id)
group by
  t.organization_id, t.division_id, t.group_id, d.tournament_id,
  d.sport_id, d.branch, d.category_id, t.id, t.name;

create view public.scorers
with (security_invoker = true) as
select
  pr.organization_id,
  m.division_id,
  m.group_id,
  pr.id as player_registration_id,
  p.first_names,
  p.last_names,
  t.id as team_id,
  t.name as team_name,
  sum(me.quantity) filter (where me.event_type in ('gol', 'pts', 'carrera')) as anotaciones
from public.match_events me
join public.match_sheets ms on ms.id = me.match_sheet_id
join public.matches m on m.id = ms.match_id and m.status = 'finalizado'
join public.player_registrations pr on pr.id = me.player_registration_id
join public.players p on p.id = pr.player_id
join public.teams t on t.id = pr.team_id
group by
  pr.organization_id, m.division_id, m.group_id, pr.id,
  p.first_names, p.last_names, t.id, t.name;

create view public.cross_results
with (security_invoker = true) as
select
  m.organization_id,
  m.division_id,
  m.group_id,
  m.home_team_id,
  m.away_team_id,
  m.home_score,
  m.away_score,
  m.shootout_winner_team_id,
  m.jornada,
  m.id as match_id
from public.matches m
where m.status = 'finalizado';

create view public.public_matches
with (security_invoker = true) as
select
  o.slug as org_slug,
  m.id,
  m.scheduled_at,
  m.venue,
  m.jornada,
  m.stage,
  m.status,
  m.home_score,
  m.away_score,
  ht.name as home_team_name,
  at.name as away_team_name,
  s.key as sport_key,
  s.name as sport_name,
  d.branch,
  c.name as category_name,
  g.name as group_name
from public.matches m
join public.organizations o on o.id = m.organization_id and o.is_public = true
join public.teams ht on ht.id = m.home_team_id
join public.teams at on at.id = m.away_team_id
join public.divisions d on d.id = m.division_id
join public.sports s on s.id = d.sport_id
join public.categories c on c.id = d.category_id
left join public.groups g on g.id = m.group_id;

create view public.public_standings
with (security_invoker = true) as
select
  o.slug as org_slug,
  st.*
from public.standings st
join public.organizations o on o.id = st.organization_id and o.is_public = true;

create view public.public_scorers
with (security_invoker = true) as
select
  o.slug as org_slug,
  sc.*
from public.scorers sc
join public.organizations o on o.id = sc.organization_id and o.is_public = true;

create view public.public_notices
with (security_invoker = true) as
select
  o.slug as org_slug,
  n.id,
  n.title,
  n.body,
  n.audience,
  n.featured,
  n.published_at
from public.notices n
join public.organizations o on o.id = n.organization_id and o.is_public = true
where n.is_public = true
  and n.published_at is not null;

create or replace function public.validate_credential(p_folio text)
returns table (
  folio text,
  first_names text,
  last_names text,
  photo_url text,
  team_name text,
  club_name text,
  sport_name text,
  branch public.branch,
  category_name text,
  classification text,
  status public.approval_status,
  eligibility public.eligibility_status,
  is_valid boolean
)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select
    pr.folio,
    p.first_names,
    p.last_names,
    p.photo_url,
    t.name,
    cl.name,
    s.name,
    d.branch,
    cat.name,
    p.classification,
    pr.status,
    pr.eligibility,
    (pr.status = 'aprobado' and pr.eligibility = 'elegible') as is_valid
  from public.player_registrations pr
  join public.players p on p.id = pr.player_id
  join public.teams t on t.id = pr.team_id
  join public.clubs cl on cl.id = p.club_id
  join public.divisions d on d.id = t.division_id
  join public.sports s on s.id = d.sport_id
  join public.categories cat on cat.id = d.category_id
  where pr.folio = upper(trim(p_folio));
end;
$$;

revoke all on function public.validate_credential(text) from public;
grant execute on function public.validate_credential(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 9. RLS
-- -----------------------------------------------------------------------------

alter table public.organizations enable row level security;
alter table public.sports enable row level security;
alter table public.org_sports enable row level security;
alter table public.org_sport_branches enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.tournaments enable row level security;
alter table public.divisions enable row level security;
alter table public.groups enable row level security;
alter table public.teams enable row level security;
alter table public.memberships enable row level security;
alter table public.players enable row level security;
alter table public.player_registrations enable row level security;
alter table public.matches enable row level security;
alter table public.match_schedule_changes enable row level security;
alter table public.match_sheets enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_events enable row level security;
alter table public.match_sets enable row level security;
alter table public.sanctions enable row level security;
alter table public.bracket_slots enable row level security;
alter table public.protests enable row level security;
alter table public.protest_evidence enable row level security;
alter table public.notices enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;

-- organizations
create policy "organizations_insert_authenticated"
  on public.organizations for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "organizations_select_members"
  on public.organizations for select
  using (
    public.is_org_member(id)
    or is_public = true
  );

create policy "organizations_update_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(id, array['admin']::public.membership_role[]));

create policy "organizations_delete_admin"
  on public.organizations for delete
  using (public.has_org_role(id, array['admin']::public.membership_role[]));

-- sports (read-only for authenticated; service_role writes)
create policy "sports_select_authenticated"
  on public.sports for select to authenticated
  using (true);

create policy "sports_select_anon_public"
  on public.sports for select to anon
  using (true);

-- memberships
create policy "memberships_select_org_members"
  on public.memberships for select
  using (public.is_org_member(organization_id));

create policy "memberships_insert_admin"
  on public.memberships for insert
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "memberships_update_admin"
  on public.memberships for update
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "memberships_delete_admin"
  on public.memberships for delete
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- profiles
create policy "profiles_select_self_or_org_peers"
  on public.profiles for select
  using (id = (select auth.uid()) or public.shares_org_with(id));

create policy "profiles_update_own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- helper macro: admin write + member select for org-scoped config tables
create policy "org_sports_select_members"
  on public.org_sports for select
  using (public.is_org_member(organization_id));

create policy "org_sports_write_admin"
  on public.org_sports for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "org_sport_branches_select_members"
  on public.org_sport_branches for select
  using (public.is_org_member(organization_id));

create policy "org_sport_branches_write_admin"
  on public.org_sport_branches for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "categories_select_members"
  on public.categories for select
  using (public.is_org_member(organization_id));

create policy "categories_write_admin"
  on public.categories for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "clubs_select_members"
  on public.clubs for select
  using (public.is_org_member(organization_id));

create policy "clubs_write_admin"
  on public.clubs for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "tournaments_select_members"
  on public.tournaments for select
  using (public.is_org_member(organization_id));

create policy "tournaments_write_admin"
  on public.tournaments for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "divisions_select_members"
  on public.divisions for select
  using (public.is_org_member(organization_id));

create policy "divisions_write_admin"
  on public.divisions for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "groups_select_members"
  on public.groups for select
  using (public.is_org_member(organization_id));

create policy "groups_write_admin"
  on public.groups for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "teams_select_members"
  on public.teams for select
  using (public.is_org_member(organization_id));

create policy "teams_insert_admin"
  on public.teams for insert
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "teams_update_admin_or_delegado"
  on public.teams for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(id)
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(id)
  );

create policy "teams_delete_admin"
  on public.teams for delete
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- players: admin full; delegado of club's teams can insert/update players for their club
create policy "players_select_members"
  on public.players for select
  using (public.is_org_member(organization_id));

create policy "players_insert_admin_or_delegado"
  on public.players for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.memberships m
      join public.teams t on t.id = m.team_id
      where m.user_id = (select auth.uid())
        and m.role = 'team_manager'
        and t.club_id = players.club_id
        and t.organization_id = players.organization_id
    )
  );

create policy "players_update_admin_or_delegado"
  on public.players for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.memberships m
      join public.teams t on t.id = m.team_id
      where m.user_id = (select auth.uid())
        and m.role = 'team_manager'
        and t.club_id = players.club_id
    )
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.memberships m
      join public.teams t on t.id = m.team_id
      where m.user_id = (select auth.uid())
        and m.role = 'team_manager'
        and t.club_id = players.club_id
    )
  );

create policy "players_delete_admin"
  on public.players for delete
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- player_registrations
create policy "player_registrations_select_members"
  on public.player_registrations for select
  using (public.is_org_member(organization_id));

create policy "player_registrations_insert_admin_or_delegado"
  on public.player_registrations for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(team_id)
  );

create policy "player_registrations_update_admin_or_delegado_pending"
  on public.player_registrations for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or (
      public.manages_team(team_id)
      and status = 'pendiente'
    )
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(team_id)
  );

create policy "player_registrations_delete_admin_or_delegado_pending"
  on public.player_registrations for delete
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or (public.manages_team(team_id) and status = 'pendiente')
  );

-- matches: admin CRUD; referee assigned can update shootout before close via sheet
create policy "matches_select_members"
  on public.matches for select
  using (public.is_org_member(organization_id));

create policy "matches_insert_admin"
  on public.matches for insert
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "matches_update_admin_or_assigned_referee"
  on public.matches for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or referee_id = (select auth.uid())
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or referee_id = (select auth.uid())
  );

create policy "matches_delete_admin"
  on public.matches for delete
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "match_schedule_changes_select_members"
  on public.match_schedule_changes for select
  using (public.is_org_member(organization_id));

create policy "match_schedule_changes_insert_admin"
  on public.match_schedule_changes for insert
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- match sheets: assigned referee writes; admin always; delegado of either team reads
create policy "match_sheets_select_members"
  on public.match_sheets for select
  using (public.is_org_member(organization_id));

create policy "match_sheets_insert_admin_or_referee"
  on public.match_sheets for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.is_assigned_referee(match_id)
  );

create policy "match_sheets_update_admin_or_referee"
  on public.match_sheets for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.is_assigned_referee(match_id)
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.is_assigned_referee(match_id)
  );

create policy "match_participants_select_members"
  on public.match_participants for select
  using (public.is_org_member(organization_id));

create policy "match_participants_write_admin_or_referee"
  on public.match_participants for all
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.match_sheets ms
      where ms.id = match_participants.match_sheet_id
        and public.is_assigned_referee(ms.match_id)
    )
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.match_sheets ms
      where ms.id = match_participants.match_sheet_id
        and public.is_assigned_referee(ms.match_id)
    )
  );

create policy "match_events_select_members"
  on public.match_events for select
  using (public.is_org_member(organization_id));

create policy "match_events_write_admin_or_referee"
  on public.match_events for all
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.match_sheets ms
      where ms.id = match_events.match_sheet_id
        and public.is_assigned_referee(ms.match_id)
    )
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.match_sheets ms
      where ms.id = match_events.match_sheet_id
        and public.is_assigned_referee(ms.match_id)
    )
  );

create policy "match_sets_select_members"
  on public.match_sets for select
  using (public.is_org_member(organization_id));

create policy "match_sets_write_admin_or_referee"
  on public.match_sets for all
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.is_assigned_referee(match_id)
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.is_assigned_referee(match_id)
  );

-- sanctions, brackets, notices, audit: admin write; members read
create policy "sanctions_select_members"
  on public.sanctions for select
  using (public.is_org_member(organization_id));

create policy "sanctions_write_admin"
  on public.sanctions for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "bracket_slots_select_members"
  on public.bracket_slots for select
  using (public.is_org_member(organization_id));

create policy "bracket_slots_write_admin"
  on public.bracket_slots for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "notices_select_members"
  on public.notices for select
  using (public.is_org_member(organization_id));

create policy "notices_write_admin"
  on public.notices for all
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "audit_log_select_admin"
  on public.audit_log for select
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- protests: delegado files for own team; admin responds
create policy "protests_select_members"
  on public.protests for select
  using (public.is_org_member(organization_id));

create policy "protests_insert_delegado"
  on public.protests for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(team_id)
  );

create policy "protests_update_admin"
  on public.protests for update
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

create policy "protest_evidence_select"
  on public.protest_evidence for select
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1 from public.protests p
      where p.id = protest_evidence.protest_id
        and (p.filed_by = (select auth.uid()) or public.manages_team(p.team_id))
    )
  );

create policy "protest_evidence_insert"
  on public.protest_evidence for insert
  with check (
    exists (
      select 1 from public.protests p
      where p.id = protest_id
        and (
          public.has_org_role(p.organization_id, array['admin']::public.membership_role[])
          or public.manages_team(p.team_id)
        )
    )
  );

-- notifications: own rows
create policy "notifications_select_own"
  on public.notifications for select
  using (user_id = (select auth.uid()));

create policy "notifications_update_own"
  on public.notifications for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- -----------------------------------------------------------------------------
-- 10. STORAGE NOTES (aplicar en Dashboard o migración de storage)
-- -----------------------------------------------------------------------------
-- Buckets requeridos:
--   1) player-photos  — público lectura; upload autenticado bajo {org_id}/{team_id}/
--   2) protest-evidence — privado; lectura admin + autor de la protesta
-- Políticas Storage se configuran en Supabase Dashboard o con storage.objects RLS.
