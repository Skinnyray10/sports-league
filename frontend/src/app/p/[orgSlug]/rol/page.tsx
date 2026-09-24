import { PublicMatchesList } from "@/components/public/public-match-cards";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import {
  loadPublicMatches,
  requirePublicOrg,
} from "@/lib/public-org";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicRolPage({ params }: PageProps) {
  const { orgSlug } = await params;
  await requirePublicOrg(orgSlug);
  const matches = await loadPublicMatches(orgSlug);
  const upcoming = matches.filter((m) =>
    ["programado", "en_vivo", "aplazado"].includes(m.status)
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <ModulePageHeader
        band="matches"
        title="Rol de juegos"
        description="Próximos partidos programados, en vivo o aplazados."
      />
      <PublicMatchesList
        matches={upcoming}
        emptyTitle="No hay partidos en el rol"
        emptyDescription="Cuando se programen partidos en una organización pública, aparecerán aquí."
      />
    </div>
  );
}
