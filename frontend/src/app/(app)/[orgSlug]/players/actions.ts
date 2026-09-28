"use server";

import { revalidatePath } from "next/cache";
import {
  actionError,
  getOrgAccess,
  type ActionResult,
} from "@/components/ops/access";
import { createClient } from "@/lib/supabase/server";

function parseOptionalPositiveInt(
  value: FormDataEntryValue | null
): { ok: true; value: number | null } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!raw) return { ok: true, value: null };
  const n = Number.parseInt(raw, 10);
  if (!Number.isFinite(n) || n < 1) {
    return { ok: false, error: "El número de playera debe ser 1 o mayor." };
  }
  return { ok: true, value: n };
}

export async function registerPlayer(
  orgSlug: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await getOrgAccess(orgSlug);
    const teamId = access.managedTeamId;
    if (!teamId || !access.isDelegado) {
      return {
        ok: false,
        error: "Solo el delegado de un equipo puede registrar jugadores.",
      };
    }

    const firstNames = String(formData.get("first_names") ?? "").trim();
    const lastNames = String(formData.get("last_names") ?? "").trim();
    const idNumber = String(formData.get("id_number") ?? "").trim() || null;
    const classification =
      String(formData.get("classification") ?? "").trim() || null;
    const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
    const jersey = parseOptionalPositiveInt(formData.get("jersey_number"));
    if (!jersey.ok) return jersey;

    if (!firstNames || !lastNames) {
      return {
        ok: false,
        error: "Escribe el nombre y los apellidos del jugador.",
      };
    }

    const supabase = await createClient();
    const orgId = access.membership.organization_id;

    const { data: team, error: teamError } = await supabase
      .from("teams")
      .select("id, club_id")
      .eq("id", teamId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (teamError) {
      return actionError(teamError, "No pudimos leer tu equipo.");
    }
    if (!team) {
      return { ok: false, error: "Tu equipo ya no existe." };
    }

    const { data: player, error: playerError } = await supabase
      .from("players")
      .insert({
        organization_id: orgId,
        club_id: team.club_id,
        first_names: firstNames,
        last_names: lastNames,
        id_number: idNumber,
        classification,
        photo_url: photoUrl,
      })
      .select("id")
      .single();

    if (playerError || !player) {
      return actionError(
        playerError,
        "No pudimos registrar al jugador. Inténtalo de nuevo."
      );
    }

    const { error: regError } = await supabase
      .from("player_registrations")
      .insert({
        organization_id: orgId,
        player_id: player.id,
        team_id: teamId,
        jersey_number: jersey.value,
      });

    if (regError) {
      await supabase.from("players").delete().eq("id", player.id);
      return actionError(
        regError,
        "No pudimos crear la credencial. Inténtalo de nuevo.",
        "Ese jugador ya está inscrito en este equipo."
      );
    }

    revalidatePath(`/${orgSlug}/players`);
    revalidatePath(`/${orgSlug}/approvals`);
    return { ok: true };
  } catch (error) {
    return actionError(
      error,
      "No pudimos registrar al jugador. Inténtalo de nuevo."
    );
  }
}

export async function updatePendingPlayer(
  orgSlug: string,
  registrationId: string,
  formData: FormData
): Promise<ActionResult> {
  try {
    const access = await getOrgAccess(orgSlug);
    const teamId = access.managedTeamId;
    if (!teamId || !access.isDelegado) {
      return {
        ok: false,
        error: "Solo el delegado puede editar jugadores pendientes.",
      };
    }

    const firstNames = String(formData.get("first_names") ?? "").trim();
    const lastNames = String(formData.get("last_names") ?? "").trim();
    const idNumber = String(formData.get("id_number") ?? "").trim() || null;
    const classification =
      String(formData.get("classification") ?? "").trim() || null;
    const photoUrl = String(formData.get("photo_url") ?? "").trim() || null;
    const jersey = parseOptionalPositiveInt(formData.get("jersey_number"));
    if (!jersey.ok) return jersey;

    if (!firstNames || !lastNames) {
      return {
        ok: false,
        error: "Escribe el nombre y los apellidos del jugador.",
      };
    }

    const supabase = await createClient();
    const orgId = access.membership.organization_id;

    const { data: reg, error: regError } = await supabase
      .from("player_registrations")
      .select("id, player_id, status, team_id")
      .eq("id", registrationId)
      .eq("organization_id", orgId)
      .maybeSingle();

    if (regError) {
      return actionError(regError, "No pudimos leer la inscripción.");
    }
    if (!reg || reg.team_id !== teamId) {
      return { ok: false, error: "Esa inscripción no es de tu equipo." };
    }
    if (reg.status !== "pendiente") {
      return {
        ok: false,
        error: "Solo puedes editar mientras la credencial está pendiente.",
      };
    }

    const { error: playerError } = await supabase
      .from("players")
      .update({
        first_names: firstNames,
        last_names: lastNames,
        id_number: idNumber,
        classification,
        photo_url: photoUrl,
      })
      .eq("id", reg.player_id)
      .eq("organization_id", orgId);

    if (playerError) {
      return actionError(playerError, "No pudimos guardar los datos del jugador.");
    }

    const { error: updateRegError } = await supabase
      .from("player_registrations")
      .update({ jersey_number: jersey.value })
      .eq("id", registrationId)
      .eq("organization_id", orgId);

    if (updateRegError) {
      return actionError(
        updateRegError,
        "No pudimos guardar el número de playera."
      );
    }

    revalidatePath(`/${orgSlug}/players`);
    revalidatePath(`/${orgSlug}/players/${registrationId}/credential`);
    revalidatePath(`/${orgSlug}/approvals`);
    return { ok: true };
  } catch (error) {
    return actionError(error, "No pudimos guardar los cambios.");
  }
}
