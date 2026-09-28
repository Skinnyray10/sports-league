import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership, type MembershipWithOrg } from "@/lib/org";
import type { MembershipRole } from "@/types/database";

export type OrgAccess = {
  membership: MembershipWithOrg;
  roles: MembershipRole[];
  managedTeamId: string | null;
  isAdmin: boolean;
  isDelegado: boolean;
  isReferee: boolean;
  canManageStaff: boolean;
  canUpdateTeam: (teamId: string) => boolean;
  isDelegadoOf: (teamId: string) => boolean;
};

/**
 * Membresía + capacidades de Operate. RLS sigue siendo la autoridad.
 */
export async function getOrgAccess(orgSlug: string): Promise<OrgAccess> {
  const membership = await getMembership(orgSlug);
  if (!membership) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("role, team_id")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", membership.user_id);

  if (error) {
    throw error;
  }

  const rows = data ?? [];
  const roles = rows.map((r) => r.role);
  const isAdmin = roles.includes("admin");
  const isDelegado = roles.includes("team_manager");
  const isReferee = roles.includes("referee");
  const managedTeamId =
    rows.find((r) => r.role === "team_manager" && r.team_id)?.team_id ?? null;

  const isDelegadoOf = (teamId: string) => managedTeamId === teamId;

  return {
    membership,
    roles,
    managedTeamId,
    isAdmin,
    isDelegado,
    isReferee,
    canManageStaff: isAdmin,
    canUpdateTeam: (_teamId: string) => isAdmin,
    isDelegadoOf,
  };
}

export { actionError, type ActionResult } from "@/lib/action-result";
