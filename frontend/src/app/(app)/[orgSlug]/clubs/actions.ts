"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";

function revalidateClubs(orgSlug: string) {
  revalidatePath(`/${orgSlug}/clubs`);
  revalidatePath(`/${orgSlug}/teams`);
}

export async function createClub(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const name = String(formData.get("name") ?? "").trim();
    const logoUrl = String(formData.get("logo_url") ?? "").trim();

    if (!name) {
      return { ok: false, error: "Escribe el nombre del club." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("clubs").insert({
      organization_id: membership.organization_id,
      name,
      logo_url: logoUrl || null,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos crear el club. Inténtalo de nuevo.",
        `Ya hay un club llamado "${name}" en tu organización.`
      );
    }

    revalidateClubs(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos crear el club. Inténtalo de nuevo.");
  }
}

export async function updateClub(
  orgSlug: string,
  clubId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const name = String(formData.get("name") ?? "").trim();
    const logoUrl = String(formData.get("logo_url") ?? "").trim();

    if (!name) {
      return { ok: false, error: "Escribe el nombre del club." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("clubs")
      .update({
        name,
        logo_url: logoUrl || null,
      })
      .eq("id", clubId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar el club. Inténtalo de nuevo.",
        `Ya hay un club llamado "${name}" en tu organización.`
      );
    }

    revalidateClubs(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar el club. Inténtalo de nuevo.");
  }
}

export async function deleteClub(
  orgSlug: string,
  clubId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("clubs")
      .delete()
      .eq("id", clubId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el club.");
    }

    revalidateClubs(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el club.");
  }
}
