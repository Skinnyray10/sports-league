"use server";

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
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);
    const name = String(formData.get("name") ?? "").trim();
    const logoUrlRaw = String(formData.get("logo_url") ?? "").trim();

    if (!name) {
      return { ok: false, error: "Team name is required." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("teams").insert({
      organization_id: membership.organization_id,
      name,
      logo_url: logoUrlRaw || null,
    });

    if (error) {
      return actionError(error, "Could not create team.");
    }

    revalidatePath(`/${orgSlug}/teams`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not create team.");
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
        error: "You can only update teams you manage.",
      };
    }

    const name = String(formData.get("name") ?? "").trim();
    const logoUrlRaw = String(formData.get("logo_url") ?? "").trim();

    if (!name) {
      return { ok: false, error: "Team name is required." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("teams")
      .update({
        name,
        logo_url: logoUrlRaw || null,
      })
      .eq("id", teamId)
      .eq("organization_id", access.membership.organization_id);

    if (error) {
      return actionError(error, "Could not update team.");
    }

    revalidatePath(`/${orgSlug}/teams`);
    revalidatePath(`/${orgSlug}/teams/${teamId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not update team.");
  }
}

export async function deleteTeam(
  orgSlug: string,
  teamId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("teams")
      .delete()
      .eq("id", teamId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "Could not delete team.");
    }

    revalidatePath(`/${orgSlug}/teams`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not delete team.");
  }
}
