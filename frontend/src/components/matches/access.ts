import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMembership, type MembershipWithOrg } from "@/lib/org";
import type { MembershipRole, Tables } from "@/types/database";

export type MatchAccess = {
  membership: MembershipWithOrg;
  roles: MembershipRole[];
  canCreateMatch: boolean;
  canDeleteMatch: boolean;
  canEditSchedule: boolean;
  canAssignReferee: boolean;
};

/**
 * Capacidades de UI para partidos. Solo admin calendariza y asigna árbitro;
 * la captura de marcador va en cédula (paso 5). RLS es la autoridad.
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
  const isAdmin = roles.includes("admin");

  return {
    membership,
    roles,
    canCreateMatch: isAdmin,
    canDeleteMatch: isAdmin,
    canEditSchedule: isAdmin,
    canAssignReferee: isAdmin,
  };
}

export function isAssignedReferee(
  match: Pick<Tables<"matches">, "referee_id">,
  userId: string
): boolean {
  return match.referee_id === userId;
}

export { actionError, type ActionResult } from "@/lib/action-result";
