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
        error: "Name, season, and sport are required.",
      };
    }
    if (!FORMATS.has(format)) {
      return { ok: false, error: "Invalid tournament format." };
    }
    if (!STATUSES.has(statusRaw)) {
      return { ok: false, error: "Invalid tournament status." };
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
      return actionError(error, "Could not create tournament.");
    }

    revalidatePath(`/${orgSlug}/tournaments`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not create tournament.");
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
        error: "Name, season, and sport are required.",
      };
    }
    if (!FORMATS.has(format)) {
      return { ok: false, error: "Invalid tournament format." };
    }
    if (!STATUSES.has(statusRaw)) {
      return { ok: false, error: "Invalid tournament status." };
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
      return actionError(error, "Could not update tournament.");
    }

    revalidatePath(`/${orgSlug}/tournaments`);
    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not update tournament.");
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
      return actionError(error, "Could not delete tournament.");
    }

    revalidatePath(`/${orgSlug}/tournaments`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not delete tournament.");
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
      return actionError(error, "Could not enroll team.");
    }

    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not enroll team.");
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
      return actionError(error, "Could not remove team.");
    }

    revalidatePath(`/${orgSlug}/tournaments/${tournamentId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "Could not remove team.");
  }
}
