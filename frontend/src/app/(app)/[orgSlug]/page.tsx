import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLE_LABELS } from "@/lib/labels";
import { modulesForRoles } from "@/lib/nav";
import { getMembership } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

type OrgDashboardProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function OrgDashboardPage({ params }: OrgDashboardProps) {
  const { orgSlug } = await params;
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
  const modules = modulesForRoles(orgSlug, roles);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          {membership.organization.name}
        </h1>
        <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
          Entraste como{" "}
          <span className="font-medium text-foreground">
            {ROLE_LABELS[membership.role]}
          </span>
          . Abre un módulo para continuar.
        </p>
      </div>

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {modules.map((mod) => (
          <li key={mod.key}>
            <Link
              href={mod.href}
              className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-secondary/70"
            >
              <span
                aria-hidden
                className={`mt-1 h-8 w-1 shrink-0 rounded-sm ${mod.bandClass}`}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground group-hover:underline group-hover:underline-offset-4">
                  {mod.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {mod.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
