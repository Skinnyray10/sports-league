"use server";

import { revalidatePath } from "next/cache";
import { getOrgAccess } from "@/components/ops/access";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/lib/action-result";
import { MATCH_EVENT_LABELS } from "@/lib/labels";
import type { MatchEventType } from "@/types/database";

const EVENT_TYPES = new Set(Object.keys(MATCH_EVENT_LABELS));

const MAX_OBSERVATIONS = 2000;
const MAX_NAME = 120;

function revalidateSheet(orgSlug: string, matchId: string) {
  revalidatePath(`/${orgSlug}/referee`);
  revalidatePath(`/${orgSlug}/referee/${matchId}`);
  revalidatePath(`/${orgSlug}/matches/${matchId}`);
  revalidatePath(`/${orgSlug}/standings`);
}

type SheetContext = {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;
  organizationId: string;
  sheet: { id: string; closed_at: string | null; organization_id: string };
  match: { id: string; home_team_id: string; away_team_id: string };
};

/**
 * Carga la cédula verificando que sea de este partido y esta liga, y que quien
 * llama sea admin o el árbitro asignado. RLS lo vuelve a comprobar.
 */
async function loadSheet(
  orgSlug: string,
  matchId: string,
  sheetId: string,
  { requireOpen = true }: { requireOpen?: boolean } = {}
): Promise<SheetContext | { error: string }> {
  const user = await requireUser();
  const access = await getOrgAccess(orgSlug);
  if (!access.isAdmin && !access.isReferee) {
    return { error: "Tu rol no puede editar cédulas." };
  }
  const organizationId = access.membership.organization_id;
  const supabase = await createClient();

  const { data: match } = await supabase
    .from("matches")
    .select("id, referee_id, home_team_id, away_team_id")
    .eq("id", matchId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!match) return { error: "No encontramos ese partido." };
  if (!access.isAdmin && match.referee_id !== user.id) {
    return { error: "Este partido no te está asignado." };
  }

  const { data: sheet } = await supabase
    .from("match_sheets")
    .select("id, closed_at, organization_id")
    .eq("id", sheetId)
    .eq("match_id", matchId)
    .eq("organization_id", organizationId)
    .maybeSingle();

  if (!sheet) return { error: "No encontramos la cédula de este partido." };
  if (requireOpen && sheet.closed_at) return { error: "La cédula está cerrada." };

  return { supabase, userId: user.id, organizationId, sheet, match };
}

export async function ensureMatchSheet(
  orgSlug: string,
  matchId: string
): Promise<ActionResult & { sheetId?: string }> {
  try {
    const user = await requireUser();
    const access = await getOrgAccess(orgSlug);
    if (!access.isAdmin && !access.isReferee) {
      return { ok: false, error: "Tu rol no puede abrir cédulas." };
    }
    const supabase = await createClient();

    const { data: match } = await supabase
      .from("matches")
      .select("id, referee_id")
      .eq("id", matchId)
      .eq("organization_id", access.membership.organization_id)
      .maybeSingle();

    if (!match) {
      return { ok: false, error: "No encontramos ese partido." };
    }
    if (!access.isAdmin && match.referee_id !== user.id) {
      return { ok: false, error: "Este partido no te está asignado." };
    }

    const { data: existing } = await supabase
      .from("match_sheets")
      .select("id")
      .eq("match_id", matchId)
      .maybeSingle();

    if (existing) {
      return { ok: true, sheetId: existing.id };
    }

    const { data: created, error } = await supabase
      .from("match_sheets")
      .insert({
        organization_id: access.membership.organization_id,
        match_id: matchId,
      })
      .select("id")
      .single();

    if (error) {
      return actionError(error, "No pudimos abrir la cédula.");
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true, sheetId: created.id };
  } catch (error) {
    return actionError(error, "No pudimos abrir la cédula.");
  }
}

