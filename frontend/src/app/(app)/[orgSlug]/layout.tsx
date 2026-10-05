import { notFound } from "next/navigation";
import { AppHeader } from "@/components/layout/app-header";
import { OrgSidebar } from "@/components/layout/org-sidebar";
import { requireUser } from "@/lib/auth";
import { modulesForRoles } from "@/lib/nav";
import { getMembership, listUserOrganizations } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

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

  const supabase = await createClient();
  const { data: roleRows } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", membership.user_id);

  const roles = (roleRows ?? []).map((r) => r.role);
  const organizations = await listUserOrganizations();
  const org = membership.organization;
  const modules = modulesForRoles(orgSlug, roles).map(({ href, label, bandClass }) => ({
    href,
    label,
    bandClass,
  }));

  return (
    <div className="flex min-h-full flex-1 flex-col bg-background md:flex-row">
      <OrgSidebar orgName={org.name} orgSlug={org.slug} modules={modules} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          email={user.email}
          organizations={organizations}
          currentSlug={orgSlug}
          modules={modules}
        />
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
