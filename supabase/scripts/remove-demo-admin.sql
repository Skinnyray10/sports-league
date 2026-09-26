-- =============================================================================
-- SPORTS LEAGUE · remove-demo-admin.sql (manual)
-- =============================================================================
-- Obligatorio el día del corte a producción si el proyecto Supabase tuvo el
-- seed demo (0007). NO es una migración: no corre en db reset.
--
-- Borra:
--   - organizaciones interfacultades-demo y liga-norte-demo (cascade)
--   - usuario auth admin@demo.liga (a1111111-1111-4111-8111-111111111111)
--
-- Ejecutar en el SQL Editor del proyecto de producción (o psql linkeado).
-- =============================================================================

begin;

-- Orgs primero: created_by referencia auth.users sin ON DELETE CASCADE.
delete from public.organizations
where slug in ('interfacultades-demo', 'liga-norte-demo')
   or id in (
     'b1111111-1111-4111-8111-111111111111',
     'b2222222-2222-4222-8222-222222222222'
   );

delete from auth.identities
where user_id = 'a1111111-1111-4111-8111-111111111111';

delete from public.profiles
where id = 'a1111111-1111-4111-8111-111111111111';

delete from auth.users
where id = 'a1111111-1111-4111-8111-111111111111'
   or email = 'admin@demo.liga';

commit;
