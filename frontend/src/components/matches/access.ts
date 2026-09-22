import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership, type MembershipWithOrg } from "@/lib/org";
import type { MembershipRole } from "@/types/database";

export type MatchAccess = {
  membership: MembershipWithOrg;
  roles: MembershipRole[];
  canCreateMatch: boolean;
  canDeleteMatch: boolean;
  canUpdateResult: boolean;
  canEditSchedule: boolean;
};

/**
 * Role capabilities for match CTAs. Server Actions + RLS remain authoritative.
 */
export async function getMatchAccess(orgSlug: string): Promise<MatchAccess> {
  const membership = await getMembership(orgSlug);
  if (!membership) {
    notFound();
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", membership.user_id);

  if (error) {
    throw error;
  }

  const roles = (data ?? []).map((r) => r.role);
  const canManageStaff =
    roles.includes("admin") || roles.includes("league_manager");
  const canUpdateResult =
    canManageStaff || roles.includes("referee");

  return {
    membership,
    roles,
    canCreateMatch: canManageStaff,
    canDeleteMatch: canManageStaff,
    canUpdateResult,
    canEditSchedule: canManageStaff,
  };
}

export { actionError, type ActionResult } from "@/lib/action-result";
