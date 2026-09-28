-- =============================================================================
-- SPORTS LEAGUE · remove-demo-admin.sql (manual)
-- =============================================================================
-- Obligatorio el día del corte a producción si el proyecto Supabase tuvo el
-- seed demo (0007). NO es una migración: no corre en db reset.
--
-- Borra:
--   - organizaciones interfacultades-demo y liga-norte-demo (cascade)
--   - usuario auth admin@demo.liga (a1111111-1111-4111-8111-111111111111)
--   - usuario auth delegado@demo.liga (a2222222-2222-4222-8222-222222222222)
--   - usuario auth arbitro@demo.liga (a3333333-3333-4333-8333-333333333333)
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
where user_id in (
  'a1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'a3333333-3333-4333-8333-333333333333'
);

delete from public.profiles
where id in (
  'a1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'a3333333-3333-4333-8333-333333333333'
);

delete from auth.users
where id in (
  'a1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'a3333333-3333-4333-8333-333333333333'
)
   or email in ('admin@demo.liga', 'delegado@demo.liga', 'arbitro@demo.liga');

commit;
