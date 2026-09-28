"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import {
  approveMembershipRequest,
  rejectMembershipRequest,
} from "@/app/(app)/[orgSlug]/members/actions";
import { Button } from "@/components/ui/button";
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

export function MembershipRequestsQueue({ orgSlug, requests }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (requests.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
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
    <ul className="divide-y divide-border border border-border bg-card">
      {requests.map((req) => (
        <li
          key={req.id}
          className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
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
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              disabled={pending}
              className="h-8 rounded-full bg-primary text-foreground hover:bg-foreground hover:text-background"
              onClick={() => {
                startTransition(async () => {
                  await approveMembershipRequest(orgSlug, req.id);
                  router.refresh();
                });
              }}
            >
              Aprobar
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              className="h-8 rounded-sm"
              onClick={() => {
                startTransition(async () => {
                  await rejectMembershipRequest(orgSlug, req.id);
                  router.refresh();
                });
              }}
            >
              Rechazar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
