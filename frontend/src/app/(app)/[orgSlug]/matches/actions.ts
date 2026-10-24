"use server";

import { lengthError } from "@/lib/validation";
import { revalidatePath } from "next/cache";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import {
  actionError,
  type ActionResult,
} from "@/components/matches/access";
import { fromMxParts } from "@/lib/mx-time";
import type { MatchStatus, ScheduleChangeType } from "@/types/database";

const MATCH_STAGES = [
  "regular",
  "cuartos",
  "semifinal",
  "tercer_lugar",
  "final",
] as const;

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

function parseScheduledAt(
  raw: string
): { ok: true; value: string | null } | { ok: false; error: string } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: true, value: null };
  const ms = Date.parse(trimmed);
  if (Number.isNaN(ms)) {
    return { ok: false, error: "Esa fecha y hora no son válidas." };
  }
  return { ok: true, value: new Date(ms).toISOString() };
}

function revalidateMatchPaths(orgSlug: string, matchId?: string) {
  revalidatePath(`/${orgSlug}/matches`);
  revalidatePath(`/${orgSlug}/standings`);
  if (matchId) {
    revalidatePath(`/${orgSlug}/matches/${matchId}`);
  }
}

export async function createMatch(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const divisionId = String(formData.get("division_id") ?? "").trim();
    const homeTeamId = String(formData.get("home_team_id") ?? "").trim();
    const awayTeamId = String(formData.get("away_team_id") ?? "").trim();
    const groupIdRaw = String(formData.get("group_id") ?? "").trim();
    const groupId = groupIdRaw || null;
    const stageRaw = String(formData.get("stage") ?? "").trim() || "regular";
    const venue = String(formData.get("venue") ?? "").trim() || null;
    const venueTooLong = lengthError([[venue, 160]]);
    if (venueTooLong) return venueTooLong;
    const jornada = parseOptionalInt(formData.get("jornada"));
    const scheduled = parseScheduledAt(
      String(formData.get("scheduled_at") ?? "")
    );

    if (!divisionId || !homeTeamId || !awayTeamId) {
      return {
        ok: false,
        error: "Elige la división y los dos equipos que van a jugar.",
      };
    }
    if (homeTeamId === awayTeamId) {
      return {
        ok: false,
        error: "Un equipo no puede jugar contra sí mismo. Elige dos distintos.",
      };
    }
    if (!MATCH_STAGES.includes(stageRaw as (typeof MATCH_STAGES)[number])) {
      return { ok: false, error: "Esa fase no es válida." };
    }
    if (!scheduled.ok) return scheduled;

    const supabase = await createClient();
    const orgId = membership.organization_id;

    const { data: division, error: divisionError } = await supabase
      .from("divisions")
      .select("id, tournament_id")
      .eq("id", divisionId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (divisionError) {
      return actionError(divisionError, "No pudimos leer la división.");
    }
    if (!division) {
      return { ok: false, error: "Esa división no existe en tu organización." };
    }

    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, division_id")
      .eq("organization_id", orgId)
      .in("id", [homeTeamId, awayTeamId]);

    if (teamsError) {
      return actionError(teamsError, "No pudimos leer los equipos.");
    }
    if ((teams ?? []).length !== 2) {
      return { ok: false, error: "Uno de los equipos no existe." };
    }
    const bothInDivision = (teams ?? []).every(
      (t) => t.division_id === divisionId
    );
    if (!bothInDivision) {
      return {
        ok: false,
        error: "Los dos equipos deben pertenecer a la misma división.",
      };
    }

    if (groupId) {
      const { data: group, error: groupError } = await supabase
        .from("groups")
        .select("id, division_id")
        .eq("id", groupId)
        .eq("organization_id", orgId)
        .maybeSingle();
      if (groupError) {
        return actionError(groupError, "No pudimos leer el grupo.");
      }
      if (!group || group.division_id !== divisionId) {
        return {
          ok: false,
          error: "Ese grupo no pertenece a la división elegida.",
        };
      }
    }

    const { error } = await supabase.from("matches").insert({
      organization_id: orgId,
      tournament_id: division.tournament_id,
      division_id: divisionId,
      group_id: groupId,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      jornada,
      stage: stageRaw,
      venue,
      scheduled_at: scheduled.value,
      status: "programado",
    });

    if (error) {
      return actionError(
        error,
        "No pudimos programar el partido. Inténtalo de nuevo."
      );
    }

    revalidateMatchPaths(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos programar el partido. Inténtalo de nuevo."
    );
  }
}