export async function setParticipants(
  orgSlug: string,
  matchId: string,
  sheetId: string,
  registrationIds: string[]
): Promise<ActionResult> {
  try {
    const ctx = await loadSheet(orgSlug, matchId, sheetId);
    if ("error" in ctx) return { ok: false, error: ctx.error };
    const { supabase, sheet, match } = ctx;

    const ids = Array.from(new Set(registrationIds)).slice(0, 200);
    let rows: { id: string; team_id: string }[] = [];

    if (ids.length > 0) {
      const { data: regs, error: regsError } = await supabase
        .from("player_registrations")
        .select("id, team_id")
        .in("id", ids)
        .in("team_id", [match.home_team_id, match.away_team_id])
        .eq("status", "aprobado")
        .eq("eligibility", "elegible");

      if (regsError) {
        return actionError(regsError, "No pudimos leer las credenciales.");
      }
      rows = regs ?? [];
      if (rows.length !== ids.length) {
        return {
          ok: false,
          error: "Alguno de los jugadores no es elegible para este partido.",
        };
      }
    }

    const { error: deleteError } = await supabase
      .from("match_participants")
      .delete()
      .eq("match_sheet_id", sheetId);

    if (deleteError) {
      return actionError(deleteError, "No pudimos actualizar participantes.");
    }

    if (rows.length > 0) {
      const { error } = await supabase.from("match_participants").insert(
        rows.map((r) => ({
          organization_id: sheet.organization_id,
          match_sheet_id: sheetId,
          player_registration_id: r.id,
          team_id: r.team_id,
        }))
      );

      if (error) {
        return actionError(error, "No pudimos guardar participantes.");
      }
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar participantes.");
  }
}

export async function addMatchEvent(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const sheetId = String(formData.get("sheet_id") ?? "");
    const registrationId = String(formData.get("player_registration_id") ?? "");
    const eventType = String(formData.get("event_type") ?? "") as MatchEventType;
    const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
    const minuteRaw = String(formData.get("minute") ?? "").trim();
    const minute = minuteRaw ? Number.parseInt(minuteRaw, 10) : null;

    if (!sheetId || !registrationId || !eventType) {
      return { ok: false, error: "Faltan datos del evento." };
    }
    if (!EVENT_TYPES.has(eventType)) {
      return { ok: false, error: "Tipo de evento no válido." };
    }
    if (!Number.isFinite(quantity) || quantity < 1 || quantity > 100) {
      return { ok: false, error: "La cantidad debe estar entre 1 y 100." };
    }
    if (minute != null && (!Number.isFinite(minute) || minute < 0 || minute > 300)) {
      return { ok: false, error: "El minuto debe estar entre 0 y 300." };
    }

    const ctx = await loadSheet(orgSlug, matchId, sheetId);
    if ("error" in ctx) return { ok: false, error: ctx.error };
    const { supabase, sheet } = ctx;

    const { data: participant } = await supabase
      .from("match_participants")
      .select("team_id")
      .eq("match_sheet_id", sheetId)
      .eq("player_registration_id", registrationId)
      .maybeSingle();

    if (!participant) {
      return {
        ok: false,
        error: "Marca primero al jugador como participante de la cédula.",
      };
    }

    const { error } = await supabase.from("match_events").insert({
      organization_id: sheet.organization_id,
      match_sheet_id: sheetId,
      player_registration_id: registrationId,
      team_id: participant.team_id,
      event_type: eventType,
      quantity,
      minute,
    });

    if (error) {
      return actionError(error, "No pudimos registrar el evento.");
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos registrar el evento.");
  }
}

export async function deleteMatchEvent(
  orgSlug: string,
  matchId: string,
  eventId: string
): Promise<ActionResult> {
  try {
    const user = await requireUser();
    const access = await getOrgAccess(orgSlug);
    if (!access.isAdmin && !access.isReferee) {
      return { ok: false, error: "Tu rol no puede editar cédulas." };
    }
    const supabase = await createClient();

    const { data: sheet } = await supabase
      .from("match_sheets")
      .select("id, closed_at, match:matches!inner(id, referee_id)")
      .eq("match_id", matchId)
      .eq("organization_id", access.membership.organization_id)
      .maybeSingle();

    const match = sheet
      ? Array.isArray(sheet.match)
        ? sheet.match[0]
        : sheet.match
      : null;

    if (!sheet || !match) {
      return { ok: false, error: "No encontramos la cédula de este partido." };
    }
    if (sheet.closed_at) {
      return { ok: false, error: "La cédula está cerrada." };
    }
    if (!access.isAdmin && match.referee_id !== user.id) {
      return { ok: false, error: "Este partido no te está asignado." };
    }

    const { data: deleted, error } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId)
      .eq("match_sheet_id", sheet.id)
      .select("id");

    if (error) {
      return actionError(error, "No pudimos quitar el evento.");
    }
    if (!deleted || deleted.length === 0) {
      return { ok: false, error: "Ese evento ya no existe." };
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos quitar el evento.");
  }
}

function readSheetMeta(formData: FormData) {
  return {
    sheetId: String(formData.get("sheet_id") ?? ""),
    observations: String(formData.get("observations") ?? "")
      .trim()
      .slice(0, MAX_OBSERVATIONS),
    refereeName: String(formData.get("referee_name") ?? "")
      .trim()
      .slice(0, MAX_NAME),
    shootoutWinner:
      String(formData.get("shootout_winner_team_id") ?? "").trim() || null,
  };
}

async function saveShootoutWinner(
  ctx: SheetContext,
  shootoutWinner: string | null
): Promise<ActionResult> {
  const { supabase, match } = ctx;
  if (
    shootoutWinner &&
    shootoutWinner !== match.home_team_id &&
    shootoutWinner !== match.away_team_id
  ) {
    return { ok: false, error: "El ganador por penales debe ser local o visitante." };
  }
  const { error } = await supabase
    .from("matches")
    .update({ shootout_winner_team_id: shootoutWinner })
    .eq("id", match.id);
  if (error) {
    return actionError(error, "No pudimos guardar el ganador por penales.");
  }
  return { ok: true };
}

export async function saveSheetMeta(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { sheetId, observations, refereeName, shootoutWinner } =
      readSheetMeta(formData);

    const ctx = await loadSheet(orgSlug, matchId, sheetId);
    if ("error" in ctx) return { ok: false, error: ctx.error };

    const { error } = await ctx.supabase
      .from("match_sheets")
      .update({
        observations: observations || null,
        referee_name: refereeName || null,
      })
      .eq("id", sheetId);

    if (error) {
      return actionError(error, "No pudimos guardar la cédula.");
    }

    const shootout = await saveShootoutWinner(ctx, shootoutWinner);
    if (!shootout.ok) return shootout;

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar la cédula.");
  }
}

export async function closeMatchSheet(
  orgSlug: string,
  matchId: string,
  sheetId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const { observations, refereeName, shootoutWinner } = readSheetMeta(formData);

    if (!refereeName) {
      return { ok: false, error: "Escribe tu nombre para cerrar la cédula." };
    }

    const ctx = await loadSheet(orgSlug, matchId, sheetId);
    if ("error" in ctx) return { ok: false, error: ctx.error };

    if (shootoutWinner) {
      const shootout = await saveShootoutWinner(ctx, shootoutWinner);
      if (!shootout.ok) return shootout;
    }

    const { error } = await ctx.supabase
      .from("match_sheets")
      .update({
        observations: observations || null,
        referee_name: refereeName,
        closed_at: new Date().toISOString(),
        closed_by: ctx.userId,
      })
      .eq("id", sheetId);

    if (error) {
      return actionError(
        error,
        "No pudimos cerrar la cédula. Si hay empate, elige ganador por penales."
      );
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos cerrar la cédula.");
  }
}
