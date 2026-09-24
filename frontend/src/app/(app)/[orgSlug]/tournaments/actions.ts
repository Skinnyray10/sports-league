"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";
import type { Branch, TournamentStatus } from "@/types/database";

const FORMATS = new Set(["round_robin", "knockout", "groups"]);
const STATUSES = new Set<TournamentStatus>([
  "registration",
  "active",
  "finished",
]);
const BRANCHES = new Set<Branch>(["varonil", "femenil", "mixto"]);

function parseLegs(raw: FormDataEntryValue | null): number | null {
  const n = Number(raw);
  if (n === 1 || n === 2) return n;
  return null;
}

function revalidateTournament(orgSlug: string, tournamentId?: string) {
  revalidatePath(`/${orgSlug}/tournaments`);
  if (tournamentId) {
    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
  }
  revalidatePath(`/${orgSlug}/teams`);
}

export async function createTournament(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const name = String(formData.get("name") ?? "").trim();
    const season = String(formData.get("season") ?? "").trim();
    const format = String(formData.get("format") ?? "round_robin").trim();
    const legs = parseLegs(formData.get("legs")) ?? 1;
    const statusRaw = String(
      formData.get("status") ?? "registration"
    ).trim() as TournamentStatus;
    const startDateRaw = String(formData.get("start_date") ?? "").trim();

    if (!name || !season) {
      return {
        ok: false,
        error: "Faltan datos: nombre y temporada son obligatorios.",
      };
    }
    if (!FORMATS.has(format)) {
      return { ok: false, error: "Ese formato de torneo no es válido." };
    }
    if (!STATUSES.has(statusRaw)) {
      return { ok: false, error: "Ese estado de torneo no es válido." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("tournaments").insert({
      organization_id: membership.organization_id,
      name,
      season,
      format,
      legs,
      status: statusRaw,
      start_date: startDateRaw ? new Date(startDateRaw).toISOString() : null,
    });

    if (error) {
      return actionError(error, "No pudimos crear el torneo. Inténtalo de nuevo.");
    }

    revalidateTournament(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos crear el torneo. Inténtalo de nuevo.");
  }
}

export async function updateTournament(
  orgSlug: string,
  tournamentId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const name = String(formData.get("name") ?? "").trim();
    const season = String(formData.get("season") ?? "").trim();
    const format = String(formData.get("format") ?? "round_robin").trim();
    const legs = parseLegs(formData.get("legs")) ?? 1;
    const statusRaw = String(
      formData.get("status") ?? "registration"
    ).trim() as TournamentStatus;
    const startDateRaw = String(formData.get("start_date") ?? "").trim();

    if (!name || !season) {
      return {
        ok: false,
        error: "Faltan datos: nombre y temporada son obligatorios.",
      };
    }
    if (!FORMATS.has(format)) {
      return { ok: false, error: "Ese formato de torneo no es válido." };
    }
    if (!STATUSES.has(statusRaw)) {
      return { ok: false, error: "Ese estado de torneo no es válido." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("tournaments")
      .update({
        name,
        season,
        format,
        legs,
        status: statusRaw,
        start_date: startDateRaw ? new Date(startDateRaw).toISOString() : null,
      })
      .eq("id", tournamentId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(
        error,
        "No pudimos guardar los cambios. Inténtalo de nuevo."
      );
    }

    revalidateTournament(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos guardar los cambios. Inténtalo de nuevo."
    );
  }
}

export async function deleteTournament(
  orgSlug: string,
  tournamentId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el torneo.");
    }

    revalidateTournament(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el torneo.");
  }
}

export async function createDivision(
  orgSlug: string,
  tournamentId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const sportId = String(formData.get("sport_id") ?? "").trim();
    const branch = String(formData.get("branch") ?? "").trim() as Branch;
    const categoryId = String(formData.get("category_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!sportId || !branch || !categoryId) {
      return {
        ok: false,
        error: "Deporte, rama y categoría son obligatorios.",
      };
    }
    if (!BRANCHES.has(branch)) {
      return { ok: false, error: "Esa rama no es válida." };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("divisions").insert({
      organization_id: membership.organization_id,
      tournament_id: tournamentId,
      sport_id: sportId,
      branch,
      category_id: categoryId,
      name: name || null,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos crear la división. Inténtalo de nuevo.",
        "Ya existe una división con ese deporte, rama y categoría."
      );
    }

    revalidateTournament(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos crear la división. Inténtalo de nuevo."
    );
  }
}

export async function deleteDivision(
  orgSlug: string,
  tournamentId: string,
  divisionId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("divisions")
      .delete()
      .eq("id", divisionId)
      .eq("tournament_id", tournamentId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar la división.");
    }

    revalidateTournament(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar la división.");
  }
}

export async function createGroup(
  orgSlug: string,
  tournamentId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const divisionId = String(formData.get("division_id") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!divisionId || !name) {
      return {
        ok: false,
        error: "Elige una división y escribe el nombre del grupo.",
      };
    }

    const supabase = await createClient();
    const { error } = await supabase.from("groups").insert({
      organization_id: membership.organization_id,
      division_id: divisionId,
      name,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos crear el grupo. Inténtalo de nuevo.",
        `Ya hay un grupo llamado "${name}" en esa división.`
      );
    }

    revalidateTournament(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos crear el grupo. Inténtalo de nuevo.");
  }
}

export async function deleteGroup(
  orgSlug: string,
  tournamentId: string,
  groupId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el grupo.");
    }

    revalidateTournament(orgSlug, tournamentId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el grupo.");
  }
}
