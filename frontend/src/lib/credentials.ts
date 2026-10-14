import QRCode from "qrcode";
import type { CredentialView } from "@/components/players/credential-card";
import { getSiteUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types/database";
import { unwrapOne } from "@/lib/utils";

type CredentialFilter = { registrationId: string } | { teamId: string };

export type TeamCredential = {
  teamId: string;
  credential: CredentialView;
};

/** Carga credenciales (con su QR) de una inscripción o de todo un equipo. */
export async function loadCredentials(
  orgId: string,
  organizationLogoUrl: string | null,
  filter: CredentialFilter
): Promise<TeamCredential[]> {
  const supabase = await createClient();

  let query = supabase
    .from("player_registrations")
    .select(
      `
      id,
      folio,
      jersey_number,
      status,
      eligibility,
      team_id,
      player:players(
        first_names,
        last_names,
        photo_url,
        classification,
        club:clubs(name)
      ),
      team:teams(
        name,
        logo_url,
        division:divisions(
          branch,
          sport:sports(name),
          category:categories(name)
        )
      )
    `
    )
    .eq("organization_id", orgId);

  query =
    "registrationId" in filter
      ? query.eq("id", filter.registrationId)
      : query.eq("team_id", filter.teamId);

  const { data, error } = await query.order("created_at", { ascending: true });
  if (error) throw error;

  const siteUrl = await getSiteUrl();

  return Promise.all(
    (data ?? []).map(async (reg) => {
      const player = unwrapOne(reg.player);
      const club = player ? unwrapOne(player.club) : null;
      const team = unwrapOne(reg.team);
      const division = team ? unwrapOne(team.division) : null;
      const sport = division ? unwrapOne(division.sport) : null;
      const category = division ? unwrapOne(division.category) : null;

      const verifyUrl = `${siteUrl}/c/${encodeURIComponent(reg.folio)}`;
      const qrDataUrl = await QRCode.toDataURL(verifyUrl, {
        margin: 1,
        width: 192,
      });

      return {
        teamId: reg.team_id,
        credential: {
          folio: reg.folio,
          firstNames: player?.first_names ?? "",
          lastNames: player?.last_names ?? "",
          photoUrl: player?.photo_url ?? null,
          teamName: team?.name ?? "—",
          clubName: club?.name ?? "—",
          sportName: sport?.name ?? "—",
          branch: (division?.branch ?? "mixto") as Branch,
          categoryName: category?.name ?? "—",
          classification: player?.classification ?? null,
          status: reg.status,
          eligibility: reg.eligibility,
          jerseyNumber: reg.jersey_number,
          organizationLogoUrl,
          teamLogoUrl: team?.logo_url ?? null,
          verifyUrl,
          qrDataUrl,
        },
      };
    })
  );
}
