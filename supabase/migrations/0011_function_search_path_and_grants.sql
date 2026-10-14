-- =============================================================================
-- SPORTS LEAGUE · 0011_function_search_path_and_grants.sql
-- =============================================================================
-- 1. search_path fijo en funciones de trigger creadas en 0010.
-- 2. anon no ejecuta helpers usados solo por policies de usuarios autenticados.
-- =============================================================================

-- gen_random_bytes vive en el schema extensions (pgcrypto).
alter function public.generate_registration_folio() set search_path = public, extensions;
alter function public.lock_players_created_by() set search_path = public;

revoke execute on function public.can_access_protest(uuid, uuid) from anon;
revoke execute on function public.manages_team_in_org(uuid, uuid) from anon;
