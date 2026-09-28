-- =============================================================================
-- SPORTS LEAGUE · 0006_membership_requests.sql
-- =============================================================================
-- Solicitudes de acceso: solo team_manager (Delegado) y referee.
-- El visitante se registra; el admin aprueba y crea la membership.
-- =============================================================================

create table public.membership_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations (id) on delete cascade,
  club_id          uuid references public.clubs (id) on delete set null,
  user_id          uuid not null references auth.users (id) on delete cascade,
  email            text not null,
  full_name        text not null,
  username         text,
  phone            text,
  requested_role   public.membership_role not null,
  status           public.approval_status not null default 'pendiente',
  reviewed_by      uuid references auth.users (id) on delete set null,
  reviewed_at      timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint chk_membership_requests_role check (
    requested_role in (
      'team_manager'::public.membership_role,
      'referee'::public.membership_role
    )
  ),
  constraint chk_membership_requests_full_name check (length(trim(full_name)) > 0)
);

comment on table public.membership_requests is
  'Solicitudes de Delegado o Árbitro. Pendientes hasta que un admin apruebe.';

create unique index idx_membership_requests_one_pending_per_user_org
  on public.membership_requests (user_id, organization_id)
  where status = 'pendiente';

create index idx_membership_requests_org_status
  on public.membership_requests (organization_id, status, created_at desc);

create trigger trg_membership_requests_updated_at
  before update on public.membership_requests
  for each row execute function public.set_updated_at();

alter table public.membership_requests enable row level security;

create policy "membership_requests_select_own_or_admin"
  on public.membership_requests for select
  using (
    user_id = (select auth.uid())
    or public.has_org_role(organization_id, array['admin']::public.membership_role[])
  );

create policy "membership_requests_insert_own"
  on public.membership_requests for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and requested_role in (
      'team_manager'::public.membership_role,
      'referee'::public.membership_role
    )
  );

create policy "membership_requests_update_admin"
  on public.membership_requests for update
  using (public.has_org_role(organization_id, array['admin']::public.membership_role[]))
  with check (public.has_org_role(organization_id, array['admin']::public.membership_role[]));

-- Clubes de orgs públicas (para el formulario de registro sin sesión).
create or replace view public.public_clubs
with (security_invoker = false) as
select
  o.slug as org_slug,
  o.id as organization_id,
  o.name as organization_name,
  c.id as club_id,
  c.name as club_name
from public.clubs c
join public.organizations o on o.id = c.organization_id and o.is_public = true;

revoke all on public.public_clubs from anon, authenticated;
grant select on public.public_clubs to anon, authenticated;

-- Orgs públicas resumidas para el registro.
create or replace view public.public_organizations
with (security_invoker = false) as
select
  id,
  name,
  slug,
  tagline,
  logo_url
from public.organizations
where is_public = true;

revoke all on public.public_organizations from anon, authenticated;
grant select on public.public_organizations to anon, authenticated;

-- Aprueba una solicitud: crea membership y marca aprobado.
create or replace function public.approve_membership_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.membership_requests%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_req
  from public.membership_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request not found';
  end if;

  if not public.has_org_role(v_req.organization_id, array['admin']::public.membership_role[]) then
    raise exception 'not authorized';
  end if;

  if v_req.status <> 'pendiente' then
    raise exception 'request is not pending';
  end if;

  insert into public.memberships (user_id, organization_id, role, team_id)
  values (v_req.user_id, v_req.organization_id, v_req.requested_role, null)
  on conflict (user_id, organization_id, role) do nothing;

  update public.membership_requests
  set
    status = 'aprobado',
    reviewed_by = v_uid,
    reviewed_at = now()
  where id = v_req.id;
end;
$$;

create or replace function public.reject_membership_request(p_request_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_req public.membership_requests%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select * into v_req
  from public.membership_requests
  where id = p_request_id
  for update;

  if not found then
    raise exception 'request not found';
  end if;

  if not public.has_org_role(v_req.organization_id, array['admin']::public.membership_role[]) then
    raise exception 'not authorized';
  end if;

  if v_req.status <> 'pendiente' then
    raise exception 'request is not pending';
  end if;

  update public.membership_requests
  set
    status = 'rechazado',
    reviewed_by = v_uid,
    reviewed_at = now()
  where id = v_req.id;
end;
$$;

revoke all on function public.approve_membership_request(uuid) from public;
revoke all on function public.reject_membership_request(uuid) from public;
grant execute on function public.approve_membership_request(uuid) to authenticated;
grant execute on function public.reject_membership_request(uuid) to authenticated;
