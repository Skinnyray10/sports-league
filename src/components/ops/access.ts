import { notFound, unstable_rethrow } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership, type MembershipWithOrg } from "@/lib/org";
import type { MembershipRole } from "@/types/database";

export type OrgAccess = {
  membership: MembershipWithOrg;
  roles: MembershipRole[];
  managedTeamId: string | null;
  canManageStaff: boolean;
  canUpdateTeam: (teamId: string) => boolean;
};

/**
 * Membership + role capabilities for Operate CTAs.
 * Server + RLS remain authoritative; this only drives UI.
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
  const canManageStaff =
    roles.includes("admin") || roles.includes("league_manager");
  const managedTeamId =
    rows.find((r) => r.role === "team_manager" && r.team_id)?.team_id ?? null;

  return {
    membership,
    roles,
    managedTeamId,
    canManageStaff,
    canUpdateTeam: (teamId: string) =>
      canManageStaff || managedTeamId === teamId,
  };
}

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export function actionError(error: unknown, fallback: string): ActionResult {
  unstable_rethrow(error);
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message) {
      return { ok: false, error: message };
    }
  }
  return { ok: false, error: fallback };
}
