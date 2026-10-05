-- =============================================================================
-- SPORTS LEAGUE · 0010_security_hardening.sql
-- =============================================================================
--  1. player_registrations: org desde el equipo, jugador del mismo club, folio
--     siempre generado en servidor (80 bits).
--  2. match_events: team_id derivado de la inscripción y jugador en cédula.
--  3. Storage protest-evidence: mismo alcance que la tabla (admin + autor/delegado).
--  4. membership_requests: solo 'pendiente', org pública y club de esa org.
--  5. players.created_by / protests.filed_by no se pueden falsear.
--  6. protest_evidence: organization_id coherente con la protesta.
--  7. notifications: destinatario miembro de la org y enlace relativo.
--  8. organizations: anon ya no lee la tabla (usa public_organizations).
--  9. Slugs reservados y límites de longitud (NOT VALID: no rompe filas viejas).
-- 10. validate_credential: datos personales solo de credenciales aprobadas.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. player_registrations
-- -----------------------------------------------------------------------------

create or replace function public.generate_registration_folio()
returns trigger
language plpgsql
as $$
begin
  new.folio := upper(encode(gen_random_bytes(10), 'hex'));
  return new;
end;
$$;

create or replace function public.validate_registration_scope()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team record;
  v_player record;
begin
  select id, organization_id, club_id into v_team
  from public.teams where id = new.team_id;
  if v_team.id is null then
    raise exception 'team_id % no existe', new.team_id;
  end if;

  select id, organization_id, club_id into v_player
  from public.players where id = new.player_id;
  if v_player.id is null then
    raise exception 'player_id % no existe', new.player_id;
  end if;

  if v_player.organization_id <> v_team.organization_id
     or v_player.club_id <> v_team.club_id
  then
    raise exception 'El jugador debe pertenecer al mismo club y liga que el equipo';
  end if;

  new.organization_id := v_team.organization_id;
  return new;
end;
$$;

revoke all on function public.validate_registration_scope() from public, anon, authenticated;

drop trigger if exists trg_player_registrations_scope on public.player_registrations;
create trigger trg_player_registrations_scope
  before insert or update of team_id, player_id, organization_id
  on public.player_registrations
  for each row execute function public.validate_registration_scope();

-- -----------------------------------------------------------------------------
-- 2. match_events
-- -----------------------------------------------------------------------------

create or replace function public.validate_match_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_team uuid;
begin
  select mp.team_id into v_team
  from public.match_participants mp
  where mp.match_sheet_id = new.match_sheet_id
    and mp.player_registration_id = new.player_registration_id;

  if v_team is null then
    raise exception 'El jugador no está registrado como participante en esta cédula';
  end if;

  new.team_id := v_team;
  return new;
end;
$$;

revoke all on function public.validate_match_event() from public, anon, authenticated;

drop trigger if exists trg_match_events_validate on public.match_events;
create trigger trg_match_events_validate
  before insert or update of player_registration_id, team_id, match_sheet_id
  on public.match_events
  for each row execute function public.validate_match_event();

-- -----------------------------------------------------------------------------
-- 3. Storage protest-evidence: {org_id}/{protest_id}/...
-- -----------------------------------------------------------------------------

create or replace function public.can_access_protest(p_org_id uuid, p_protest_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.protests p
    where p.id = p_protest_id
      and p.organization_id = p_org_id
      and (
        public.has_org_role(p.organization_id, array['admin']::public.membership_role[])
        or p.filed_by = (select auth.uid())
        or public.manages_team(p.team_id)
      )
  );
$$;

revoke all on function public.can_access_protest(uuid, uuid) from public;
grant execute on function public.can_access_protest(uuid, uuid) to authenticated;

drop policy if exists "protest_evidence_read_org_member" on storage.objects;
drop policy if exists "protest_evidence_insert_org_member" on storage.objects;

create policy "protest_evidence_read_scoped"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'protest-evidence'
    and public.can_access_protest(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
  );

create policy "protest_evidence_insert_scoped"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'protest-evidence'
    and public.can_access_protest(
      ((storage.foldername(name))[1])::uuid,
      ((storage.foldername(name))[2])::uuid
    )
  );

-- -----------------------------------------------------------------------------
-- 4. membership_requests
-- -----------------------------------------------------------------------------

drop policy if exists "membership_requests_insert_own" on public.membership_requests;

