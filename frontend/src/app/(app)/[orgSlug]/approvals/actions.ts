"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  getOrgAccess,
  type ActionResult,
} from "@/components/ops/access";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";

const APPROVAL_STATUSES: ApprovalStatus[] = [
  "pendiente",
  "aprobado",
  "rechazado",
];
const ELIGIBILITY_STATUSES: EligibilityStatus[] = [
  "pendiente",
  "elegible",
  "no_elegible",
];

export async function updateRegistrationReview(
  orgSlug: string,
  registrationId: string,
  patch: {
    status?: ApprovalStatus;
    eligibility?: EligibilityStatus;
  }
): Promise<ActionResult> {
  try {
    const access = await getOrgAccess(orgSlug);
    if (!access.isAdmin) {
      return { ok: false, error: "Solo el administrador puede revisar credenciales." };
    }

    if (patch.status && !APPROVAL_STATUSES.includes(patch.status)) {
      return { ok: false, error: "Estado de aprobación no válido." };
    }
    if (patch.eligibility && !ELIGIBILITY_STATUSES.includes(patch.eligibility)) {
      return { ok: false, error: "Estado de elegibilidad no válido." };
    }
    if (!patch.status && !patch.eligibility) {
      return { ok: false, error: "Indica qué quieres cambiar." };
    }

    const supabase = await createClient();
    const orgId = access.membership.organization_id;
    const userId = access.membership.user_id;

    const update: {
      status?: ApprovalStatus;
      eligibility?: EligibilityStatus;
      reviewed_by?: string;
      reviewed_at?: string;
    } = { ...patch };

    if (patch.status) {
      update.reviewed_by = userId;
      update.reviewed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("player_registrations")
      .update(update)
      .eq("id", registrationId)
      .eq("organization_id", orgId);

    if (error) {
      return actionError(error, "No pudimos actualizar la credencial.");
    }

    revalidatePath(`/${orgSlug}/approvals`);
    revalidatePath(`/${orgSlug}/players`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos actualizar la credencial.");
  }
}

export async function bulkApproveRegistrations(
  orgSlug: string,
  registrationIds: string[]
): Promise<ActionResult> {
  try {
    const access = await getOrgAccess(orgSlug);
    if (!access.isAdmin) {
      return { ok: false, error: "Solo el administrador puede aprobar en lote." };
    }

    const ids = registrationIds.filter(Boolean);
    if (ids.length === 0) {
      return { ok: false, error: "Selecciona al menos una credencial." };
    }

    const supabase = await createClient();
    const orgId = access.membership.organization_id;

    const { error } = await supabase
      .from("player_registrations")
      .update({
        status: "aprobado",
        reviewed_by: access.membership.user_id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .in("id", ids);

    if (error) {
      return actionError(error, "No pudimos aprobar las credenciales.");
    }

    revalidatePath(`/${orgSlug}/approvals`);
    revalidatePath(`/${orgSlug}/players`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos aprobar las credenciales.");
  }
}