export async function assignReferee(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const refereeRaw = String(formData.get("referee_id") ?? "").trim();
    const refereeId = refereeRaw || null;

    const supabase = await createClient();
    const orgId = membership.organization_id;

    if (refereeId) {
      const { data: refMembership, error: refError } = await supabase
        .from("memberships")
        .select("id")
        .eq("organization_id", orgId)
        .eq("user_id", refereeId)
        .eq("role", "referee")
        .maybeSingle();

      if (refError) {
        return actionError(refError, "No pudimos validar al árbitro.");
      }
      if (!refMembership) {
        return {
          ok: false,
          error: "Esa persona no tiene rol de árbitro en tu organización.",
        };
      }
    }

    const { error } = await supabase
      .from("matches")
      .update({ referee_id: refereeId })
      .eq("id", matchId)
      .eq("organization_id", orgId);

    if (error) {
      return actionError(error, "No pudimos asignar al árbitro.");
    }

    revalidateMatchPaths(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos asignar al árbitro.");
  }
}

async function loadMatchForAdmin(orgSlug: string, matchId: string) {
  const membership = await requireOrgRole(orgSlug, ["admin"]);
  const supabase = await createClient();
  const { data: match, error } = await supabase
    .from("matches")
    .select(
      "id, organization_id, status, scheduled_at, venue, status_reason"
    )
    .eq("id", matchId)
    .eq("organization_id", membership.organization_id)
    .maybeSingle();

  if (error) {
    return { ok: false as const, error: actionError(error, "No pudimos leer el partido.") };
  }
  if (!match) {
    return { ok: false as const, error: { ok: false as const, error: "Ese partido ya no existe." } };
  }
  return { ok: true as const, membership, supabase, match };
}

async function insertScheduleChange(params: {
  supabase: Awaited<ReturnType<typeof createClient>>;
  organizationId: string;
  matchId: string;
  changeType: ScheduleChangeType;
  reason: string | null;
  previousScheduledAt: string | null;
  newScheduledAt: string | null;
  previousVenue: string | null;
  newVenue: string | null;
  previousStatus: MatchStatus;
  newStatus: MatchStatus;
  changedBy: string;
}): Promise<ActionResult | null> {
  const { error } = await params.supabase.from("match_schedule_changes").insert({
    organization_id: params.organizationId,
    match_id: params.matchId,
    change_type: params.changeType,
    reason: params.reason,
    previous_scheduled_at: params.previousScheduledAt,
    new_scheduled_at: params.newScheduledAt,
    previous_venue: params.previousVenue,
    new_venue: params.newVenue,
    previous_status: params.previousStatus,
    new_status: params.newStatus,
    changed_by: params.changedBy,
  });

  if (error) {
    return actionError(error, "No pudimos registrar el cambio de programación.");
  }
  return null;
}

export async function postponeMatch(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const loaded = await loadMatchForAdmin(orgSlug, matchId);
    if (!loaded.ok) return loaded.error;

    const reason = String(formData.get("reason") ?? "").trim() || null;
    if (!reason) {
      return { ok: false, error: "Indica el motivo del aplazamiento." };
    }
    const reasonTooLong = lengthError([[reason, 500]]);
    if (reasonTooLong) return reasonTooLong;
    if (loaded.match.status === "finalizado") {
      return { ok: false, error: "Un partido finalizado no se puede aplazar." };
    }
    if (loaded.match.status === "cancelado") {
      return { ok: false, error: "Un partido cancelado no se puede aplazar." };
    }

    const newStatus: MatchStatus = "aplazado";
    const { error } = await loaded.supabase
      .from("matches")
      .update({
        status: newStatus,
        status_reason: reason,
      })
      .eq("id", matchId)
      .eq("organization_id", loaded.membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos aplazar el partido.");
    }

    const changeError = await insertScheduleChange({
      supabase: loaded.supabase,
      organizationId: loaded.membership.organization_id,
      matchId,
      changeType: "aplazar",
      reason,
      previousScheduledAt: loaded.match.scheduled_at,
      newScheduledAt: loaded.match.scheduled_at,
      previousVenue: loaded.match.venue,
      newVenue: loaded.match.venue,
      previousStatus: loaded.match.status,
      newStatus,
      changedBy: loaded.membership.user_id,
    });
    if (changeError) return changeError;

    revalidateMatchPaths(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos aplazar el partido.");
  }
}

