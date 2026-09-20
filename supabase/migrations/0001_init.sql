-- =============================================================================
-- SPORTS LEAGUE · 0001_init.sql
-- =============================================================================
-- Plataforma multi-organización de ligas multideporte (Next.js 15 + Supabase).
--
-- Cambios de fondo respecto a la v1 (nunca ejecutada):
--   · Multi-tenant real: todo cuelga de `organizations` vía `organization_id`.
--   · Los roles ya no viven en `profiles`; viven en `memberships`
--     (un usuario puede tener varios roles en varias organizaciones).
--   · `sport_type` (enum) se reemplaza por `sports` (tabla configurable con
--     reglas de puntuación por deporte).
--   · `tournament_teams` deja de acumular contadores: la tabla de posiciones
--     se calcula al vuelo en la vista `standings`.
--   · Se separan "personas del sistema" (`profiles`, ligadas a auth.users)
--     de "personas que juegan" (`players`, con o sin cuenta).
--   · Visibilidad: TODO es privado por organización (decisión confirmada).
--     No hay lectura pública/anónima en esta versión.
--   · `stats_soccer` / `stats_basketball` quedan fuera; van en 0002_stats.sql.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 0. EXTENSIONES
-- -----------------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- 1. ENUMS
-- -----------------------------------------------------------------------------

-- Rol de un usuario DENTRO de una organización (reemplaza a profiles.role).
create type public.membership_role as enum (
  'admin',
  'league_manager',
  'team_manager',
  'referee'
);

-- Cómo se interpreta el marcador general de un partido para un deporte.
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
  'suspendido'
);

-- -----------------------------------------------------------------------------
-- 2. TABLAS NÚCLEO
-- -----------------------------------------------------------------------------

-- organizations: raíz del multi-tenant. Cada liga/club es una organización.
create table public.organizations (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  settings     jsonb not null default '{}'::jsonb,
  -- Quién la creó; se usa en el trigger que lo vuelve 'admin' automáticamente.
  created_by   uuid not null default auth.uid() references auth.users (id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chk_organizations_slug_format check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$')
);
comment on table public.organizations is
  'Tenant raíz. El usuario que la crea queda como admin vía trigger (ver sección 5).';

-- sports: reemplaza al enum sport_type. Configurable y con reglas de puntos.
create table public.sports (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  points_win    integer not null,
  points_draw   integer not null,
  points_loss   integer not null,
  allows_draws  boolean not null default true,
  score_type    public.score_type not null,
  created_at    timestamptz not null default now(),
  constraint chk_sports_points_non_negative check (
    points_win >= 0 and points_draw >= 0 and points_loss >= 0
  )
);
comment on table public.sports is
  'Catálogo global de deportes. Solo escribible por service_role (ver RLS).';

-- Seed: valores por defecto razonables; cada organización puede pedir que se
-- ajusten manualmente si su reglamento interno difiere.
insert into public.sports (name, points_win, points_draw, points_loss, allows_draws, score_type)
values
  ('futbol',     3, 1, 0, true,  'goals'),
  ('basquetbol', 2, 0, 1, false, 'points'),
  ('voleibol',   3, 0, 0, false, 'sets'),
  ('tenis',      1, 0, 0, false, 'sets')
on conflict (name) do nothing;

-- teams: equipos, ahora anidados dentro de una organización.
create table public.teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  name             text not null,
  logo_url         text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  -- El nombre ya no es único global: es único POR organización.
  unique (organization_id, name)
);

-- memberships: rol de un usuario dentro de una organización (y, si el rol es
-- 'team_manager', a qué equipo está atado ese rol).
create table public.memberships (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  -- Solo tiene sentido (y solo se permite) cuando role = 'team_manager'.
  team_id          uuid references public.teams (id) on delete cascade,
  role             public.membership_role not null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (user_id, organization_id, role),
  constraint chk_memberships_team_id_only_for_team_manager check (
    team_id is null or role = 'team_manager'
  )
);
comment on table public.memberships is
  'Reemplaza a profiles.role. Un usuario puede tener varios roles en varias organizaciones.';

