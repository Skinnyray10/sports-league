import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  MembershipRole,
  Tables,
  TablesInsert,
} from "@/types/database";

export type Organization = Tables<"organizations">;
export type Membership = Tables<"memberships">;
export type OrganizationInvite = Tables<"organization_invites">;

export type MembershipWithOrg = Membership & {
  organization: Organization;
};

/**
 * Membresía(s) del usuario actual en la org identificada por `orgSlug`.
 * Devuelve `null` si el slug no existe o el usuario no es miembro.
 */
export async function getMembership(
  orgSlug: string
): Promise<MembershipWithOrg | null> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("slug", orgSlug)
    .maybeSingle();

  if (orgError) {
    throw orgError;
  }
  if (!organization) {
    return null;
  }

  // Un usuario puede tener varios roles; tomamos el primero por prioridad
  // de privilegio para el contexto de página.
  const { data: memberships, error: memError } = await supabase
    .from("memberships")
    .select("*")
    .eq("organization_id", organization.id)
    .eq("user_id", user.id);

  if (memError) {
    throw memError;
  }
  if (!memberships || memberships.length === 0) {
    return null;
  }

  const ordered = [...memberships].sort(
    (a, b) => roleRank(a.role) - roleRank(b.role)
  );
  const primary = ordered[0]!;

  return {
    ...primary,
    organization,
  };
}

/**
 * Exige que el usuario tenga alguno de `roles` en la org del slug.
 * - Org inexistente / sin membresía → `notFound()`
 * - Membresía sin rol suficiente → redirect al dashboard de la org
 */
export async function requireOrgRole(
  slug: string,
  roles: MembershipRole[]
): Promise<MembershipWithOrg> {
  const membership = await getMembership(slug);

  if (!membership) {
    notFound();
  }

  const userRoles = await listMembershipRoles(
    membership.organization_id,
    membership.user_id
  );
  const allowed = roles.some((r) => userRoles.includes(r));

  if (!allowed) {
    redirect(`/${slug}`);
  }

  return membership;
}

/**
 * Crea una organización. El trigger `handle_new_organization` asigna
 * membership `admin` al creador.
 */
export async function createOrganization(input: {
  name: string;
  slug: string;
  settings?: TablesInsert<"organizations">["settings"];
}): Promise<Organization> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug,
      settings: input.settings ?? {},
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Crea un invite (solo admin vía RLS). Devuelve la fila con `token`.
 */
export async function createInvite(input: {
  organizationId: string;
  role: Extract<MembershipRole, "team_manager" | "referee">;
  /** Obligatorio si role = team_manager. */
  teamId?: string | null;
  /** ISO timestamp o Date. Default: 7 días. */
  expiresAt?: string | Date;
}): Promise<OrganizationInvite> {
  await requireUser();
  const supabase = await createClient();

  const expiresAt =
    input.expiresAt === undefined
      ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      : typeof input.expiresAt === "string"
        ? input.expiresAt
        : input.expiresAt.toISOString();

  const { data, error } = await supabase
    .from("organization_invites")
    .insert({
      organization_id: input.organizationId,
      role: input.role,
      team_id: input.role === "team_manager" ? input.teamId ?? null : null,
      expires_at: expiresAt,
    })
    .select("*")
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Acepta un invite vía RPC `accept_org_invite`.
 */
export async function acceptInvite(token: string): Promise<{
  organizationId: string;
  organizationSlug: string;
  role: MembershipRole;
}> {
  await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("accept_org_invite", {
    p_token: token,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    throw new Error("accept_org_invite returned no rows");
  }

  return {
    organizationId: row.organization_id,
    organizationSlug: row.organization_slug,
    role: row.role,
  };
}

/**
 * Organizaciones del usuario actual (vía memberships).
 */
export async function listUserOrganizations(): Promise<Organization[]> {
  const user = await requireUser();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("memberships")
    .select("organization:organizations(*)")
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  const orgs: Organization[] = [];
  const seen = new Set<string>();

  for (const row of data ?? []) {
    const org = row.organization as Organization | Organization[] | null;
    const resolved = Array.isArray(org) ? org[0] : org;
    if (resolved && !seen.has(resolved.id)) {
      seen.add(resolved.id);
      orgs.push(resolved);
    }
  }

  return orgs;
}

/**
 * Destino post-login según rol en la org:
 * admin → panel; delegado → jugadores; árbitro → mis partidos.
 */
export async function roleHomePath(orgSlug: string): Promise<string> {
  const membership = await getMembership(orgSlug);
  if (!membership) {
    return "/onboarding";
  }

  const roles = await listMembershipRoles(
    membership.organization_id,
    membership.user_id
  );

  if (roles.includes("admin")) {
    return `/${orgSlug}`;
  }
  if (roles.includes("team_manager")) {
    return `/${orgSlug}/players`;
  }
  if (roles.includes("referee")) {
    return `/${orgSlug}/referee`;
  }

  return `/${orgSlug}`;
}

/**
 * Elige org (preferida si el usuario es miembro) y resuelve el home por rol.
 * Sin membresías: si hay solicitud pendiente → /pending; si no → onboarding.
 */
export async function homePathAfterAuth(
  preferredSlug?: string | null
): Promise<string> {
  const orgs = await listUserOrganizations();
  if (orgs.length === 0) {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: pending } = await supabase
      .from("membership_requests")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pendiente")
      .limit(1)
      .maybeSingle();

    if (pending) {
      return "/pending";
    }
    return "/onboarding";
  }

  const org =
    (preferredSlug
      ? orgs.find((o) => o.slug === preferredSlug)
      : undefined) ?? orgs[0]!;

  return roleHomePath(org.slug);
}

async function listMembershipRoles(
  organizationId: string,
  userId: string
): Promise<MembershipRole[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", organizationId)
    .eq("user_id", userId);

  if (error) {
    throw error;
  }

  return (data ?? []).map((r) => r.role);
}

function roleRank(role: MembershipRole): number {
  switch (role) {
    case "admin":
      return 0;
    case "team_manager":
      return 1;
    case "referee":
      return 2;
    default:
      return 99;
  }
}
