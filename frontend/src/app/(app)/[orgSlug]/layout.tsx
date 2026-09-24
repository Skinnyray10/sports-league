import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { OrgSidebar, type ModuleNavItem } from "@/components/layout/org-sidebar";
import { requireUser } from "@/lib/auth";
import { getMembership, listUserOrganizations } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types/database";

type OrgLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ orgSlug: string }>;
};

function buildNav(
  orgSlug: string,
  roles: MembershipRole[]
): ModuleNavItem[] {
  const isAdmin = roles.includes("admin");
  const isDelegado = roles.includes("team_manager");
  const isReferee = roles.includes("referee");

  const items: ModuleNavItem[] = [];

  if (isAdmin) {
    items.push(
      {
        href: `/${orgSlug}/clubs`,
        label: "Clubes",
        bandClass: "bg-band-teams",
      },
      {
        href: `/${orgSlug}/tournaments`,
        label: "Torneos",
        bandClass: "bg-band-tournaments",
      },
      {
        href: `/${orgSlug}/teams`,
        label: "Equipos",
        bandClass: "bg-band-teams",
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
      {
        href: `/${orgSlug}/approvals`,
        label: "Credenciales",
        bandClass: "bg-band-matches",
      },
      {
        href: `/${orgSlug}/members`,
        label: "Solicitudes",
        bandClass: "bg-[#5C6570]",
      },
      {
        href: `/${orgSlug}/settings`,
        label: "Configuración",
        bandClass: "bg-[#5C6570]",
      }
    );
  }

  if (isDelegado) {
    items.push(
      {
        href: `/${orgSlug}/players`,
        label: "Jugadores",
        bandClass: "bg-band-teams",
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
      }
    );
  }

  if (isReferee) {
    items.push(
      {
        href: `/${orgSlug}/referee`,
        label: "Mis partidos",
        bandClass: "bg-band-matches",
      },
      {
        href: `/${orgSlug}/standings`,
        label: "Posiciones",
        bandClass: "bg-band-standings",
      }
    );
  }

  // Deduplicate by href (user may have multiple roles).
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
}

export default async function OrgLayout({ children, params }: OrgLayoutProps) {
  const { orgSlug } = await params;
  const user = await requireUser({ next: `/${orgSlug}` });
  const membership = await getMembership(orgSlug);

  if (!membership) {
    notFound();
  }

  const supabase = await createClient();
  const { data: roleRows } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", membership.user_id);

  const roles = (roleRows ?? []).map((r) => r.role);
  const organizations = await listUserOrganizations();
  const org = membership.organization;
  const modules = buildNav(orgSlug, roles);

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
