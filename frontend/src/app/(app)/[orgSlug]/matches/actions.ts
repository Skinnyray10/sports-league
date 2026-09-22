"use server";

import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  type ActionResult,
} from "@/components/matches/access";
import type { MatchStatus } from "@/types/database";

const MATCH_STATUSES: MatchStatus[] = [
  "programado",
  "en_vivo",
  "finalizado",
  "suspendido",
];

function parseOptionalInt(value: FormDataEntryValue | null): number | null {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) ? n : null;
}

function parseRequiredNonNegInt(
  value: FormDataEntryValue | null,
  field: string
): { ok: true; value: number } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (raw === "") {
    return { ok: false, error: `Captura ${field}.` };
  }
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 0) {
    return {
      ok: false,
      error: `${field} debe ser un número entero de 0 o más.`,
    };
  }
  return { ok: true, value: n };
}

export async function createMatch(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const tournamentId = String(formData.get("tournament_id") ?? "").trim();
    const homeTeamId = String(formData.get("home_team_id") ?? "").trim();
    const awayTeamId = String(formData.get("away_team_id") ?? "").trim();
    const stage = String(formData.get("stage") ?? "").trim() || null;
    const courtInfo = String(formData.get("court_info") ?? "").trim() || null;
    const scheduledRaw = String(formData.get("scheduled_at") ?? "").trim();
    const round = parseOptionalInt(formData.get("round"));

    if (!tournamentId || !homeTeamId || !awayTeamId) {
      return {
        ok: false,
        error: "Elige el torneo y los dos equipos que van a jugar.",
      };
    }
    if (homeTeamId === awayTeamId) {
      return {
        ok: false,
        error: "Un equipo no puede jugar contra sí mismo. Elige dos distintos.",
      };
    }

    const supabase = await createClient();
    const orgId = membership.organization_id;

    const { data: tournament, error: tournamentError } = await supabase
      .from("tournaments")
      .select("id")
      .eq("id", tournamentId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (tournamentError) {
      return actionError(tournamentError, "No pudimos leer el torneo.");
    }
    if (!tournament) {
      return {
        ok: false,
        error: "Ese torneo no existe en tu organización.",
      };
    }

    const { data: enrolled, error: enrolledError } = await supabase
      .from("tournament_teams")
      .select("team_id")
      .eq("tournament_id", tournamentId)
      .eq("organization_id", orgId)
      .in("team_id", [homeTeamId, awayTeamId]);

    if (enrolledError) {
      return actionError(
        enrolledError,
        "No pudimos leer los equipos inscritos."
      );
    }
    const enrolledIds = new Set((enrolled ?? []).map((r) => r.team_id));
    if (!enrolledIds.has(homeTeamId) || !enrolledIds.has(awayTeamId)) {
      return {
        ok: false,
        error: "Los dos equipos tienen que estar inscritos en el torneo.",
      };
    }

    const scheduledAt = scheduledRaw
      ? new Date(scheduledRaw).toISOString()
      : null;
    if (scheduledRaw && Number.isNaN(Date.parse(scheduledRaw))) {
      return { ok: false, error: "Esa fecha y hora no son válidas." };
    }

    const { error } = await supabase.from("matches").insert({
      organization_id: orgId,
      tournament_id: tournamentId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      round,
      stage,
      court_info: courtInfo,
      scheduled_at: scheduledAt,
      status: "programado",
    });

    if (error) {
      return actionError(error, "No pudimos programar el partido. Inténtalo de nuevo.");
    }

    revalidatePath(`/${orgSlug}/matches`);
    revalidatePath(`/${orgSlug}/standings`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos programar el partido. Inténtalo de nuevo.");
  }
}

export async function updateMatchResult(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
      "referee",
    ]);

    const homeScore = parseRequiredNonNegInt(
      formData.get("home_score"),
      "los puntos del local"
    );
    if (!homeScore.ok) return homeScore;
    const awayScore = parseRequiredNonNegInt(
      formData.get("away_score"),
      "los puntos del visitante"
    );
    if (!awayScore.ok) return awayScore;

    const statusRaw = String(formData.get("status") ?? "").trim();
    if (!MATCH_STATUSES.includes(statusRaw as MatchStatus)) {
      return { ok: false, error: "Ese estado de partido no es válido." };
    }
    const status = statusRaw as MatchStatus;

    const supabase = await createClient();

    const { error } = await supabase
      .from("matches")
      .update({
        home_score: homeScore.value,
        away_score: awayScore.value,
        status,
      })
      .eq("id", matchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos guardar el marcador. Inténtalo de nuevo.");
    }

    revalidatePath(`/${orgSlug}/matches`);
    revalidatePath(`/${orgSlug}/matches/${matchId}`);
    revalidatePath(`/${orgSlug}/standings`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar el marcador. Inténtalo de nuevo.");
  }
}

