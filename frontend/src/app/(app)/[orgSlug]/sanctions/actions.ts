"use server";

import { lengthError } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";

export async function createSanction(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;

    const registrationId = String(formData.get("registration_id") ?? "").trim();
    const reason = String(formData.get("reason") ?? "").trim();
    const sanction = String(formData.get("sanction") ?? "").trim();
    const jornadaRaw = String(formData.get("jornada") ?? "").trim();
    const jornada = jornadaRaw ? Number.parseInt(jornadaRaw, 10) : null;

    if (!registrationId || !reason || !sanction) {
      return {
        ok: false,
        error: "Elige al jugador y escribe la falta y el castigo.",
      };
    }
    if (jornada != null && (!Number.isFinite(jornada) || jornada < 1)) {
      return { ok: false, error: "La jornada debe ser un número de 1 o más." };
    }
    const tooLong = lengthError([
      [reason, 300],
      [sanction, 120],
    ]);
    if (tooLong) return tooLong;

    const supabase = await createClient();
    const { data: registration, error: regError } = await supabase
      .from("player_registrations")
      .select("id, team_id")
      .eq("id", registrationId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (regError) {
      return actionError(regError, "No pudimos leer al jugador.");
    }
    if (!registration) {
      return { ok: false, error: "Ese jugador no está inscrito en tu liga." };
    }

    const { error } = await supabase.from("sanctions").insert({
      organization_id: orgId,
      player_registration_id: registration.id,
      team_id: registration.team_id,
      reason,
      jornada,
      sanction,
    });
    if (error) {
      return actionError(error, "No pudimos guardar el castigo.");
    }

    revalidatePath(`/${orgSlug}/sanctions`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar el castigo.");
  }
}

export async function deleteSanction(
  orgSlug: string,
  sanctionId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const supabase = await createClient();
    const { error } = await supabase
      .from("sanctions")
      .delete()
      .eq("id", sanctionId)
      .eq("organization_id", membership.organization_id);
    if (error) {
      return actionError(error, "No pudimos quitar el castigo.");
    }

    revalidatePath(`/${orgSlug}/sanctions`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos quitar el castigo.");
  }
}
