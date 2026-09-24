import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { ApprovalsQueue } from "@/components/approvals/approvals-queue";
import { createClient } from "@/lib/supabase/server";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";
import {
  APPROVAL_STATUS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
} from "@/lib/labels";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
  searchParams: Promise<{ status?: string; eligibility?: string }>;
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
    `
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });

  if (statusFilter) {
    query = query.eq("status", statusFilter);
  }
  if (eligibilityFilter) {
    query = query.eq("eligibility", eligibilityFilter);
  }

  const { data, error } = await query;
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

      <div className="mb-4 flex flex-wrap gap-2 text-sm">
        <FilterLink
          href={`/${orgSlug}/approvals`}
          active={!statusFilter && !eligibilityFilter}
          label="Todas"
        />
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

      <ApprovalsQueue orgSlug={orgSlug} rows={rows} />
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
      className={
        active
          ? "rounded-[2px] bg-[#0A0A0A] px-3 py-1.5 font-medium text-white"
          : "rounded-[2px] border border-[#D0D5DB] bg-white px-3 py-1.5 text-[#5C6570] hover:bg-[#E6E9EC]"
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

function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}
