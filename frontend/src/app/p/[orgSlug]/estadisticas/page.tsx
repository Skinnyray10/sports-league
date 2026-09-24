import { ModulePageHeader } from "@/components/ops/module-page-header";
import {
  PublicScorersTable,
  PublicStandingsSections,
} from "@/components/public/public-stats";
import {
  loadPublicScorers,
  loadPublicStandings,
  requirePublicOrg,
} from "@/lib/public-org";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicEstadisticasPage({ params }: PageProps) {
  const { orgSlug } = await params;
  await requirePublicOrg(orgSlug);
  const [standings, scorers] = await Promise.all([
    loadPublicStandings(orgSlug),
    loadPublicScorers(orgSlug),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-10">
      <ModulePageHeader
        band="standings"
        title="Estadísticas"
        description="Tabla de posiciones y goleo a partir de partidos finalizados."
      />
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0A0A0A]">Posiciones</h2>
        <PublicStandingsSections rows={standings} />
      </section>
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#0A0A0A]">Goleo</h2>
        <PublicScorersTable scorers={scorers} />
      </section>
    </div>
  );
}