export async function cancelMatch(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const loaded = await loadMatchForAdmin(orgSlug, matchId);
    if (!loaded.ok) return loaded.error;

    const reason = String(formData.get("reason") ?? "").trim() || null;
    if (!reason) {
      return { ok: false, error: "Indica el motivo de la cancelación." };
    }
    const reasonTooLong = lengthError([[reason, 500]]);
    if (reasonTooLong) return reasonTooLong;
    if (loaded.match.status === "finalizado") {
      return { ok: false, error: "Un partido finalizado no se puede cancelar." };
    }
    if (loaded.match.status === "cancelado") {
      return { ok: false, error: "Este partido ya está cancelado." };
    }

    const newStatus: MatchStatus = "cancelado";
    const { error } = await loaded.supabase
      .from("matches")
      .update({
        status: newStatus,
        status_reason: reason,
      })
      .eq("id", matchId)
      .eq("organization_id", loaded.membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos cancelar el partido.");
    }

    const changeError = await insertScheduleChange({
      supabase: loaded.supabase,
      organizationId: loaded.membership.organization_id,
      matchId,
      changeType: "cancelar",
      reason,
      previousScheduledAt: loaded.match.scheduled_at,
      newScheduledAt: loaded.match.scheduled_at,
      previousVenue: loaded.match.venue,
      newVenue: loaded.match.venue,
      previousStatus: loaded.match.status,
      newStatus,
      changedBy: loaded.membership.user_id,
    });
    if (changeError) return changeError;

    revalidateMatchPaths(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos cancelar el partido.");
  }
}

export async function rescheduleMatch(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const loaded = await loadMatchForAdmin(orgSlug, matchId);
    if (!loaded.ok) return loaded.error;

    const reason = String(formData.get("reason") ?? "").trim() || null;
    if (!reason) {
      return { ok: false, error: "Indica el motivo de la reprogramación." };
    }
    const reasonTooLong = lengthError([[reason, 500]]);
    if (reasonTooLong) return reasonTooLong;
    if (loaded.match.status === "finalizado") {
      return {
        ok: false,
        error: "Un partido finalizado no se puede reprogramar.",
      };
    }
    if (loaded.match.status === "cancelado") {
      return {
        ok: false,
        error: "Un partido cancelado no se puede reprogramar.",
      };
    }

    const venueRaw = String(formData.get("venue") ?? "").trim();
    const venue = venueRaw || null;
    const venueTooLong = lengthError([[venue, 160]]);
    if (venueTooLong) return venueTooLong;
    const scheduled = parseScheduledAt(
      String(formData.get("scheduled_at") ?? "")
    );
    if (!scheduled.ok) return scheduled;
    if (!scheduled.value) {
      return {
        ok: false,
        error: "Indica la nueva fecha y hora del partido.",
      };
    }

    const newStatus: MatchStatus = "programado";
    const { error } = await loaded.supabase
      .from("matches")
      .update({
        scheduled_at: scheduled.value,
        venue,
        status: newStatus,
        status_reason: reason,
      })
      .eq("id", matchId)
      .eq("organization_id", loaded.membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos reprogramar el partido.");
    }

    const changeError = await insertScheduleChange({
      supabase: loaded.supabase,
      organizationId: loaded.membership.organization_id,
      matchId,
      changeType: "reprogramar",
      reason,
      previousScheduledAt: loaded.match.scheduled_at,
      newScheduledAt: scheduled.value,
      previousVenue: loaded.match.venue,
      newVenue: venue,
      previousStatus: loaded.match.status,
      newStatus,
      changedBy: loaded.membership.user_id,
    });
    if (changeError) return changeError;

    revalidateMatchPaths(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos reprogramar el partido.");
  }
}

export type JornadaScheduleEntry = {
  matchId: string;
  date: string;
  time: string;
  venue: string;
};

/**
 * Guarda de una vez fecha, hora y cancha de los partidos de una jornada
 * (lo que se acuerda en la junta semanal). Si un partido ya tenía horario y
 * cambia, queda en el historial como reprogramación.
 */
