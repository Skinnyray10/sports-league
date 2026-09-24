import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import {
  MembershipRequestsQueue,
  type MembershipRequestRow,
} from "@/components/members/membership-requests-queue";
import type { MembershipRole } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function MembersPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const membership = await requireOrgRole(orgSlug, ["admin"]);
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("membership_requests")
    .select(
      "id, full_name, email, username, phone, requested_role, created_at, club:clubs(name)"
    )
    .eq("organization_id", membership.organization_id)
    .eq("status", "pendiente")
    .order("created_at", { ascending: true });

  if (error) throw error;

  const requests: MembershipRequestRow[] = (data ?? []).map((row) => {
    const club = row.club as { name: string } | { name: string }[] | null;
    const clubName = Array.isArray(club) ? club[0]?.name : club?.name;
    return {
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      username: row.username,
      phone: row.phone,
      clubName: clubName ?? null,
      requestedRole: row.requested_role as MembershipRole,
      createdAt: row.created_at,
    };
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <ModulePageHeader
        band="approvals"
        title="Solicitudes de acceso"
        description="Aprueba Delegados y Árbitros. Los jugadores no se dan de alta aquí: los registra el Delegado."
      />
      <MembershipRequestsQueue orgSlug={orgSlug} requests={requests} />
    </div>
  );
}
