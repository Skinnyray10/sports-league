"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { actionError, type ActionResult } from "@/lib/action-result";
import type { MatchEventType } from "@/types/database";

function revalidateSheet(orgSlug: string, matchId: string) {
  revalidatePath(`/${orgSlug}/referee`);
  revalidatePath(`/${orgSlug}/referee/${matchId}`);
  revalidatePath(`/${orgSlug}/matches/${matchId}`);
  revalidatePath(`/${orgSlug}/standings`);
}

export async function ensureMatchSheet(
  orgSlug: string,
  matchId: string
): Promise<ActionResult & { sheetId?: string }> {
  try {
    const user = await requireUser();
    const membership = await requireOrgRole(orgSlug, ["referee", "admin"]);
    const supabase = await createClient();

    const { data: match } = await supabase
      .from("matches")
      .select("id, referee_id, organization_id")
      .eq("id", matchId)
      .eq("organization_id", membership.organization_id)
      .maybeSingle();

    if (!match) {
      return { ok: false, error: "No encontramos ese partido." };
    }
    if (
      membership.role !== "admin" &&
      match.referee_id !== user.id
    ) {
      // also allow if user has admin role via multi-role
      const { data: roles } = await supabase
        .from("memberships")
        .select("role")
        .eq("organization_id", membership.organization_id)
        .eq("user_id", user.id);
      const isAdmin = (roles ?? []).some((r) => r.role === "admin");
      if (!isAdmin && match.referee_id !== user.id) {
        return { ok: false, error: "Este partido no te está asignado." };
      }
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
        organization_id: membership.organization_id,
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
    await requireOrgRole(orgSlug, ["referee", "admin"]);
    const supabase = await createClient();

    const { data: sheet } = await supabase
      .from("match_sheets")
      .select("id, closed_at, organization_id")
      .eq("id", sheetId)
      .maybeSingle();

    if (!sheet || sheet.closed_at) {
      return { ok: false, error: "La cédula está cerrada." };
    }

    await supabase
      .from("match_participants")
      .delete()
      .eq("match_sheet_id", sheetId);

    if (registrationIds.length > 0) {
      const { data: regs, error: regsError } = await supabase
        .from("player_registrations")
        .select("id, team_id")
        .in("id", registrationIds);

      if (regsError) {
        return actionError(regsError, "No pudimos leer las credenciales.");
      }

      const { error } = await supabase.from("match_participants").insert(
        (regs ?? []).map((r) => ({
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
    await requireOrgRole(orgSlug, ["referee", "admin"]);
    const sheetId = String(formData.get("sheet_id") ?? "");
    const registrationId = String(formData.get("player_registration_id") ?? "");
    const teamId = String(formData.get("team_id") ?? "");
    const eventType = String(formData.get("event_type") ?? "") as MatchEventType;
    const quantity = Number.parseInt(String(formData.get("quantity") ?? "1"), 10);
    const minuteRaw = String(formData.get("minute") ?? "").trim();
    const minute = minuteRaw ? Number.parseInt(minuteRaw, 10) : null;

    if (!sheetId || !registrationId || !teamId || !eventType) {
      return { ok: false, error: "Faltan datos del evento." };
    }

    const supabase = await createClient();
    const { data: sheet } = await supabase
      .from("match_sheets")
      .select("organization_id, closed_at")
      .eq("id", sheetId)
      .maybeSingle();

    if (!sheet || sheet.closed_at) {
      return { ok: false, error: "La cédula está cerrada." };
    }

    const { error } = await supabase.from("match_events").insert({
      organization_id: sheet.organization_id,
      match_sheet_id: sheetId,
      player_registration_id: registrationId,
      team_id: teamId,
      event_type: eventType,
      quantity: Number.isFinite(quantity) && quantity > 0 ? quantity : 1,
      minute: minute != null && Number.isFinite(minute) ? minute : null,
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
    await requireOrgRole(orgSlug, ["referee", "admin"]);
    const supabase = await createClient();
    const { error } = await supabase
      .from("match_events")
      .delete()
      .eq("id", eventId);

    if (error) {
      return actionError(error, "No pudimos quitar el evento.");
    }

    revalidateSheet(orgSlug, matchId);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos quitar el evento.");
  }
}

export async function saveSheetMeta(
  orgSlug: string,
  matchId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    await requireOrgRole(orgSlug, ["referee", "admin"]);
    const sheetId = String(formData.get("sheet_id") ?? "");
    const observations = String(formData.get("observations") ?? "").trim();
    const refereeName = String(formData.get("referee_name") ?? "").trim();
    const shootoutWinner = String(formData.get("shootout_winner_team_id") ?? "").trim() || null;

    const supabase = await createClient();
    const { error } = await supabase
      .from("match_sheets")
      .update({
        observations: observations || null,
        referee_name: refereeName || null,
      })
      .eq("id", sheetId);

    if (error) {
      return actionError(error, "No pudimos guardar la cédula.");
    }

    if (shootoutWinner !== undefined) {
      await supabase
        .from("matches")
        .update({ shootout_winner_team_id: shootoutWinner })
        .eq("id", matchId);
    }

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
    const user = await requireUser();
    await requireOrgRole(orgSlug, ["referee", "admin"]);
    const observations = String(formData.get("observations") ?? "").trim();
    const refereeName = String(formData.get("referee_name") ?? "").trim();
    const shootoutWinner =
      String(formData.get("shootout_winner_team_id") ?? "").trim() || null;

    if (!refereeName) {
      return { ok: false, error: "Escribe tu nombre para cerrar la cédula." };
    }

    const supabase = await createClient();

    if (shootoutWinner) {
      const { error: shootErr } = await supabase
        .from("matches")
        .update({ shootout_winner_team_id: shootoutWinner })
        .eq("id", matchId);
      if (shootErr) {
        return actionError(shootErr, "No pudimos guardar el ganador de penales.");
      }
    }

    const { error } = await supabase
      .from("match_sheets")
      .update({
        observations: observations || null,
        referee_name: refereeName,
        closed_at: new Date().toISOString(),
        closed_by: user.id,
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
