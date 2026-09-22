"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/components/ops/access";
import type { TournamentStatus } from "@/types/database";

const FORMATS = new Set(["round_robin", "knockout", "groups"]);
const STATUSES = new Set<TournamentStatus>([
  "registration",
  "active",
  "finished",
]);

function parseLegs(raw: FormDataEntryValue | null): number | null {
  const n = Number(raw);
  if (n === 1 || n === 2) return n;
  return null;
}

export async function createTournament(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const name = String(formData.get("name") ?? "").trim();
    const season = String(formData.get("season") ?? "").trim();
    const sportId = String(formData.get("sport_id") ?? "").trim();
    const format = String(formData.get("format") ?? "round_robin").trim();
    const legs = parseLegs(formData.get("legs")) ?? 1;
    const statusRaw = String(
      formData.get("status") ?? "registration"
    ).trim() as TournamentStatus;
    const startDateRaw = String(formData.get("start_date") ?? "").trim();

    if (!name || !season || !sportId) {
      return {
        ok: false,
        error: "Faltan datos: nombre, temporada y deporte son obligatorios.",
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
      sport_id: sportId,
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

    revalidatePath(`/${orgSlug}/tournaments`);
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
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const name = String(formData.get("name") ?? "").trim();
    const season = String(formData.get("season") ?? "").trim();
    const sportId = String(formData.get("sport_id") ?? "").trim();
    const format = String(formData.get("format") ?? "round_robin").trim();
    const legs = parseLegs(formData.get("legs")) ?? 1;
    const statusRaw = String(
      formData.get("status") ?? "registration"
    ).trim() as TournamentStatus;
    const startDateRaw = String(formData.get("start_date") ?? "").trim();

    if (!name || !season || !sportId) {
      return {
        ok: false,
        error: "Faltan datos: nombre, temporada y deporte son obligatorios.",
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
        sport_id: sportId,
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
      return actionError(error, "No pudimos guardar los cambios. Inténtalo de nuevo.");
    }

    revalidatePath(`/${orgSlug}/tournaments`);
    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar los cambios. Inténtalo de nuevo.");
  }
}

export async function deleteTournament(
  orgSlug: string,
  tournamentId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("tournaments")
      .delete()
      .eq("id", tournamentId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el torneo.");
    }

    revalidatePath(`/${orgSlug}/tournaments`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el torneo.");
  }
}

export async function enrollTeam(
  orgSlug: string,
  tournamentId: string,
  teamId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const supabase = await createClient();
    const { error } = await supabase.from("tournament_teams").insert({
      organization_id: membership.organization_id,
      tournament_id: tournamentId,
      team_id: teamId,
    });

    if (error) {
      return actionError(
        error,
        "No pudimos inscribir al equipo. Inténtalo de nuevo.",
        "Ese equipo ya está inscrito en este torneo."
      );
    }

    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos inscribir al equipo. Inténtalo de nuevo."
    );
  }
}

export async function unenrollTeam(
  orgSlug: string,
  tournamentId: string,
  teamId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("tournament_teams")
      .delete()
      .eq("tournament_id", tournamentId)
      .eq("team_id", teamId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos quitar al equipo del torneo.");
    }

    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos quitar al equipo del torneo.");
  }
}
