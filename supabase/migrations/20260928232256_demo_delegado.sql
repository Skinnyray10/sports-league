-- =============================================================================
-- SPORTS LEAGUE · demo delegado
-- =============================================================================
-- Delegado de FCCF 2 en Liga Interfacultades Demo, para probar el alta de
-- jugadores. Idempotente. Contraseña: DelegadoDemo123!
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_user_id uuid := 'a2222222-2222-4222-8222-222222222222';
  v_org_id uuid := 'b1111111-1111-4111-8111-111111111111';
  v_team_id uuid := 'f1111111-1111-4111-a111-111111111111';
begin
  if not exists (select 1 from public.teams where id = v_team_id) then
    raise exception 'demo team FCCF 2 is missing; run 0007_demo_seed first';
  end if;

  if not exists (select 1 from auth.users where id = v_user_id) then
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
      v_user_id,
      'authenticated',
      'authenticated',
      'delegado@demo.liga',
      extensions.crypt('DelegadoDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Carmen","apellido":"Delegado"}'::jsonb,
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
    where user_id = v_user_id and provider = 'email'
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
      v_user_id,
      v_user_id,
      jsonb_build_object(
        'sub', v_user_id::text,
        'email', 'delegado@demo.liga',
        'email_verified', true
      ),
      'email',
      v_user_id::text,
      now(),
      now(),
      now()
    );
  end if;

  insert into public.profiles (id, nombre, apellido)
  values (v_user_id, 'Carmen', 'Delegado')
  on conflict (id) do update
    set nombre = excluded.nombre, apellido = excluded.apellido;

  insert into public.memberships (user_id, organization_id, role, team_id)
  values (v_user_id, v_org_id, 'team_manager', v_team_id)
  on conflict (user_id, organization_id, role) do update
    set team_id = excluded.team_id;
end $$;
