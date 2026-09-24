import {
  PublicSidebar,
  type PublicNavItem,
} from "@/components/public/public-sidebar";
import { getUser } from "@/lib/auth";
import { getMembership, roleHomePath } from "@/lib/org";
import { requirePublicOrg } from "@/lib/public-org";

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

function buildPublicNav(orgSlug: string): PublicNavItem[] {
  return [
    {
      href: `/p/${orgSlug}`,
      label: "Panel",
      bandClass: "bg-band-standings",
    },
    {
      href: `/p/${orgSlug}/rol`,
      label: "Ver rol de juegos",
      bandClass: "bg-band-matches",
    },
    {
      href: `/p/${orgSlug}/resultados`,
      label: "Resultados",
      bandClass: "bg-band-matches",
    },
    {
      href: `/p/${orgSlug}/estadisticas`,
      label: "Estadísticas",
      bandClass: "bg-band-standings",
    },
    {
      href: `/p/${orgSlug}/avisos`,
      label: "Avisos",
      bandClass: "bg-[#5C6570]",
    },
  ];
}

export default async function PublicOrgLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { orgSlug } = await params;
  const org = await requirePublicOrg(orgSlug);
  const modules = buildPublicNav(org.slug);

  const user = await getUser();
  let panelHref: string | null = null;
  if (user) {
    const membership = await getMembership(org.slug);
    if (membership) {
      panelHref = await roleHomePath(org.slug);
    }
  }

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background md:flex-row">
      <PublicSidebar
        orgName={org.name}
        orgSlug={org.slug}
        modules={modules}
        panelHref={panelHref}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border bg-[#0A0A0A] px-4 py-5 md:px-6">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt=""
                className="size-10 rounded-sm object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-sm bg-[#00B7FF] font-mono text-xs font-bold text-[#0A0A0A]"
              >
                SL
              </span>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-lg font-bold tracking-tight text-white md:text-xl">
                {org.name}
              </h1>
              {org.tagline ? (
                <p className="truncate text-sm text-white/70">{org.tagline}</p>
              ) : (
                <p className="text-sm text-white/70">Vista pública</p>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
