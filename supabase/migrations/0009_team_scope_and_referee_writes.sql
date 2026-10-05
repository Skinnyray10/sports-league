-- =============================================================================
-- SPORTS LEAGUE · 0009_team_scope_and_referee_writes.sql
-- =============================================================================
-- 1. manages_team exige que el equipo pertenezca a la org de la membership.
-- 2. memberships / organization_invites: team_id debe ser de la misma org.
-- 3. players_insert: el delegado solo crea jugadores en su propia org.
-- 4. player-photos: el team_id del path debe pertenecer al org_id del path.
-- 5. matches: un árbitro no-admin solo puede cambiar shootout_winner_team_id.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. manages_team
-- -----------------------------------------------------------------------------

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
    join public.teams t
      on t.id = m.team_id
     and t.organization_id = m.organization_id
    where m.team_id = p_team_id
      and m.role = 'team_manager'
      and m.user_id = (select auth.uid())
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. team_id de memberships / invites dentro de la misma org
-- -----------------------------------------------------------------------------

-- Limpia filas inconsistentes previas antes de imponer la regla.
update public.memberships m
set team_id = null
where m.team_id is not null
  and not exists (
    select 1 from public.teams t
    where t.id = m.team_id and t.organization_id = m.organization_id
  );

delete from public.organization_invites oi
where oi.team_id is not null
  and oi.accepted_at is null
  and not exists (
    select 1 from public.teams t
    where t.id = oi.team_id and t.organization_id = oi.organization_id
  );

create or replace function public.validate_team_in_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.team_id is not null and not exists (
    select 1 from public.teams t
    where t.id = new.team_id and t.organization_id = new.organization_id
  ) then
    raise exception 'El equipo no pertenece a esta organización';
  end if;
  return new;
end;
$$;

revoke all on function public.validate_team_in_organization() from public, anon, authenticated;

drop trigger if exists trg_memberships_validate_team on public.memberships;
create trigger trg_memberships_validate_team
  before insert or update of team_id, organization_id on public.memberships
  for each row execute function public.validate_team_in_organization();

drop trigger if exists trg_organization_invites_validate_team on public.organization_invites;
create trigger trg_organization_invites_validate_team
  before insert or update of team_id, organization_id on public.organization_invites
  for each row execute function public.validate_team_in_organization();

-- -----------------------------------------------------------------------------
-- 3. players_insert: membership y equipo en la misma org
-- -----------------------------------------------------------------------------

drop policy if exists "players_insert_admin_or_delegado" on public.players;

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
        and m.organization_id = t.organization_id
        and t.club_id = players.club_id
        and t.organization_id = players.organization_id
    )
  );

-- -----------------------------------------------------------------------------
-- 4. player-photos: path {org_id}/{team_id}/... coherente
-- -----------------------------------------------------------------------------

create or replace function public.manages_team_in_org(p_org_id uuid, p_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.teams t
    where t.id = p_team_id and t.organization_id = p_org_id
  ) and public.manages_team(p_team_id);
$$;

revoke all on function public.manages_team_in_org(uuid, uuid) from public;
grant execute on function public.manages_team_in_org(uuid, uuid) to authenticated;

drop policy if exists "player_photos_select_admin_or_delegado" on storage.objects;
drop policy if exists "player_photos_insert_admin_or_delegado" on storage.objects;
drop policy if exists "player_photos_update_admin_or_delegado" on storage.objects;

create policy "player_photos_select_admin_or_delegado"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team_in_org(
        ((storage.foldername(name))[1])::uuid,
        ((storage.foldername(name))[2])::uuid
      )
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
      or public.manages_team_in_org(
        ((storage.foldername(name))[1])::uuid,
        ((storage.foldername(name))[2])::uuid
      )
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
      or public.manages_team_in_org(
        ((storage.foldername(name))[1])::uuid,
        ((storage.foldername(name))[2])::uuid
      )
    )
  )
  with check (
    bucket_id = 'player-photos'
    and (
      public.has_org_role(
        ((storage.foldername(name))[1])::uuid,
        array['admin']::public.membership_role[]
      )
      or public.manages_team_in_org(
        ((storage.foldername(name))[1])::uuid,
        ((storage.foldername(name))[2])::uuid
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 5. matches: el árbitro asignado solo fija el ganador de penales
-- -----------------------------------------------------------------------------

create or replace function public.restrict_referee_match_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- close_match_sheet (trigger de match_sheets) actualiza el marcador: se permite.
  if pg_trigger_depth() > 1 then
    return new;
  end if;

  -- Sin JWT (service role / SQL editor / seed): RLS ya no aplica aquí.
  if auth.uid() is null then
    return new;
  end if;

  if public.has_org_role(old.organization_id, array['admin']::public.membership_role[]) then
    return new;
  end if;

  if (to_jsonb(new) - array['shootout_winner_team_id', 'updated_at'])
     is distinct from (to_jsonb(old) - array['shootout_winner_team_id', 'updated_at'])
  then
    raise exception 'El árbitro solo puede registrar el ganador por penales';
  end if;

  if new.shootout_winner_team_id is distinct from old.shootout_winner_team_id
     and exists (
       select 1 from public.match_sheets ms
       where ms.match_id = old.id and ms.closed_at is not null
     )
  then
    raise exception 'La cédula está cerrada; el ganador por penales ya no puede cambiar';
  end if;

  return new;
end;
$$;

revoke all on function public.restrict_referee_match_columns() from public, anon, authenticated;

drop trigger if exists trg_matches_restrict_referee on public.matches;
create trigger trg_matches_restrict_referee
  before update on public.matches
  for each row execute function public.restrict_referee_match_columns();
