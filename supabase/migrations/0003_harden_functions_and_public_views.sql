-- =============================================================================
-- SPORTS LEAGUE · 0003_harden_functions_and_public_views.sql
-- =============================================================================
-- Endurece la superficie expuesta por PostgREST y arregla la vista pública:
--   · search_path fijo en las funciones que no lo tenían.
--   · Las funciones de trigger dejan de ser invocables como RPC.
--   · Las vistas public_* pasan a definer: con security_invoker el visitante
--     anónimo no tiene RLS de lectura sobre las tablas base y no veía nada.
-- =============================================================================

alter function public.set_updated_at() set search_path = public;
alter function public.generate_registration_folio() set search_path = public, extensions;
alter function public.force_registration_pending_on_insert() set search_path = public;

-- Las funciones de trigger corren con los permisos de la tabla, no del rol
-- que llama, así que no tienen por qué estar en /rest/v1/rpc.
revoke all on function public.set_updated_at() from anon, authenticated, public;
revoke all on function public.handle_new_user() from anon, authenticated, public;
revoke all on function public.handle_new_organization() from anon, authenticated, public;
revoke all on function public.generate_registration_folio() from anon, authenticated, public;
revoke all on function public.force_registration_pending_on_insert() from anon, authenticated, public;
revoke all on function public.restrict_registration_status_changes() from anon, authenticated, public;
revoke all on function public.sync_division_organization() from anon, authenticated, public;
revoke all on function public.sync_group_organization() from anon, authenticated, public;
revoke all on function public.sync_team_organization() from anon, authenticated, public;
revoke all on function public.sync_matches_organization() from anon, authenticated, public;
revoke all on function public.sync_match_child_organization() from anon, authenticated, public;
revoke all on function public.validate_match_participant() from anon, authenticated, public;
revoke all on function public.ensure_sheet_not_closed() from anon, authenticated, public;
revoke all on function public.close_match_sheet() from anon, authenticated, public;
revoke all on function public.restrict_match_writes_after_final() from anon, authenticated, public;
revoke all on function public.audit_row_change() from anon, authenticated, public;

revoke all on function public.effective_sport_points(uuid, uuid) from anon, authenticated, public;

-- Los helpers de RLS SÍ deben seguir siendo ejecutables: las policies los
-- evalúan con el rol que consulta, y solo exponen la membresía del caller.
grant execute on function public.is_org_member(uuid) to anon, authenticated;
grant execute on function public.has_org_role(uuid, public.membership_role[]) to anon, authenticated;
grant execute on function public.manages_team(uuid) to anon, authenticated;
grant execute on function public.shares_org_with(uuid) to anon, authenticated;
grant execute on function public.is_assigned_referee(uuid) to anon, authenticated;

-- El filtro is_public de cada vista es la frontera de lo que ve el anónimo.
alter view public.public_matches   set (security_invoker = false);
alter view public.public_standings set (security_invoker = false);
alter view public.public_scorers   set (security_invoker = false);
alter view public.public_notices   set (security_invoker = false);

-- Las vistas son de solo lectura. Importante en vistas definer que resulten
-- auto-actualizables: sin esto, un INSERT sobre la vista saltaría el RLS.
revoke all on public.standings, public.scorers, public.cross_results,
  public.public_matches, public.public_standings, public.public_scorers,
  public.public_notices
  from anon, authenticated;

grant select on public.standings, public.scorers, public.cross_results to authenticated;
grant select on public.public_matches, public.public_standings,
  public.public_scorers, public.public_notices to anon, authenticated;
