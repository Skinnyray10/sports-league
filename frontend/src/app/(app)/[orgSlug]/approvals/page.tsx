import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { ApprovalsQueue } from "@/components/approvals/approvals-queue";
import { Pagination, pageRange, parsePage } from "@/components/ops/pagination";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";
import {
  APPROVAL_STATUS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
} from "@/lib/labels";
import { unwrapOne } from "@/lib/utils";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string; eligibility?: string; page?: string }>;
};

export default async function ApprovalsPage({
  params,
  searchParams,
}: PageProps) {
  const { orgSlug } = await params;
  const filters = await searchParams;
  const access = await getOrgAccess(orgSlug);

  if (!access.isAdmin) {
    redirect(`/${orgSlug}`);
  }

  const statusFilter = parseApproval(filters.status);
  const eligibilityFilter = parseEligibility(filters.eligibility);
  const page = parsePage(filters.page);
  const [from, to] = pageRange(page);

  const supabase = await createClient();
  const orgId = access.membership.organization_id;

  let query = supabase
    .from("player_registrations")
    .select(
      `
      id,
      folio,
      jersey_number,
      status,
      eligibility,
      player:players(
        first_names,
        last_names,
        club:clubs(name)
      ),
      team:teams(name)
    `,
      { count: "exact" }
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (eligibilityFilter) {
    query = query.eq("eligibility", eligibilityFilter);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const rows = (data ?? []).map((row) => {
    const player = unwrapOne(row.player);
    const club = player ? unwrapOne(player.club) : null;
    const team = unwrapOne(row.team);
    return {
      id: row.id,
      folio: row.folio,
      jerseyNumber: row.jersey_number,
      status: row.status as ApprovalStatus,
      eligibility: row.eligibility as EligibilityStatus,
      firstNames: player?.first_names ?? "",
      lastNames: player?.last_names ?? "",
      teamName: team?.name ?? "—",
      clubName: club?.name ?? "—",
    };
  });

  return (
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="approvals"
        title="Credenciales"
        description="Aprueba inscripciones y marca elegibilidad para la cédula."
      />

      <nav aria-label="Filtros de credenciales" className="mb-4 flex flex-wrap gap-x-6 gap-y-3 text-sm">
        <FilterLink
          href={`/${orgSlug}/approvals`}
          active={!statusFilter && !eligibilityFilter}
          label="Todas"
        />
        <div role="group" aria-labelledby="filter-status" className="flex flex-wrap items-center gap-2">
          <span id="filter-status" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Estado
          </span>
          {(Object.keys(APPROVAL_STATUS_LABELS) as ApprovalStatus[]).map(
            (status) => (
              <FilterLink
                key={status}
                href={`/${orgSlug}/approvals?status=${status}`}
                active={statusFilter === status && !eligibilityFilter}
                label={APPROVAL_STATUS_LABELS[status]}
              />
            )
          )}
        </div>
        <div role="group" aria-labelledby="filter-eligibility" className="flex flex-wrap items-center gap-2">
          <span id="filter-eligibility" className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Elegibilidad
          </span>
          {(Object.keys(ELIGIBILITY_STATUS_LABELS) as EligibilityStatus[]).map(
            (eligibility) => (
              <FilterLink
                key={eligibility}
                href={`/${orgSlug}/approvals?eligibility=${eligibility}`}
                active={eligibilityFilter === eligibility && !statusFilter}
                label={ELIGIBILITY_STATUS_LABELS[eligibility]}
              />
            )
          )}
        </div>
      </nav>

      <ApprovalsQueue orgSlug={orgSlug} rows={rows} />
      <Pagination
        page={page}
        total={count ?? rows.length}
        hrefFor={(p) => {
          const qs = new URLSearchParams();
          if (statusFilter) qs.set("status", statusFilter);
          if (eligibilityFilter) qs.set("eligibility", eligibilityFilter);
          if (p > 1) qs.set("page", String(p));
          const q = qs.toString();
          return q ? `/${orgSlug}/approvals?${q}` : `/${orgSlug}/approvals`;
        }}
      />
    </section>
  );
}

function FilterLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={
        active
          ? "inline-flex min-h-10 items-center rounded-full bg-foreground px-3 font-medium text-background"
          : "inline-flex min-h-10 items-center rounded-full border border-border bg-card px-3 text-muted-foreground hover:bg-secondary"
      }
    >
      {label}
    </Link>
  );
}

function parseApproval(value: string | undefined): ApprovalStatus | null {
  if (value === "pendiente" || value === "aprobado" || value === "rechazado") {
    return value;
  }
  return null;
}

function parseEligibility(
  value: string | undefined
): EligibilityStatus | null {
  if (
    value === "pendiente" ||
    value === "elegible" ||
    value === "no_elegible"
  ) {
    return value;
  }
  return null;
}

