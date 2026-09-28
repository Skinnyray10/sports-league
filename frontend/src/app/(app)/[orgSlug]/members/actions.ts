"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/lib/action-result";

export async function approveMembershipRequest(
  orgSlug: string,
  requestId: string
): Promise<ActionResult> {
  try {
    await requireOrgRole(orgSlug, ["admin"]);
    const supabase = await createClient();
    const { error } = await supabase.rpc("approve_membership_request", {
      p_request_id: requestId,
    });
    if (error) {
      return actionError(error, "No se pudo aprobar la solicitud.");
    }
    revalidatePath(`/${orgSlug}/members`);
    return { ok: true };
  } catch (e) {
    return actionError(e, "No se pudo aprobar la solicitud.");
  }
}

export async function rejectMembershipRequest(
  orgSlug: string,
  requestId: string
): Promise<ActionResult> {
  try {
    await requireOrgRole(orgSlug, ["admin"]);
    const supabase = await createClient();
    const { error } = await supabase.rpc("reject_membership_request", {
      p_request_id: requestId,
    });
    if (error) {
      return actionError(error, "No se pudo rechazar la solicitud.");
    }
    revalidatePath(`/${orgSlug}/members`);
    return { ok: true };
  } catch (e) {
    return actionError(e, "No se pudo rechazar la solicitud.");
  }
}
