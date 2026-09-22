import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { OrgSidebar } from "@/components/layout/org-sidebar";
import { requireUser } from "@/lib/auth";
import { getMembership, listUserOrganizations } from "@/lib/org";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const user = await requireUser({ next: `/${orgSlug}` });
  const membership = await getMembership(orgSlug);

  if (!membership) {
    notFound();
  }

  const organizations = await listUserOrganizations();
  const org = membership.organization;

  const modules = [
    {
      href: `/${orgSlug}/teams`,
      label: "Equipos",
      bandClass: "bg-band-teams",
    },
    {
      href: `/${orgSlug}/tournaments`,
      label: "Torneos",
      bandClass: "bg-band-tournaments",
    },
    {
      href: `/${orgSlug}/matches`,
      label: "Partidos",
      bandClass: "bg-band-matches",
    },
    {
      href: `/${orgSlug}/standings`,
      label: "Posiciones",
      bandClass: "bg-band-standings",
    },
  ];

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background md:flex-row">
      <OrgSidebar
        orgName={org.name}
        orgSlug={org.slug}
        modules={modules}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          email={user.email}
          organizations={organizations}
          currentSlug={orgSlug}
        />
        <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
