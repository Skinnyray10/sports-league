import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import {
  CredentialCard,
  type CredentialView,
} from "@/components/players/credential-card";
import { PrintButton } from "@/components/players/print-button";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { Branch } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string; registrationId: string }>;
};

export default async function CredentialPage({ params }: PageProps) {
  const { orgSlug, registrationId } = await params;
  const access = await getOrgAccess(orgSlug);

  if (!access.isDelegado && !access.isAdmin) {
    redirect(`/${orgSlug}`);
  }

  const supabase = await createClient();
  const orgId = access.membership.organization_id;

  const { data: reg, error } = await supabase
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
        division:divisions(
          branch,
          sport:sports(name),
          category:categories(name)
        )
      )
    `
    )
    .eq("id", registrationId)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (error) throw error;
  if (!reg) notFound();

  if (
    access.isDelegado &&
    !access.isAdmin &&
    access.managedTeamId !== reg.team_id
  ) {
    notFound();
  }

  const player = unwrapOne(reg.player);
  const club = player ? unwrapOne(player.club) : null;
  const team = unwrapOne(reg.team);
  const division = team ? unwrapOne(team.division) : null;
  const sport = division ? unwrapOne(division.sport) : null;
  const category = division ? unwrapOne(division.category) : null;

  const credential: CredentialView = {
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
  };

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
  const path = `/c/${credential.folio}`;
  const verifyUrl = siteUrl ? `${siteUrl}${path}` : path;

  return (
    <section className="mx-auto w-full max-w-3xl">
      <ModulePageHeader
        band="players"
        title="Credencial"
        description="Imprime o muestra el folio para verificación pública."
        className="print:hidden"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="rounded-[2px]"
              render={<Link href={`/${orgSlug}/players`} />}
            >
              Volver
            </Button>
            <PrintButton />
          </div>
        }
      />
      <CredentialCard credential={credential} verifyUrl={verifyUrl} />
    </section>
  );
}

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
