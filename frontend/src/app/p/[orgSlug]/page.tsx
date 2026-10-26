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
  const org = await requirePublicOrg(orgSlug);
  const matches = await loadPublicMatches(orgSlug);
  const nextMatch = pickNextMatch(matches);
  const lastResult = pickLastResult(matches);

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6 pb-12">
      {/* Hero header */}
      <header className="relative overflow-hidden border-b-2 border-metal bg-gradient-to-br from-card to-secondary pb-8 pt-12">
        <div className="absolute left-0 top-0 h-1 w-24 bg-lime" aria-hidden="true" />
        <div className="px-6">
          <h1 className="font-display text-5xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl">
            {org.name}
          </h1>
          {org.tagline ? (
            <p className="mt-3 text-lg font-medium text-muted-foreground">
              {org.tagline}
            </p>
          ) : null}
        </div>
      </header>

      {/* Main content grid */}
      <div className="grid gap-6 px-4 sm:px-6 lg:grid-cols-2">
        <div className="lg:col-span-2">
          <NextMatchCard match={nextMatch} />
        </div>
        <LastResultCard match={lastResult} orgSlug={orgSlug} />
        <RolCtaCard orgSlug={orgSlug} />
      </div>
    </div>
  );
}
