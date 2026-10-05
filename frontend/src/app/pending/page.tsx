import Link from "next/link";
import { redirect } from "next/navigation";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth";
import { listUserOrganizations } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { APPROVAL_STATUS_LABELS, ROLE_LABELS } from "@/lib/labels";
import { unwrapOne } from "@/lib/utils";
import type { ApprovalStatus, MembershipRole } from "@/types/database";

const STATUS_TONE: Record<ApprovalStatus, string> = {
  pendiente: "bg-secondary text-muted-foreground",
  aprobado: "bg-status-final/10 text-status-final",
  rechazado: "bg-destructive/10 text-destructive",
};

export default async function PendingPage() {
  const user = await requireUser({ next: "/pending" });
  const orgs = await listUserOrganizations();
  if (orgs.length > 0) {
    redirect(`/${orgs[0]!.slug}`);
  }

  const supabase = await createClient();
  const { data: requests } = await supabase
    .from("membership_requests")
    .select(
      "id, full_name, requested_role, status, created_at, organization:organizations(name, slug)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main id="contenido" className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Acceso
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Solicitud pendiente
        </h1>
        <p className="text-sm text-muted-foreground">
          Tu cuenta existe, pero todavía no tienes acceso a un panel. Cuando un
          administrador apruebe tu solicitud, podrás entrar como Delegado o
          Árbitro.
        </p>
      </div>

      {requests && requests.length > 0 ? (
        <ul className="divide-y divide-border border border-border bg-card">
          {requests.map((req) => {
            const resolved = unwrapOne(
              req.organization as
                | { name: string; slug: string }
                | { name: string; slug: string }[]
                | null
            );
            return (
              <li key={req.id} className="px-4 py-3">
                <p className="text-sm font-semibold text-foreground">
                  {resolved?.name ?? "Liga"}
                </p>
                <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  {ROLE_LABELS[req.requested_role as MembershipRole] ??
                    req.requested_role}
                  <Badge variant="secondary" className={STATUS_TONE[req.status as ApprovalStatus]}>
                    {APPROVAL_STATUS_LABELS[req.status as ApprovalStatus] ?? req.status}
                  </Badge>
                </p>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="rounded-sm border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
          No encontramos solicitudes. Puedes enviar una desde el registro.
        </p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-foreground hover:text-background"
        >
          Ver vista pública
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-11 flex-1 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Nueva solicitud
        </Link>
      </div>
      <form action={signOut}>
        <Button type="submit" variant="outline" className="h-11 w-full rounded-full">
          Salir
        </Button>
      </form>
    </main>
  );
}