-- profiles: extensión 1:1 de auth.users. Ya NO tiene `role` (ver memberships).
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default '',
  apellido    text not null default '',
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
comment on table public.profiles is
  'Extiende auth.users. Se crea automáticamente vía trigger on_auth_user_created. Sin rol: los roles viven en memberships.';

-- players: personas que juegan dentro de una organización. Pueden o no tener
-- cuenta (profile_id nullable) — ej. un jugador que aún no se ha registrado.
create table public.players (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  full_name        text not null,
  profile_id       uuid unique references public.profiles (id) on delete set null,
  public_id        text not null unique,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
comment on table public.players is
  'Roster de personas. profile_id es opcional: un player puede existir sin cuenta de usuario.';

-- team_members: relación muchos-a-muchos entre players y teams (ya NO entre
-- profiles y teams).
create table public.team_members (
  id          uuid primary key default gen_random_uuid(),
  team_id     uuid not null references public.teams (id) on delete cascade,
  player_id   uuid not null references public.players (id) on delete cascade,
  is_captain  boolean not null default false,
  joined_at   timestamptz not null default now(),
  unique (team_id, player_id)
);

-- tournaments: agrega formato, ida/vuelta, estado de ciclo de vida y fecha.
create table public.tournaments (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  sport_id         uuid not null references public.sports (id) on delete restrict,
  name             text not null,
  season           text not null,
  format           text not null default 'round_robin',
  legs             integer not null default 1,
  status           public.tournament_status not null default 'registration',
  start_date       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (organization_id, name, season, sport_id),
  constraint chk_tournaments_format check (format in ('round_robin', 'knockout', 'groups')),
  constraint chk_tournaments_legs check (legs in (1, 2))
);

-- tournament_teams: SOLO inscripción (equipo <-> torneo). Los contadores de
-- la v1 se eliminaron; la tabla de posiciones se calcula en `standings`.
create table public.tournament_teams (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  tournament_id    uuid not null references public.tournaments (id) on delete cascade,
  team_id          uuid not null references public.teams (id) on delete cascade,
  created_at       timestamptz not null default now(),
  unique (tournament_id, team_id)
);

-- -----------------------------------------------------------------------------
-- 3. PARTIDOS
-- -----------------------------------------------------------------------------

create table public.matches (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  tournament_id    uuid not null references public.tournaments (id) on delete cascade,
  home_team_id     uuid not null references public.teams (id) on delete cascade,
  away_team_id     uuid not null references public.teams (id) on delete cascade,
  round            integer,
  stage            text,
  scheduled_at     timestamptz,
  status           public.match_status not null default 'programado',
  court_info       text,
  -- Goles (fútbol), puntos (básquet) o sets ganados (tenis/vóley).
  home_score       integer not null default 0,
  away_score       integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_matches_scores_non_negative check (home_score >= 0 and away_score >= 0),
  constraint chk_matches_teams_are_different check (home_team_id <> away_team_id)
);

-- match_sets: parciales para tenis/vóley (25-23, 6-4, ...).
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

-- Nota: stats_soccer / stats_basketball se crean en 0002_stats.sql y
-- referenciarán players(id), no profiles(id).

-- -----------------------------------------------------------------------------
-- 4. ÍNDICES
-- -----------------------------------------------------------------------------
-- Nota: donde un UNIQUE ya cubre organization_id como columna líder
-- (ej. teams(organization_id, name)), NO se duplica el índice.

create index idx_memberships_user_id on public.memberships (user_id);
create index idx_memberships_organization_id on public.memberships (organization_id);
-- Índice compuesto extra: es exactamente el patrón de lookup de
-- is_org_member()/has_org_role(), que corren en CADA policy RLS.
create index idx_memberships_org_user on public.memberships (organization_id, user_id);
create index idx_memberships_team_id on public.memberships (team_id) where team_id is not null;

create index idx_players_organization_id on public.players (organization_id);

create index idx_team_members_player_id on public.team_members (player_id);

create index idx_tournaments_sport_id on public.tournaments (sport_id);

create index idx_tournament_teams_organization_id on public.tournament_teams (organization_id);
create index idx_tournament_teams_team_id on public.tournament_teams (team_id);

create index idx_matches_organization_id on public.matches (organization_id);
create index idx_matches_tournament_id on public.matches (tournament_id);
create index idx_matches_home_team_id on public.matches (home_team_id);
create index idx_matches_away_team_id on public.matches (away_team_id);
create index idx_matches_status on public.matches (status);
create index idx_matches_scheduled_at on public.matches (scheduled_at);

create index idx_match_sets_organization_id on public.match_sets (organization_id);

-- -----------------------------------------------------------------------------
-- 5. FUNCIONES
-- -----------------------------------------------------------------------------

-- set_updated_at: mantiene `updated_at` sincronizado en cada UPDATE.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- is_org_member: ¿el usuario actual pertenece a esta organización?
-- SECURITY DEFINER: evita recursión infinita al aplicarse sobre políticas
-- de `memberships`/`organizations` que a su vez consultan `memberships`.
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

-- has_org_role: ¿el usuario actual tiene alguno de estos roles en esta org?
create or replace function public.has_org_role(p_organization_id uuid, p_roles public.membership_role[])
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

-- manages_team: ¿el usuario actual es 'team_manager' de este equipo puntual?
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

-- shares_org_with: ¿el usuario actual comparte alguna organización con
-- target_user_id? Se usa para la visibilidad de `profiles`.
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

-- handle_new_user: crea el profile al registrarse en Supabase Auth.
-- Ya NO asigna rol (no existe profiles.role).
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

-- handle_new_organization: al crear una organización, su creador queda
-- automáticamente como 'admin' en memberships. SECURITY DEFINER es
-- imprescindible: en ese instante todavía no existe ninguna membership,
-- así que una política RLS normal jamás dejaría pasar este INSERT.
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.memberships (user_id, organization_id, role)
  values (new.created_by, new.id, 'admin');
  return new;
end;
$$;

-- sync_tournament_teams_organization: fuerza organization_id = la del
-- torneo (ignora lo que mande el cliente) y valida que el equipo
-- pertenezca a esa misma organización. Evita que un bug/cliente malicioso
-- deje el `organization_id` desalineado, lo que rompería el aislamiento
-- multi-tenant de las políticas RLS que filtran solo por esa columna.
create or replace function public.sync_tournament_teams_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_org uuid;
  v_team_org uuid;
begin
  select organization_id into v_tournament_org from public.tournaments where id = new.tournament_id;
  select organization_id into v_team_org from public.teams where id = new.team_id;

  if v_tournament_org is null then
    raise exception 'tournament_id % no existe', new.tournament_id;
  end if;

  if v_team_org is null then
    raise exception 'team_id % no existe', new.team_id;
  end if;

  if v_team_org <> v_tournament_org then
    raise exception 'El equipo % no pertenece a la organización del torneo %', new.team_id, new.tournament_id;
  end if;

  new.organization_id = v_tournament_org;
  return new;
end;
$$;

-- sync_matches_organization: misma idea que la anterior, para `matches`.
create or replace function public.sync_matches_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_tournament_org uuid;
  v_home_org uuid;
  v_away_org uuid;
begin
  select organization_id into v_tournament_org from public.tournaments where id = new.tournament_id;
  select organization_id into v_home_org from public.teams where id = new.home_team_id;
  select organization_id into v_away_org from public.teams where id = new.away_team_id;

  if v_tournament_org is null then
    raise exception 'tournament_id % no existe', new.tournament_id;
  end if;

  if v_home_org is null or v_away_org is null then
    raise exception 'home_team_id/away_team_id inválido';
  end if;

  if v_home_org <> v_tournament_org or v_away_org <> v_tournament_org then
    raise exception 'Ambos equipos deben pertenecer a la organización del torneo %', new.tournament_id;
  end if;

  new.organization_id = v_tournament_org;
  return new;
end;
$$;

-- sync_match_sets_organization: misma idea, para `match_sets`.
create or replace function public.sync_match_sets_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match_org uuid;
begin
  select organization_id into v_match_org from public.matches where id = new.match_id;

  if v_match_org is null then
    raise exception 'match_id % no existe', new.match_id;
  end if;

  new.organization_id = v_match_org;
  return new;
end;
$$;

-- validate_match_result: si el deporte del torneo no permite empates
-- (sports.allows_draws = false) no se puede marcar un partido 'finalizado'
-- con home_score = away_score.
create or replace function public.validate_match_result()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_allows_draws boolean;
begin
  if new.status = 'finalizado' then
    select s.allows_draws into v_allows_draws
    from public.tournaments t
    join public.sports s on s.id = t.sport_id
    where t.id = new.tournament_id;

    if v_allows_draws is false and new.home_score = new.away_score then
      raise exception 'El deporte de este torneo no permite empates (home_score = away_score)';
    end if;
  end if;
  return new;
end;
$$;

-- restrict_referee_match_updates: si quien actualiza el partido tiene rol
-- 'referee' en la organización pero NO 'admin'/'league_manager', solo puede
-- tocar el resultado (home_score/away_score) y el status. RLS controla FILAS,
-- no columnas, así que esta restricción de columna se hace con un trigger.
create or replace function public.restrict_referee_match_updates()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Se usa OLD.organization_id (no NEW) a propósito: es la fuente de verdad
  -- y evita depender del orden de ejecución respecto a
  -- sync_matches_organization (que corrige NEW.organization_id). Este mismo
  -- trigger ya impide más abajo que organization_id cambie.
  if public.has_org_role(old.organization_id, array['referee']::public.membership_role[])
     and not public.has_org_role(old.organization_id, array['admin', 'league_manager']::public.membership_role[])
  then
    if new.tournament_id   <> old.tournament_id
      or new.home_team_id  <> old.home_team_id
      or new.away_team_id  <> old.away_team_id
      or new.organization_id <> old.organization_id
      or new.round is distinct from old.round
      or new.stage is distinct from old.stage
      or new.scheduled_at is distinct from old.scheduled_at
      or new.court_info is distinct from old.court_info
    then
      raise exception 'Un árbitro solo puede actualizar el resultado (home_score, away_score) y el status del partido';
    end if;
  end if;
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 6. TRIGGERS
-- -----------------------------------------------------------------------------

create trigger trg_organizations_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger trg_teams_updated_at
  before update on public.teams
  for each row execute function public.set_updated_at();

create trigger trg_memberships_updated_at
  before update on public.memberships
  for each row execute function public.set_updated_at();

create trigger trg_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger trg_players_updated_at
  before update on public.players
  for each row execute function public.set_updated_at();

create trigger trg_tournaments_updated_at
  before update on public.tournaments
  for each row execute function public.set_updated_at();

create trigger trg_matches_updated_at
  before update on public.matches
  for each row execute function public.set_updated_at();

create trigger trg_match_sets_updated_at
  before update on public.match_sets
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger trg_organizations_bootstrap_admin
  after insert on public.organizations
  for each row execute function public.handle_new_organization();

create trigger trg_tournament_teams_sync_org
  before insert or update on public.tournament_teams
  for each row execute function public.sync_tournament_teams_organization();

create trigger trg_matches_sync_org
  before insert or update on public.matches
  for each row execute function public.sync_matches_organization();

create trigger trg_matches_validate_result
  before insert or update on public.matches
  for each row execute function public.validate_match_result();

create trigger trg_matches_restrict_referee_updates
  before update on public.matches
  for each row execute function public.restrict_referee_match_updates();

create trigger trg_match_sets_sync_org
  before insert or update on public.match_sets
  for each row execute function public.sync_match_sets_organization();

-- -----------------------------------------------------------------------------
-- 7. VISTA: standings (tabla de posiciones calculada, no almacenada)
-- -----------------------------------------------------------------------------
-- security_invoker = true: la vista se ejecuta con los permisos de quien
-- consulta (no del owner), así que respeta el RLS de tournament_teams/
-- matches/teams automáticamente. Sin esto, la vista podría filtrar datos
-- de organizaciones ajenas.

create view public.standings
with (security_invoker = true) as
select
  tt.organization_id,
  tt.tournament_id,
  tt.team_id,
  te.name as team_name,
  count(m.id) as pj,
  count(m.id) filter (
    where (m.home_team_id = tt.team_id and m.home_score > m.away_score)
       or (m.away_team_id = tt.team_id and m.away_score > m.home_score)
  ) as g,
  count(m.id) filter (where m.home_score = m.away_score) as e,
  count(m.id) filter (
    where (m.home_team_id = tt.team_id and m.home_score < m.away_score)
       or (m.away_team_id = tt.team_id and m.away_score < m.home_score)
  ) as p,
  coalesce(sum(
    case
      when m.home_team_id = tt.team_id then m.home_score
      when m.away_team_id = tt.team_id then m.away_score
    end
  ), 0) as gf,
  coalesce(sum(
    case
      when m.home_team_id = tt.team_id then m.away_score
      when m.away_team_id = tt.team_id then m.home_score
    end
  ), 0) as gc,
  coalesce(sum(
    case
      when m.home_team_id = tt.team_id then m.home_score - m.away_score
      when m.away_team_id = tt.team_id then m.away_score - m.home_score
    end
  ), 0) as dg,
  coalesce(sum(
    case
      when (m.home_team_id = tt.team_id and m.home_score > m.away_score)
        or (m.away_team_id = tt.team_id and m.away_score > m.home_score)
        then s.points_win
      when m.home_score = m.away_score then s.points_draw
      else s.points_loss
    end
  ), 0) as pts
from public.tournament_teams tt
join public.teams te on te.id = tt.team_id
join public.tournaments tr on tr.id = tt.tournament_id
join public.sports s on s.id = tr.sport_id
left join public.matches m
  on m.tournament_id = tt.tournament_id
 and m.status = 'finalizado'
 and (m.home_team_id = tt.team_id or m.away_team_id = tt.team_id)
group by tt.organization_id, tt.tournament_id, tt.team_id, te.name;

comment on view public.standings is
  'Tabla de posiciones calculada al vuelo desde matches finalizados + reglas de puntos del deporte. '
  'Ordenar en el cliente/consulta por pts desc, dg desc, gf desc.';

-- -----------------------------------------------------------------------------
-- 8. ROW LEVEL SECURITY (RLS)
-- -----------------------------------------------------------------------------

alter table public.organizations      enable row level security;
alter table public.sports             enable row level security;
alter table public.teams              enable row level security;
alter table public.memberships        enable row level security;
alter table public.profiles           enable row level security;
alter table public.players            enable row level security;
alter table public.team_members       enable row level security;
alter table public.tournaments        enable row level security;
alter table public.tournament_teams   enable row level security;
alter table public.matches            enable row level security;
alter table public.match_sets         enable row level security;

-- --- organizations ----------------------------------------------------------

-- Cualquier usuario autenticado puede crear una organización (queda admin
-- automáticamente vía trigger). with check obliga a que se autoasigne como
-- creador; no puede crear una org "a nombre de" otro usuario.
create policy "organizations_insert_authenticated"
  on public.organizations for insert
  to authenticated
  with check (created_by = (select auth.uid()));

create policy "organizations_select_members"
  on public.organizations for select
  using (public.is_org_member(id));

create policy "organizations_update_admin"
  on public.organizations for update
  using (public.has_org_role(id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(id, array['admin']::public.membership_role[]));

create policy "organizations_delete_admin"
  on public.organizations for delete
  using (public.has_org_role(id, array['admin']::public.membership_role[]));

-- --- sports -------------------------------------------------------------
-- Lectura para cualquier usuario autenticado. NO se define ninguna política
-- de escritura: sin una política permisiva de INSERT/UPDATE/DELETE, RLS
-- deniega por defecto a 'authenticated'. Solo `service_role` (que además
-- bypassea RLS por diseño en Supabase) puede escribir aquí.

create policy "sports_select_authenticated"
  on public.sports for select
  to authenticated
  using (true);

-- --- memberships --------------------------------------------------------
-- Los roles solo se cambian vía memberships, y solo por un admin de esa
-- organización (requisito explícito). El bootstrap de la primera membership
-- admin ocurre vía trigger SECURITY DEFINER (handle_new_organization), que
-- bypassea estas políticas.

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

-- --- profiles -------------------------------------------------------------
-- Ya no es pública: solo el propio usuario y quienes comparten organización.

create policy "profiles_select_self_or_org_peers"
  on public.profiles for select
  using (
    id = (select auth.uid())
    or public.shares_org_with(id)
  );

create policy "profiles_update_own"
  on public.profiles for update
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- --- players ----------------------------------------------------------------

create policy "players_select_org_members"
  on public.players for select
  using (public.is_org_member(organization_id));

create policy "players_write_staff"
  on public.players for all
  using (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

-- --- teams --------------------------------------------------------------
-- team_manager ("solo su equipo") puede actualizar ÚNICAMENTE el equipo que
-- gestiona (memberships.team_id), no crear ni borrar equipos.

create policy "teams_select_org_members"
  on public.teams for select
  using (public.is_org_member(organization_id));

create policy "teams_insert_staff"
  on public.teams for insert
  with check (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

create policy "teams_update_staff_or_manager"
  on public.teams for update
  using (
    public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[])
    or public.manages_team(id)
  )
  with check (
    public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[])
    or public.manages_team(id)
  );

create policy "teams_delete_staff"
  on public.teams for delete
  using (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

-- --- team_members ---------------------------------------------------------
-- team_members no tiene organization_id propio: se deriva vía teams.

create policy "team_members_select_org_members"
  on public.team_members for select
  using (
    exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and public.is_org_member(t.organization_id)
    )
  );

create policy "team_members_write_staff_or_manager"
  on public.team_members for all
  using (
    public.manages_team(team_id)
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and public.has_org_role(t.organization_id, array['admin', 'league_manager']::public.membership_role[])
    )
  )
  with check (
    public.manages_team(team_id)
    or exists (
      select 1 from public.teams t
      where t.id = team_members.team_id
        and public.has_org_role(t.organization_id, array['admin', 'league_manager']::public.membership_role[])
    )
  );

-- --- tournaments / tournament_teams --------------------------------------
-- CRUD completo solo para admin/league_manager (requisito explícito).

create policy "tournaments_select_org_members"
  on public.tournaments for select
  using (public.is_org_member(organization_id));

create policy "tournaments_write_staff"
  on public.tournaments for all
  using (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

create policy "tournament_teams_select_org_members"
  on public.tournament_teams for select
  using (public.is_org_member(organization_id));

create policy "tournament_teams_write_staff"
  on public.tournament_teams for all
  using (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

-- --- matches ----------------------------------------------------------------
-- referee puede intentar el UPDATE (fila visible), pero el trigger
-- restrict_referee_match_updates() limita qué columnas puede tocar realmente.

create policy "matches_select_org_members"
  on public.matches for select
  using (public.is_org_member(organization_id));

create policy "matches_insert_staff"
  on public.matches for insert
  with check (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

create policy "matches_update_staff_or_referee"
  on public.matches for update
  using (public.has_org_role(organization_id, array['admin', 'league_manager', 'referee']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin', 'league_manager', 'referee']::public.membership_role[]));

create policy "matches_delete_staff"
  on public.matches for delete
  using (public.has_org_role(organization_id, array['admin', 'league_manager']::public.membership_role[]));

-- --- match_sets ---------------------------------------------------------
-- Los parciales SON el resultado (no hay más columnas que restringir), así
-- que a diferencia de `matches` el referee puede escribir aquí sin trigger
-- adicional de restricción de columnas.

create policy "match_sets_select_org_members"
  on public.match_sets for select
  using (public.is_org_member(organization_id));

create policy "match_sets_write_staff_or_referee"
  on public.match_sets for all
  using (public.has_org_role(organization_id, array['admin', 'league_manager', 'referee']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin', 'league_manager', 'referee']::public.membership_role[]));