export async function updateMatchSchedule(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const stage = String(formData.get("stage") ?? "").trim() || null;
    const courtInfo = String(formData.get("court_info") ?? "").trim() || null;
    const scheduledRaw = String(formData.get("scheduled_at") ?? "").trim();
    const round = parseOptionalInt(formData.get("round"));

    const scheduledAt = scheduledRaw
      ? new Date(scheduledRaw).toISOString()
      : null;
    if (scheduledRaw && Number.isNaN(Date.parse(scheduledRaw))) {
      return { ok: false, error: "Esa fecha y hora no son válidas." };
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("matches")
      .update({
        round,
        stage,
        court_info: courtInfo,
        scheduled_at: scheduledAt,
      })
      .eq("id", matchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos guardar la programación. Inténtalo de nuevo.");
    }

    revalidatePath(`/${orgSlug}/matches`);
    revalidatePath(`/${orgSlug}/matches/${matchId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar la programación. Inténtalo de nuevo.");
  }
}

export async function deleteMatch(
  orgSlug: string,
  matchId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
    ]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el partido.");
    }

    revalidatePath(`/${orgSlug}/matches`);
    revalidatePath(`/${orgSlug}/standings`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el partido.");
  }
}

export async function upsertMatchSet(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
      "referee",
    ]);

    const setNumber = parseRequiredNonNegInt(
      formData.get("set_number"),
      "el número de set"
    );
    if (!setNumber.ok) return setNumber;
    if (setNumber.value < 1) {
      return { ok: false, error: "El número de set empieza en 1." };
    }

    const homeSetScore = parseRequiredNonNegInt(
      formData.get("home_set_score"),
      "los puntos del local en el set"
    );
    if (!homeSetScore.ok) return homeSetScore;
    const awaySetScore = parseRequiredNonNegInt(
      formData.get("away_set_score"),
      "los puntos del visitante en el set"
    );
    if (!awaySetScore.ok) return awaySetScore;

    const setId = String(formData.get("set_id") ?? "").trim();
    const supabase = await createClient();
    const orgId = membership.organization_id;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id")
      .eq("id", matchId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (matchError) {
      return actionError(matchError, "No pudimos leer el partido.");
    }
    if (!match) {
      return { ok: false, error: "Ese partido ya no existe." };
    }

    if (setId) {
      const { error } = await supabase
        .from("match_sets")
        .update({
          set_number: setNumber.value,
          home_set_score: homeSetScore.value,
          away_set_score: awaySetScore.value,
        })
        .eq("id", setId)
        .eq("match_id", matchId)
        .eq("organization_id", orgId);

      if (error) {
        return actionError(error, "No pudimos guardar el set.");
      }
    } else {
      const { error } = await supabase.from("match_sets").insert({
        organization_id: orgId,
        match_id: matchId,
        set_number: setNumber.value,
        home_set_score: homeSetScore.value,
        away_set_score: awaySetScore.value,
      });

      if (error) {
        return actionError(error, "No pudimos agregar el set.");
      }
    }

    revalidatePath(`/${orgSlug}/matches/${matchId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar el set.");
  }
}

export async function deleteMatchSet(
  orgSlug: string,
  matchId: string,
  setId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, [
      "admin",
      "league_manager",
      "referee",
    ]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("match_sets")
      .delete()
      .eq("id", setId)
      .eq("match_id", matchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el set.");
    }

    revalidatePath(`/${orgSlug}/matches/${matchId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el set.");
  }
}
