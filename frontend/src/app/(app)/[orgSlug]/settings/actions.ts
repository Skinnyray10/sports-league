"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";

function revalidateSettings(orgSlug: string) {
  revalidatePath(`/${orgSlug}/settings`);
}

function parseOptionalInt(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

export async function updateOrganization(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const name = String(formData.get("name") ?? "").trim();
    const tagline = String(formData.get("tagline") ?? "").trim();
    const logoUrl = String(formData.get("logo_url") ?? "").trim();
    const isPublic = formData.get("is_public") === "on";

    if (!name) {
      return { ok: false, error: "Escribe el nombre de la organización." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("organizations")
      .update({
        name,
        tagline: tagline || null,
        logo_url: logoUrl || null,
        is_public: isPublic,
      })
      .eq("id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar la organización. Inténtalo de nuevo."
      );
    }

    revalidateSettings(orgSlug);
    revalidatePath(`/${orgSlug}`);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar la organización. Inténtalo de nuevo."
    );
  }
}

export async function updateOrgSport(
  orgSlug: string,
  orgSportId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const active = formData.get("active") === "on";
    const drawRequiresShootout = formData.get("draw_requires_shootout") === "on";

    const pointsWin = parseOptionalInt(formData.get("points_win"));
    const pointsDraw = parseOptionalInt(formData.get("points_draw"));
    const pointsLoss = parseOptionalInt(formData.get("points_loss"));
    const pointsShootoutWin = parseOptionalInt(
      formData.get("points_shootout_win")
    );
    const pointsShootoutLoss = parseOptionalInt(
      formData.get("points_shootout_loss")
    );

    const supabase = await createClient();
    const { error } = await supabase
      .from("org_sports")
      .update({
        active,
        points_win: pointsWin,
        points_draw: pointsDraw,
        points_loss: pointsLoss,
        points_shootout_win: pointsShootoutWin,
        points_shootout_loss: pointsShootoutLoss,
        draw_requires_shootout: drawRequiresShootout,
      })
      .eq("id", orgSportId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar el deporte. Inténtalo de nuevo."
      );
    }

    revalidateSettings(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar el deporte. Inténtalo de nuevo."
    );
  }
}

export async function updateOrgSportBranch(
  orgSlug: string,
  branchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const active = formData.get("active") === "on";

    const supabase = await createClient();
    const { error } = await supabase
      .from("org_sport_branches")
      .update({ active })
      .eq("id", branchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar la rama. Inténtalo de nuevo."
      );
    }

    revalidateSettings(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar la rama. Inténtalo de nuevo."
    );
  }
}

export async function createCategory(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder =
      parseOptionalInt(formData.get("sort_order")) ?? 0;

    if (!name) {
      return { ok: false, error: "Escribe el nombre de la categoría." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("categories").insert({
      organization_id: membership.organization_id,
      name,
      sort_order: sortOrder,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos crear la categoría. Inténtalo de nuevo.",
        `Ya hay una categoría llamada "${name}".`
      );
    }

    revalidateSettings(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos crear la categoría. Inténtalo de nuevo."
    );
  }
}

export async function updateCategory(
  orgSlug: string,
  categoryId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const name = String(formData.get("name") ?? "").trim();
    const sortOrder =
      parseOptionalInt(formData.get("sort_order")) ?? 0;

    if (!name) {
      return { ok: false, error: "Escribe el nombre de la categoría." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .update({ name, sort_order: sortOrder })
      .eq("id", categoryId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar la categoría. Inténtalo de nuevo.",
        `Ya hay una categoría llamada "${name}".`
      );
    }

    revalidateSettings(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar la categoría. Inténtalo de nuevo."
    );
  }
}

export async function deleteCategory(
  orgSlug: string,
  categoryId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", categoryId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar la categoría.");
    }

    revalidateSettings(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar la categoría.");
  }
}
