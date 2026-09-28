import {
  LastResultCard,
  NextMatchCard,
  RolCtaCard,
} from "@/components/public/public-match-cards";
import {
  loadPublicMatches,
  pickLastResult,
  pickNextMatch,
  requirePublicOrg,
} from "@/lib/public-org";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicPanelPage({ params }: PageProps) {
  const { orgSlug } = await params;
  await requirePublicOrg(orgSlug);
  const matches = await loadPublicMatches(orgSlug);
  const nextMatch = pickNextMatch(matches);
  const lastResult = pickLastResult(matches);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <NextMatchCard match={nextMatch} />
      <LastResultCard match={lastResult} orgSlug={orgSlug} />
      <RolCtaCard orgSlug={orgSlug} />
    </div>
  );
}
