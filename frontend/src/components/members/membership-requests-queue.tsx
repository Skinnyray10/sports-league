"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  approveMembershipRequest,
  rejectMembershipRequest,
} from "@/app/(app)/[orgSlug]/members/actions";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ROLE_LABELS } from "@/lib/labels";
import type { MembershipRole } from "@/types/database";

export type MembershipRequestRow = {
  id: string;
  fullName: string;
  email: string;
  username: string | null;
  phone: string | null;
  clubName: string | null;
  requestedRole: MembershipRole;
  createdAt: string;
};

type Props = {
  orgSlug: string;
  requests: MembershipRequestRow[];
};

function RequestItem({
  orgSlug,
  req,
}: {
  orgSlug: string;
  req: MembershipRequestRow;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approveMembershipRequest(orgSlug, req.id);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success(`${req.fullName} ya tiene acceso como ${ROLE_LABELS[req.requestedRole]}.`);
      router.refresh();
    });
  }

  return (
    <li className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold text-foreground">{req.fullName}</p>
        <p className="text-xs text-muted-foreground">
          {ROLE_LABELS[req.requestedRole]}
          {req.clubName ? ` · ${req.clubName}` : ""}
          {req.username ? ` · @${req.username}` : ""}
        </p>
        <p className="text-xs text-muted-foreground">
          {req.email}
          {req.phone ? ` · ${req.phone}` : ""}
        </p>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button type="button" disabled={pending} onClick={approve}>
          {pending ? "Aprobando…" : "Aprobar"}
        </Button>
        <ConfirmDialog
          trigger={<Button type="button" variant="outline" disabled={pending} />}
          triggerContent="Rechazar"
          title={`¿Rechazar la solicitud de ${req.fullName}?`}
          description="La persona no tendrá acceso a la liga. Si fue un error, tendrá que registrarse de nuevo."
          confirmLabel="Rechazar solicitud"
          pendingLabel="Rechazando…"
          successMessage="Solicitud rechazada."
          onConfirm={() => rejectMembershipRequest(orgSlug, req.id)}
          onSuccess={() => router.refresh()}
        />
      </div>
    </li>
  );
}

export function MembershipRequestsQueue({ orgSlug, requests }: Props) {
  if (requests.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          No hay solicitudes pendientes
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando un Delegado o Árbitro se registre, aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {requests.map((req) => (
        <RequestItem key={req.id} orgSlug={orgSlug} req={req} />
      ))}
    </ul>
  );
}
