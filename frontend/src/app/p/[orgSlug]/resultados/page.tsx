import { PublicMatchesList } from "@/components/public/public-match-cards";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import {
  loadPublicMatches,
  requirePublicOrg,
} from "@/lib/public-org";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicResultadosPage({ params }: PageProps) {
  const { orgSlug } = await params;
  await requirePublicOrg(orgSlug);
  const matches = await loadPublicMatches(orgSlug);
  const finished = matches
    .filter((m) => m.status === "finalizado")
    .sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return tb - ta;
    });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ModulePageHeader
        band="matches"
        title="Resultados"
        description="Partidos finalizados con marcador oficial."
      />
      <PublicMatchesList
        matches={finished}
        showScore
        emptyTitle="Todavía no hay resultados"
        emptyDescription="Los marcadores aparecen cuando el árbitro cierra la cédula."
      />
    </div>
  );
}
