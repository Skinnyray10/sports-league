import { PublicSidebar } from "@/components/public/public-sidebar";
import { getUser } from "@/lib/auth";
import { publicNav } from "@/lib/nav";
import { getMembership, roleHomePath } from "@/lib/org";
import { requirePublicOrg } from "@/lib/public-org";

type PublicLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function PublicOrgLayout({
  children,
  params,
}: PublicLayoutProps) {
  const { orgSlug } = await params;
  const org = await requirePublicOrg(orgSlug);
  const modules = publicNav(org.slug);

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
        <header className="border-b border-border bg-sidebar px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center gap-3">
            {org.logo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={org.logo_url}
                alt=""
                referrerPolicy="no-referrer"
                className="size-10 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="flex size-10 items-center justify-center rounded-full bg-primary font-heading text-xs font-extrabold text-foreground"
              >
                SL
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-heading text-lg font-extrabold tracking-tight text-sidebar-foreground md:text-xl">
                {org.name}
              </p>
              {org.tagline ? (
                <p className="truncate text-sm text-sidebar-foreground/70">
                  {org.tagline}
                </p>
              ) : (
                <p className="text-sm text-sidebar-foreground/70">Vista pública</p>
              )}
            </div>
          </div>
        </header>
        <main
          id="contenido"
          tabIndex={-1}
          className="tablero-enter flex-1 px-4 py-6 outline-none md:px-6 md:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
