-- =============================================================================
-- SPORTS LEAGUE · 0002_org_invites.sql
-- =============================================================================
-- Invites para unirse a una organización sin descubrir orgs vía RLS.
-- Admin crea/revoca filas; la aceptación ocurre solo vía RPC SECURITY DEFINER.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. TABLA
-- -----------------------------------------------------------------------------

create table public.organization_invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  -- Token opaco; gen_random_bytes requiere pgcrypto (ya en 0001).
  token            text not null unique default encode(gen_random_bytes(32), 'hex'),
  role             public.membership_role not null,
  expires_at       timestamptz not null,
  created_by       uuid not null default auth.uid() references auth.users (id),
  created_at       timestamptz not null default now(),
  accepted_at      timestamptz,
  accepted_by      uuid references auth.users (id),
  constraint chk_organization_invites_expires_after_created check (expires_at > created_at)
);

comment on table public.organization_invites is
  'Invites por token para unirse a una org. Lectura/escritura admin; accept vía accept_org_invite().';

create index idx_organization_invites_organization_id
  on public.organization_invites (organization_id);

create index idx_organization_invites_pending_token
  on public.organization_invites (token)
  where accepted_at is null;

-- -----------------------------------------------------------------------------
-- 2. RPC: accept_org_invite
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: el invitee no es miembro aún, así que no puede INSERT
-- en memberships ni SELECT en organization_invites bajo RLS org-only.

create or replace function public.accept_org_invite(p_token text)
returns table (
  organization_id uuid,
  organization_slug text,
  role public.membership_role
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.organization_invites%rowtype;
  v_uid uuid := auth.uid();
  v_slug text;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  if p_token is null or length(trim(p_token)) = 0 then
    raise exception 'invalid invite token';
  end if;

  select *
  into v_invite
  from public.organization_invites oi
  where oi.token = p_token
  for update;

  if not found then
    raise exception 'invite not found';
  end if;

  if v_invite.accepted_at is not null then
    raise exception 'invite already accepted';
  end if;

  if v_invite.expires_at <= now() then
    raise exception 'invite expired';
  end if;

  insert into public.memberships (user_id, organization_id, role)
  values (v_uid, v_invite.organization_id, v_invite.role)
  on conflict (user_id, organization_id, role) do nothing;

  update public.organization_invites
  set
    accepted_at = now(),
    accepted_by = v_uid
  where id = v_invite.id;

  select o.slug into v_slug
  from public.organizations o
  where o.id = v_invite.organization_id;

  organization_id := v_invite.organization_id;
  organization_slug := v_slug;
  role := v_invite.role;
  return next;
end;
$$;

comment on function public.accept_org_invite(text) is
  'Acepta un invite por token: crea membership y marca el invite como usado. Requiere auth.uid().';

revoke all on function public.accept_org_invite(text) from public;
grant execute on function public.accept_org_invite(text) to authenticated;

-- -----------------------------------------------------------------------------
-- 3. RLS
-- -----------------------------------------------------------------------------

alter table public.organization_invites enable row level security;

-- Solo admins de la org ven invites (incluye usados/expirados para auditoría).
create policy "organization_invites_select_admin"
  on public.organization_invites for select
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
  );

-- Solo admin puede crear; created_by debe ser el usuario actual.
create policy "organization_invites_insert_admin"
  on public.organization_invites for insert
  with check (
    created_by = (select auth.uid())
    and public.has_org_role(organization_id, array['admin']::public.membership_role[])
  );

-- Admin puede actualizar (p. ej. extender expires_at) mientras no esté aceptado.
create policy "organization_invites_update_admin"
  on public.organization_invites for update
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
  )
  with check (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
  );

-- Revocar = DELETE.
create policy "organization_invites_delete_admin"
  on public.organization_invites for delete
  using (
    public.has_org_role(organization_id, array['admin']::public.membership_role[])
  );
