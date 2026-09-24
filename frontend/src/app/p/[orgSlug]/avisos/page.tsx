import { ModulePageHeader } from "@/components/ops/module-page-header";
import { PublicNoticesList } from "@/components/public/public-notices";
import {
  loadPublicNotices,
  requirePublicOrg,
} from "@/lib/public-org";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicAvisosPage({ params }: PageProps) {
  const { orgSlug } = await params;
  await requirePublicOrg(orgSlug);
  const notices = await loadPublicNotices(orgSlug);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ModulePageHeader
        band="settings"
        title="Avisos"
        description="Comunicados públicos de la organización."
      />
      <PublicNoticesList notices={notices} />
    </div>
  );
}
