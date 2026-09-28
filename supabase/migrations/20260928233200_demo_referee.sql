-- =============================================================================
-- SPORTS LEAGUE · demo árbitro
-- =============================================================================
-- Árbitro de Liga Interfacultades Demo, asignado al partido programado
-- FCCF 2 vs ODONTOLOGIA. Idempotente. Contraseña: ArbitroDemo123!
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_user_id uuid := 'a3333333-3333-4333-8333-333333333333';
  v_org_id uuid := 'b1111111-1111-4111-8111-111111111111';
  v_match_id uuid := '11111111-1111-4111-a111-111111111101';
begin
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
      'arbitro@demo.liga',
      extensions.crypt('ArbitroDemo123!', extensions.gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"nombre":"Luis","apellido":"Árbitro"}'::jsonb,
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
        'email', 'arbitro@demo.liga',
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
  values (v_user_id, 'Luis', 'Árbitro')
  on conflict (id) do update
    set nombre = excluded.nombre, apellido = excluded.apellido;

  insert into public.memberships (user_id, organization_id, role, team_id)
  values (v_user_id, v_org_id, 'referee', null)
  on conflict (user_id, organization_id, role) do nothing;

  update public.matches
  set referee_id = v_user_id
  where id = v_match_id
    and referee_id is null;
end $$;
