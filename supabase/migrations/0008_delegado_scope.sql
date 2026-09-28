-- =============================================================================
-- SPORTS LEAGUE · 0008_delegado_scope.sql
-- =============================================================================
-- Delegado solo lee/escribe su plantilla; update de equipos solo admin;
-- player-photos privado; validate_credential sin photo_url.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. players.created_by
-- -----------------------------------------------------------------------------

alter table public.players
  add column if not exists created_by uuid
    references auth.users (id) on delete set null
    default auth.uid();

create index if not exists idx_players_created_by
  on public.players (created_by);

-- -----------------------------------------------------------------------------
-- 2. teams: update solo admin
-- -----------------------------------------------------------------------------

drop policy if exists "teams_update_admin_or_delegado" on public.teams;

create policy "teams_update_admin"
  on public.teams for update
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- -----------------------------------------------------------------------------
-- 3. players: scope por admin / creador / plantilla del delegado
-- -----------------------------------------------------------------------------

drop policy if exists "players_select_members" on public.players;
drop policy if exists "players_insert_admin_or_delegado" on public.players;
drop policy if exists "players_update_admin_or_delegado" on public.players;

create policy "players_select_admin_creator_or_delegado"
  on public.players for select
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or created_by = (select auth.uid())
    or exists (
      select 1
      from public.player_registrations pr
      where pr.player_id = players.id
        and public.manages_team(pr.team_id)
    )
    -- Árbitro asignado: lee jugadores de los equipos de su partido (cédula).
    or exists (
      select 1
      from public.player_registrations pr
      join public.matches m
        on m.home_team_id = pr.team_id
        or m.away_team_id = pr.team_id
      where pr.player_id = players.id
        and m.referee_id = (select auth.uid())
    )
  );

create policy "players_insert_admin_or_delegado"
  on public.players for insert
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1
      from public.memberships m
      join public.teams t on t.id = m.team_id
      where m.user_id = (select auth.uid())
        and m.role = 'team_manager'
        and t.club_id = players.club_id
        and t.organization_id = players.organization_id
    )
  );

create policy "players_update_admin_or_delegado_pending"
  on public.players for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1
      from public.player_registrations pr
      where pr.player_id = players.id
        and public.manages_team(pr.team_id)
        and pr.status = 'pendiente'
    )
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or exists (
      select 1
      from public.player_registrations pr
      where pr.player_id = players.id
        and public.manages_team(pr.team_id)
        and pr.status = 'pendiente'
    )
  );

-- -----------------------------------------------------------------------------
-- 4. player_registrations: select/update acotados + trigger de campos sensibles
-- -----------------------------------------------------------------------------

drop policy if exists "player_registrations_select_members" on public.player_registrations;
drop policy if exists "player_registrations_update_admin_or_delegado_pending"
  on public.player_registrations;

create policy "player_registrations_select_admin_or_delegado"
  on public.player_registrations for select
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
    or public.manages_team(team_id)
    -- Árbitro asignado: plantilla de local/visitante de su partido.
    or exists (
      select 1
      from public.matches m
      where m.referee_id = (select auth.uid())
        and (
          m.home_team_id = player_registrations.team_id
          or m.away_team_id = player_registrations.team_id
        )
    )
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
    or (
      public.manages_team(team_id)
      and status = 'pendiente'
    )
  );

create or replace function public.restrict_registration_status_changes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_org_role(old.organization_id, array['admin']::public.membership_role[]) then
    if new.status is distinct from old.status
       or new.eligibility is distinct from old.eligibility
       or new.folio is distinct from old.folio
       or new.reviewed_by is distinct from old.reviewed_by
       or new.reviewed_at is distinct from old.reviewed_at
    then
      raise exception
        'Solo el administrador puede cambiar status, elegibilidad, folio o revisión de la credencial';
    end if;
    return new;
  end if;

  if new.status is distinct from old.status
     or new.eligibility is distinct from old.eligibility
  then
    new.reviewed_by := auth.uid();
    new.reviewed_at := now();
  end if;

  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 5. Storage player-photos: privado; lectura/escritura admin o delegado del path
-- -----------------------------------------------------------------------------

update storage.buckets
set public = false
where id = 'player-photos';

drop policy if exists "player_photos_read_public" on storage.objects;
drop policy if exists "player_photos_insert_org_member" on storage.objects;
drop policy if exists "player_photos_update_org_member" on storage.objects;

create policy "player_photos_select_admin_or_delegado"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team(((storage.foldername(name))[2])::uuid)
    )
  );

create policy "player_photos_insert_admin_or_delegado"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team(((storage.foldername(name))[2])::uuid)
    )
  );

create policy "player_photos_update_admin_or_delegado"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team(((storage.foldername(name))[2])::uuid)
    )
  )
  with check (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team(((storage.foldername(name))[2])::uuid)
    )
  );

-- -----------------------------------------------------------------------------
-- 6. validate_credential sin photo_url
-- -----------------------------------------------------------------------------

drop function if exists public.validate_credential(text);

create function public.validate_credential(p_folio text)
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
  return query
  select
    pr.folio,
    p.first_names,
    p.last_names,
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