export async function saveJornadaSchedule(
  orgSlug: string,
  entries: JornadaScheduleEntry[]
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);
    const orgId = membership.organization_id;

    const parsed: { matchId: string; scheduledAt: string | null; venue: string | null }[] = [];
    for (const [i, entry] of entries.entries()) {
      const date = entry.date.trim();
      const time = entry.time.trim();
      const venue = entry.venue.trim() || null;
      const venueTooLong = lengthError([[venue, 160]]);
      if (venueTooLong) return venueTooLong;
      if (!date && !time) {
        parsed.push({ matchId: entry.matchId, scheduledAt: null, venue });
        continue;
      }
      const scheduledAt = fromMxParts(date, time);
      if (!scheduledAt) {
        return {
          ok: false,
          error: `Al partido ${i + 1} le falta la fecha o la hora.`,
        };
      }
      parsed.push({ matchId: entry.matchId, scheduledAt, venue });
    }
    if (parsed.length === 0) return { ok: true };

    const supabase = await createClient();
    const { data: current, error: readError } = await supabase
      .from("matches")
      .select("id, status, scheduled_at, venue")
      .eq("organization_id", orgId)
      .in(
        "id",
        parsed.map((p) => p.matchId)
      );
    if (readError) {
      return actionError(readError, "No pudimos leer los partidos.");
    }
    const byId = new Map((current ?? []).map((m) => [m.id, m]));

    for (const p of parsed) {
      const match = byId.get(p.matchId);
      if (!match || match.status === "finalizado" || match.status === "cancelado") {
        continue;
      }
      const sameTime =
        (match.scheduled_at ? new Date(match.scheduled_at).getTime() : null) ===
        (p.scheduledAt ? new Date(p.scheduledAt).getTime() : null);
      if (sameTime && (match.venue ?? null) === p.venue) continue;

      // Un aplazado con nuevo horario vuelve a programado, como al reprogramar.
      const newStatus: MatchStatus =
        match.status === "aplazado" && p.scheduledAt ? "programado" : match.status;
      const { error } = await supabase
        .from("matches")
        .update({ scheduled_at: p.scheduledAt, venue: p.venue, status: newStatus })
        .eq("id", p.matchId)
        .eq("organization_id", orgId);
      if (error) {
        return actionError(error, "No pudimos guardar los horarios.");
      }

      if (match.scheduled_at || newStatus !== match.status) {
        const changeError = await insertScheduleChange({
          supabase,
          organizationId: orgId,
          matchId: p.matchId,
          changeType: "reprogramar",
          reason: "Ajuste en el armado de la jornada",
          previousScheduledAt: match.scheduled_at,
          newScheduledAt: p.scheduledAt,
          previousVenue: match.venue,
          newVenue: p.venue,
          previousStatus: match.status,
          newStatus,
          changedBy: membership.user_id,
        });
        if (changeError) return changeError;
      }
    }

    revalidateMatchPaths(orgSlug);
    revalidatePath(`/${orgSlug}/matches/jornada`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar los horarios.");
  }
}

export async function deleteMatch(
  orgSlug: string,
  matchId: string
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin"]);

    const supabase = await createClient();
    const { error } = await supabase
      .from("matches")
      .delete()
      .eq("id", matchId)
      .eq("organization_id", membership.organization_id);

    if (error) {
      return actionError(error, "No pudimos eliminar el partido.");
    }

    revalidateMatchPaths(orgSlug);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el partido.");
  }
}

/** Sets: admin o árbitro asignado (cédula). */
export async function upsertMatchSet(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const membership = await requireOrgRole(orgSlug, ["admin", "referee"]);

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
      .select("id, referee_id")
      .eq("id", matchId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (matchError) {
      return actionError(matchError, "No pudimos leer el partido.");
    }
    if (!match) {
      return { ok: false, error: "Ese partido ya no existe." };
    }

    const { data: roleRows } = await supabase
      .from("memberships")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", membership.user_id);
    const roles = (roleRows ?? []).map((r) => r.role);
    const canEditSets =
      roles.includes("admin") ||
      (roles.includes("referee") && match.referee_id === membership.user_id);
    if (!canEditSets) {
      return {
        ok: false,
        error: "Solo el árbitro asignado o un admin pueden capturar sets.",
      };
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
    revalidatePath(`/${orgSlug}/referee/${matchId}`);
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
    const membership = await requireOrgRole(orgSlug, ["admin", "referee"]);

    const supabase = await createClient();
    const orgId = membership.organization_id;

    const { data: match, error: matchError } = await supabase
      .from("matches")
      .select("id, referee_id")
      .eq("id", matchId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (matchError) {
      return actionError(matchError, "No pudimos leer el partido.");
    }
    if (!match) {
      return { ok: false, error: "Ese partido ya no existe." };
    }

    const { data: roleRows } = await supabase
      .from("memberships")
      .select("role")
      .eq("organization_id", orgId)
      .eq("user_id", membership.user_id);
    const roles = (roleRows ?? []).map((r) => r.role);
    const canEditSets =
      roles.includes("admin") ||
      (roles.includes("referee") && match.referee_id === membership.user_id);
    if (!canEditSets) {
      return {
        ok: false,
        error: "Solo el árbitro asignado o un admin pueden quitar sets.",
      };
    }

    const { error } = await supabase
      .from("match_sets")
      .delete()
      .eq("id", setId)
      .eq("match_id", matchId)
      .eq("organization_id", orgId);

    if (error) {
      return actionError(error, "No pudimos eliminar el set.");
    }

    revalidatePath(`/${orgSlug}/matches/${matchId}`);
    revalidatePath(`/${orgSlug}/referee/${matchId}`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos eliminar el set.");
  }
}
