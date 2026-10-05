"use server";

import {
  imageUrl,
  optionalUuid,
  parseForm,
  requiredText,
  uuidField,
} from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  getOrgAccess,
  type ActionResult,
} from "@/components/ops/access";

export async function createTeam(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const parsed = parseForm(
      {
        name: requiredText("Escribe el nombre del equipo."),
        logo_url: imageUrl,
        club_id: uuidField("Elige un club y una división."),
        division_id: uuidField("Elige un club y una división."),
        group_id: optionalUuid,
      },
      formData
    );
    if (!parsed.ok) return parsed;
    const {
      name,
      logo_url: logoUrlRaw,
      club_id: clubId,
      division_id: divisionId,
      group_id: groupIdRaw,
    } = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase.from("teams").insert({
      organization_id: membership.organization_id,
      club_id: clubId,
      division_id: divisionId,
      group_id: groupIdRaw || null,
      name,
      logo_url: logoUrlRaw,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos crear el equipo. Inténtalo de nuevo.",
        `Ya hay un equipo llamado "${name}" en esa división.`
      );
    }

    revalidatePath(`/${orgSlug}/teams`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos crear el equipo. Inténtalo de nuevo.");
  }
}

export async function updateTeam(
  orgSlug: string,
  teamId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await getOrgAccess(orgSlug);
    if (!access.canUpdateTeam(teamId)) {
      return {
        ok: false,
        error: "Solo puedes editar el equipo que tienes a tu cargo.",
      };
    }

    const parsed = parseForm(
      { name: requiredText("Escribe el nombre del equipo."), logo_url: imageUrl },
      formData
    );
    if (!parsed.ok) return parsed;
    const { name, logo_url: logoUrlRaw } = parsed.data;

    const supabase = await createClient();
    const { error } = await supabase
      .from("teams")
      .update({
        name,
        logo_url: logoUrlRaw,
      })
      .eq("id", teamId)
      .eq("organization_id", access.membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar los cambios. Inténtalo de nuevo.",
        `Ya hay un equipo llamado "${name}" en esa división.`
      );
    }

    revalidatePath(`/${orgSlug}/teams`);
    revalidatePath(`/${orgSlug}/teams/${teamId}`);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar los cambios. Inténtalo de nuevo."
    );
  }
}

export async function deleteTeam(
  orgSlug: string,
  teamId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el equipo.");
    }

    revalidatePath(`/${orgSlug}/teams`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el equipo.");
  }
}
