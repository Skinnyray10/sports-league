-- =============================================================================
-- SPORTS LEAGUE · 0007_demo_seed.sql
-- =============================================================================
-- Datos ficticios para probar la vista pública y el panel admin.
-- Admin demo: admin@demo.liga / DemoAdmin123!
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_admin_id uuid := 'a1111111-1111-4111-8111-111111111111';
  v_org1 uuid := 'b1111111-1111-4111-8111-111111111111';
  v_org2 uuid := 'b2222222-2222-4222-8222-222222222222';
  v_sport_soccer uuid;
  v_cat1 uuid;
  v_cat2 uuid;
  v_club_a uuid;
  v_club_b uuid;
  v_club_c uuid;
  v_club_d uuid;
  v_tour1 uuid;
  v_tour2 uuid;
  v_div1 uuid;
  v_div2 uuid;
  v_g_a uuid;
  v_g_b uuid;
  v_team_fccf uuid;
  v_team_odonto uuid;
  v_team_apaches uuid;
  v_team_castores uuid;
  v_team_norte uuid;
  v_team_sur uuid;
begin
  -- Usuario admin demo (idempotente).
  if not exists (select 1 from auth.users where id = v_admin_id) then
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_admin_id,
      'authenticated',
      'authenticated',
      'admin@demo.liga',
      extensions.crypt('DemoAdmin123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Admin","apellido":"Demo"}'::jsonb,
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
  end if;

  if not exists (
    select 1 from auth.identities
    where user_id = v_admin_id and provider = 'email'
  ) then
    insert into auth.identities (
      id,
      user_id,
      identity_data,
      provider,
      provider_id,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      v_admin_id,
      v_admin_id,
      jsonb_build_object(
        'sub', v_admin_id::text,
        'email', 'admin@demo.liga',
        'email_verified', true
      ),
      'email',
      v_admin_id::text,
      now(),
      now(),
      now()
    );
  end if;

  -- Perfil (por si el trigger no corrió al insertar directo).
  insert into public.profiles (id, nombre, apellido)
  values (v_admin_id, 'Admin', 'Demo')
  on conflict (id) do update
    set nombre = excluded.nombre, apellido = excluded.apellido;

  select id into v_sport_soccer from public.sports where key = 'soccer';

  -- Org 1: Liga Interfacultades Demo (pública)
  if not exists (select 1 from public.organizations where id = v_org1) then
    insert into public.organizations (id, name, slug, is_public, tagline, created_by)
    values (
      v_org1,
      'Liga Interfacultades Demo',
      'interfacultades-demo',
      true,
      'Torneo demo multideporte',
      v_admin_id
    );
  else
    update public.organizations
    set is_public = true, name = 'Liga Interfacultades Demo', tagline = 'Torneo demo multideporte'
    where id = v_org1;
  end if;

  -- Org 2: Liga Norte Demo (pública)
  if not exists (select 1 from public.organizations where id = v_org2) then
    insert into public.organizations (id, name, slug, is_public, tagline, created_by)
    values (
      v_org2,
      'Liga Norte Demo',
      'liga-norte-demo',
      true,
      'Consulta pública de partidos y tablas',
      v_admin_id
    );
  else
    update public.organizations
    set is_public = true, name = 'Liga Norte Demo', tagline = 'Consulta pública de partidos y tablas'
    where id = v_org2;
  end if;

  -- ---- Datos org 1 ----
  select id into v_cat1
  from public.categories
  where organization_id = v_org1 and name = 'Única'
  limit 1;

  insert into public.clubs (organization_id, name)
  values
    (v_org1, 'FCCF'),
    (v_org1, 'Odontología'),
    (v_org1, 'Apaches'),
    (v_org1, 'Castores')
  on conflict (organization_id, name) do nothing;

  select id into v_club_a from public.clubs where organization_id = v_org1 and name = 'FCCF';
  select id into v_club_b from public.clubs where organization_id = v_org1 and name = 'Odontología';
  select id into v_club_c from public.clubs where organization_id = v_org1 and name = 'Apaches';
  select id into v_club_d from public.clubs where organization_id = v_org1 and name = 'Castores';

  if not exists (
    select 1 from public.tournaments
    where organization_id = v_org1 and name = 'Interfacultades 2026'
  ) then
    insert into public.tournaments (
      id, organization_id, name, season, format, status, start_date
    ) values (
      'c1111111-1111-4111-a111-111111111111',
      v_org1,
      'Interfacultades 2026',
      '2026',
      'groups',
      'active',
      '2026-03-01'::timestamptz
    );
  end if;
  v_tour1 := 'c1111111-1111-4111-a111-111111111111';

  if not exists (
    select 1 from public.divisions
    where tournament_id = v_tour1 and sport_id = v_sport_soccer
      and branch = 'varonil' and category_id = v_cat1
  ) then
    insert into public.divisions (
      id, organization_id, tournament_id, sport_id, branch, category_id, name
    ) values (
      'd1111111-1111-4111-a111-111111111111',
      v_org1, v_tour1, v_sport_soccer, 'varonil', v_cat1, 'Soccer varonil'
    );
  end if;
  v_div1 := 'd1111111-1111-4111-a111-111111111111';

  insert into public.groups (id, organization_id, division_id, name)
  values
    ('e1111111-1111-4111-a111-111111111111', v_org1, v_div1, 'Grupo C'),
    ('e2222222-2222-4222-a222-222222222222', v_org1, v_div1, 'Grupo U')
  on conflict (division_id, name) do nothing;

  select id into v_g_a from public.groups where division_id = v_div1 and name = 'Grupo C';
  select id into v_g_b from public.groups where division_id = v_div1 and name = 'Grupo U';

  insert into public.teams (id, organization_id, club_id, division_id, group_id, name)
  values
    ('f1111111-1111-4111-a111-111111111111', v_org1, v_club_a, v_div1, v_g_a, 'FCCF 2'),
    ('f2222222-2222-4222-a222-222222222222', v_org1, v_club_b, v_div1, v_g_a, 'ODONTOLOGIA'),
    ('f3333333-3333-4333-a333-333333333333', v_org1, v_club_c, v_div1, v_g_b, 'APACHES'),
    ('f4444444-4444-4444-a444-444444444444', v_org1, v_club_d, v_div1, v_g_b, 'CASTORES')
  on conflict (division_id, name) do nothing;

  v_team_fccf := 'f1111111-1111-4111-a111-111111111111';
  v_team_odonto := 'f2222222-2222-4222-a222-222222222222';
  v_team_apaches := 'f3333333-3333-4333-a333-333333333333';
  v_team_castores := 'f4444444-4444-4444-a444-444444444444';

  -- Partido próximo
  insert into public.matches (
    id, organization_id, tournament_id, division_id, group_id,
    home_team_id, away_team_id, jornada, stage, scheduled_at, venue, status
  ) values (
    '11111111-1111-4111-a111-111111111101',
    v_org1, v_tour1, v_div1, v_g_a,
    v_team_fccf, v_team_odonto, 3, 'regular',
    '2026-09-15 14:30:00+00', 'CORREDOR UNIVERSITARIO', 'programado'
  ) on conflict (division_id, home_team_id, away_team_id, jornada) do nothing;

  -- Resultado finalizado
  insert into public.matches (
    id, organization_id, tournament_id, division_id, group_id,
    home_team_id, away_team_id, jornada, stage, scheduled_at, venue,
    status, home_score, away_score
  ) values (
    '22222222-2222-4222-a222-222222222202',
    v_org1, v_tour1, v_div1, v_g_b,
    v_team_apaches, v_team_castores, 2, 'regular',
    '2026-04-30 16:00:00+00', 'Campo Norte',
    'finalizado', 7, 33
  ) on conflict (division_id, home_team_id, away_team_id, jornada) do nothing;

  -- Más partidos programados
  insert into public.matches (
    id, organization_id, tournament_id, division_id, group_id,
    home_team_id, away_team_id, jornada, stage, scheduled_at, venue, status
  ) values (
    '33333333-3333-4333-a333-333333333303',
    v_org1, v_tour1, v_div1, v_g_a,
    v_team_odonto, v_team_fccf, 4, 'regular',
    '2026-09-22 15:00:00+00', 'Cancha 2', 'programado'
  ) on conflict (division_id, home_team_id, away_team_id, jornada) do nothing;

  insert into public.notices (
    id, organization_id, title, body, audience, featured, is_public, published_at, created_by
  ) values (
    'a1111111-1111-4111-a111-111111111191',
    v_org1,
    'Inicio de jornada 3',
    'Los partidos de la jornada 3 se juegan en el Corredor Universitario. Llega 30 minutos antes.',
    'general',
    true,
    true,
    now(),
    v_admin_id
  ) on conflict (id) do nothing;

  -- ---- Datos org 2 ----
  select id into v_cat2
  from public.categories
  where organization_id = v_org2 and name = '1RA'
  limit 1;

  insert into public.clubs (organization_id, name)
  values
    (v_org2, 'Club Norte'),
    (v_org2, 'Club Sur')
  on conflict (organization_id, name) do nothing;

  select id into v_club_a from public.clubs where organization_id = v_org2 and name = 'Club Norte';
  select id into v_club_b from public.clubs where organization_id = v_org2 and name = 'Club Sur';

  if not exists (
    select 1 from public.tournaments
    where organization_id = v_org2 and name = 'Apertura Norte 2026'
  ) then
    insert into public.tournaments (
      id, organization_id, name, season, format, status, start_date
    ) values (
      'c2222222-2222-4222-a222-222222222222',
      v_org2,
      'Apertura Norte 2026',
      '2026',
      'round_robin',
      'active',
      '2026-02-01'::timestamptz
    );
  end if;
  v_tour2 := 'c2222222-2222-4222-a222-222222222222';

  if not exists (
    select 1 from public.divisions
    where tournament_id = v_tour2 and sport_id = v_sport_soccer
      and branch = 'varonil' and category_id = v_cat2
  ) then
    insert into public.divisions (
      id, organization_id, tournament_id, sport_id, branch, category_id, name
    ) values (
      'd2222222-2222-4222-a222-222222222222',
      v_org2, v_tour2, v_sport_soccer, 'varonil', v_cat2, 'Soccer 1RA'
    );
  end if;
  v_div2 := 'd2222222-2222-4222-a222-222222222222';

  insert into public.teams (id, organization_id, club_id, division_id, name)
  values
    ('f5555555-5555-4555-a555-555555555555', v_org2, v_club_a, v_div2, 'Norte FC'),
    ('f6666666-6666-4666-a666-666666666666', v_org2, v_club_b, v_div2, 'Sur United')
  on conflict (division_id, name) do nothing;

  v_team_norte := 'f5555555-5555-4555-a555-555555555555';
  v_team_sur := 'f6666666-6666-4666-a666-666666666666';

  insert into public.matches (
    id, organization_id, tournament_id, division_id,
    home_team_id, away_team_id, jornada, stage, scheduled_at, venue,
    status, home_score, away_score
  ) values (
    '44444444-4444-4444-a444-444444444404',
    v_org2, v_tour2, v_div2,
    v_team_norte, v_team_sur, 1, 'regular',
    '2026-08-10 18:00:00+00', 'Estadio Norte',
    'finalizado', 2, 1
  ) on conflict (division_id, home_team_id, away_team_id, jornada) do nothing;

  insert into public.matches (
    id, organization_id, tournament_id, division_id,
    home_team_id, away_team_id, jornada, stage, scheduled_at, venue, status
  ) values (
    '55555555-5555-4555-a555-555555555505',
    v_org2, v_tour2, v_div2,
    v_team_sur, v_team_norte, 2, 'regular',
    '2026-09-28 17:00:00+00', 'Campo Sur', 'programado'
  ) on conflict (division_id, home_team_id, away_team_id, jornada) do nothing;

  insert into public.notices (
    id, organization_id, title, body, audience, featured, is_public, published_at, created_by
  ) values (
    'a2222222-2222-4222-a222-222222222292',
    v_org2,
    'Bienvenida a la vista pública',
    'Consulta el rol, resultados y tabla. El alta de equipos y jugadores es solo para personal autorizado.',
    'general',
    true,
    true,
    now(),
    v_admin_id
  ) on conflict (id) do nothing;
end $$;
