"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  bulkApproveRegistrations,
  updateRegistrationReview,
} from "@/app/(app)/[orgSlug]/approvals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  APPROVAL_STATUS_LABELS,
  ELIGIBILITY_STATUS_LABELS,
} from "@/lib/labels";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";

export type ApprovalQueueRow = {
  id: string;
  folio: string;
  jerseyNumber: number | null;
  status: ApprovalStatus;
  eligibility: EligibilityStatus;
  firstNames: string;
  lastNames: string;
  teamName: string;
  clubName: string;
};

type ApprovalsQueueProps = {
  orgSlug: string;
  rows: ApprovalQueueRow[];
};

export function ApprovalsQueue({ orgSlug, rows }: ApprovalsQueueProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === rows.length) {
      setSelected(new Set());
      return;
    }
    setSelected(new Set(rows.map((r) => r.id)));
  }

  function runReview(
    id: string,
    patch: { status?: ApprovalStatus; eligibility?: EligibilityStatus }
  ) {
    setError(null);
    startTransition(async () => {
      const result = await updateRegistrationReview(orgSlug, id, patch);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function runBulkApprove() {
    setError(null);
    startTransition(async () => {
      const result = await bulkApproveRegistrations(
        orgSlug,
        Array.from(selected)
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          No hay credenciales con estos filtros
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cambia el filtro o espera a que los delegados registren jugadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
          disabled={pending || selected.size === 0}
          onClick={runBulkApprove}
        >
          Aprobar seleccionados ({selected.size})
        </Button>
        {error ? (
          <p className="text-sm text-[#DC2626]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <div className="overflow-x-auto border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="bg-secondary w-10">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                  className="size-4 accent-primary"
                />
              </TableHead>
              <TableHead className="bg-secondary text-foreground">
                Jugador
              </TableHead>
              <TableHead className="bg-secondary text-foreground">
                Equipo
              </TableHead>
              <TableHead className="bg-secondary text-foreground">
                Estado
              </TableHead>
              <TableHead className="bg-secondary text-foreground">
                Elegibilidad
              </TableHead>
              <TableHead className="bg-secondary text-right text-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    aria-label={`Seleccionar ${row.firstNames} ${row.lastNames}`}
                    checked={selected.has(row.id)}
                    onChange={() => toggle(row.id)}
                    className="size-4 accent-primary"
                  />
                </TableCell>
                <TableCell>
                  <p className="font-medium text-foreground">
                    {row.firstNames} {row.lastNames}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.folio}
                    {row.jerseyNumber != null ? ` · #${row.jerseyNumber}` : ""}
                  </p>
                </TableCell>
                <TableCell className="text-sm text-foreground">
                  <span>{row.teamName}</span>
                  <span className="block text-xs text-muted-foreground">
                    {row.clubName}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="secondary"
                    className="rounded-[2px] bg-secondary text-muted-foreground"
                  >
                    {APPROVAL_STATUS_LABELS[row.status]}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {ELIGIBILITY_STATUS_LABELS[row.eligibility]}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-1">
                    {row.status !== "aprobado" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="rounded-[2px]"
                        disabled={pending}
                        onClick={() =>
                          runReview(row.id, { status: "aprobado" })
                        }
                      >
                        Aprobar
                      </Button>
                    ) : null}
                    {row.status !== "rechazado" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="rounded-[2px] text-[#DC2626]"
                        disabled={pending}
                        onClick={() =>
                          runReview(row.id, { status: "rechazado" })
                        }
                      >
                        Rechazar
                      </Button>
                    ) : null}
                    {row.eligibility !== "elegible" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="outline"
                        className="rounded-[2px]"
                        disabled={pending}
                        onClick={() =>
                          runReview(row.id, { eligibility: "elegible" })
                        }
                      >
                        Elegible
                      </Button>
                    ) : null}
                    {row.eligibility !== "no_elegible" ? (
                      <Button
                        type="button"
                        size="xs"
                        variant="ghost"
                        className="rounded-[2px]"
                        disabled={pending}
                        onClick={() =>
                          runReview(row.id, { eligibility: "no_elegible" })
                        }
                      >
                        No elegible
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