create policy "membership_requests_insert_own"
  on public.membership_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and status = 'pendiente'
    and reviewed_by is null
    and reviewed_at is null
    and requested_role in (
      'team_manager'::public.membership_role,
      'referee'::public.membership_role
    )
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id and o.is_public = true
    )
    and (
      club_id is null
      or exists (
        select 1 from public.clubs c
        where c.id = club_id and c.organization_id = membership_requests.organization_id
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 5. players.created_by / protests.filed_by
-- -----------------------------------------------------------------------------

drop policy if exists "players_insert_admin_or_delegado" on public.players;

create policy "players_insert_admin_or_delegado"
  on public.players for insert
  with check (
    created_by = (select auth.uid())
    and (
      public.has_org_role(organization_id, array['admin']::public.membership_role[])
      or exists (
        select 1
        from public.memberships m
        join public.teams t on t.id = m.team_id
        where m.user_id = (select auth.uid())
          and m.role = 'team_manager'
          and m.organization_id = t.organization_id
          and t.club_id = players.club_id
          and t.organization_id = players.organization_id
      )
    )
  );

create or replace function public.lock_players_created_by()
returns trigger
language plpgsql
as $$
begin
  new.created_by := old.created_by;
  return new;
end;
$$;

drop trigger if exists trg_players_lock_created_by on public.players;
create trigger trg_players_lock_created_by
  before update of created_by on public.players
  for each row execute function public.lock_players_created_by();

drop policy if exists "protests_insert_delegado" on public.protests;

create policy "protests_insert_delegado"
  on public.protests for insert
  with check (
    filed_by = (select auth.uid())
    and exists (
      select 1 from public.teams t
      where t.id = team_id and t.organization_id = protests.organization_id
    )
    and (
      public.has_org_role(organization_id, array['admin']::public.membership_role[])
      or public.manages_team(team_id)
    )
  );

-- -----------------------------------------------------------------------------
-- 6. protest_evidence
-- -----------------------------------------------------------------------------

drop policy if exists "protest_evidence_insert" on public.protest_evidence;

create policy "protest_evidence_insert"
  on public.protest_evidence for insert
  with check (
    exists (
      select 1 from public.protests p
      where p.id = protest_id
        and p.organization_id = protest_evidence.organization_id
        and (
          public.has_org_role(p.organization_id, array['admin']::public.membership_role[])
          or public.manages_team(p.team_id)
        )
    )
  );

-- -----------------------------------------------------------------------------
-- 7. notifications
-- -----------------------------------------------------------------------------

drop policy if exists "notifications_insert_admin" on public.notifications;

create policy "notifications_insert_admin"
  on public.notifications for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    and exists (
      select 1 from public.memberships m
      where m.user_id = notifications.user_id
        and m.organization_id = notifications.organization_id
    )
    and (
      link is null
      or (left(link, 1) = '/' and left(link, 2) <> '//' and strpos(link, chr(92)) = 0)
    )
  );

-- -----------------------------------------------------------------------------
-- 8. organizations: lectura solo para miembros (o quien la creó)
-- -----------------------------------------------------------------------------

drop policy if exists "organizations_select_members" on public.organizations;

create policy "organizations_select_members"
  on public.organizations for select
  using (
    public.is_org_member(id)
    or created_by = (select auth.uid())
  );

-- -----------------------------------------------------------------------------
-- 9. Slugs reservados y longitudes
-- -----------------------------------------------------------------------------

alter table public.organizations
  add constraint chk_organizations_slug_not_reserved check (
    slug not in (
      'login', 'signup', 'onboarding', 'pending', 'join', 'p', 'c',
      'api', 'auth', 'admin', 'forgot-password', 'reset-password', '_next'
    )
  ) not valid;

alter table public.organizations
  add constraint chk_organizations_name_length check (length(name) <= 120) not valid;
alter table public.clubs
  add constraint chk_clubs_name_length check (length(name) <= 120) not valid;
alter table public.teams
  add constraint chk_teams_name_length check (length(name) <= 120) not valid;
alter table public.tournaments
  add constraint chk_tournaments_name_length check (length(name) <= 120) not valid;
alter table public.players
  add constraint chk_players_names_length check (
    length(first_names) <= 120 and length(last_names) <= 120
    and (id_number is null or length(id_number) <= 40)
    and (classification is null or length(classification) <= 60)
  ) not valid;
alter table public.matches
  add constraint chk_matches_text_length check (
    (venue is null or length(venue) <= 160)
    and (status_reason is null or length(status_reason) <= 500)
  ) not valid;
alter table public.match_sheets
  add constraint chk_match_sheets_text_length check (
    (observations is null or length(observations) <= 2000)
    and (referee_name is null or length(referee_name) <= 120)
  ) not valid;
alter table public.match_events
  add constraint chk_match_events_note_length check (note is null or length(note) <= 500) not valid;
alter table public.membership_requests
  add constraint chk_membership_requests_text_length check (
    length(full_name) <= 120 and length(email) <= 254
    and (username is null or length(username) <= 40)
    and (phone is null or length(phone) <= 30)
  ) not valid;
alter table public.notices
  add constraint chk_notices_text_length check (
    length(title) <= 200 and length(body) <= 5000
  ) not valid;
alter table public.protests
  add constraint chk_protests_text_length check (
    length(reason) <= 500 and (description is null or length(description) <= 5000)
  ) not valid;

-- -----------------------------------------------------------------------------
-- 10. validate_credential: solo aprobadas exponen nombre y equipo
-- -----------------------------------------------------------------------------

create or replace function public.validate_credential(p_folio text)
returns table (
  folio text,
  first_names text,
  last_names text,
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
  if p_folio is null or length(trim(p_folio)) not between 6 and 40 then
    return;
  end if;

  return query
  select
    pr.folio,
    case when pr.status = 'aprobado' then p.first_names end,
    case when pr.status = 'aprobado' then p.last_names end,
    case when pr.status = 'aprobado' then t.name end,
    case when pr.status = 'aprobado' then cl.name end,
    s.name,
    d.branch,
    cat.name,
    case when pr.status = 'aprobado' then p.classification end,
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
