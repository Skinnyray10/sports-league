"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  bulkApproveRegistrations,
  updateRegistrationReview,
} from "@/app/(app)/[orgSlug]/approvals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
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
import { cn } from "@/lib/utils";
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

const STATUS_TONE: Record<ApprovalStatus, string> = {
  pendiente: "bg-secondary text-muted-foreground",
  aprobado: "bg-status-final/10 text-status-final",
  rechazado: "bg-destructive/10 text-destructive",
};

const ELIGIBILITY_TONE: Record<EligibilityStatus, string> = {
  pendiente: "bg-secondary text-muted-foreground",
  elegible: "bg-status-final/10 text-status-final",
  no_elegible: "bg-destructive/10 text-destructive",
};

export function ApprovalsQueue({ orgSlug, rows }: ApprovalsQueueProps) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string | null>(null);
  const [pendingId, setPendingId] = React.useState<string | null>(null);
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
    setPendingId(id);
    startTransition(async () => {
      const result = await updateRegistrationReview(orgSlug, id, patch);
      setPendingId(null);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Credencial actualizada.");
      router.refresh();
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          No hay credenciales con estos filtros
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cambia el filtro o espera a que los delegados registren jugadores.
        </p>
      </div>
    );
  }

  function rowActions(row: ApprovalQueueRow, fullName: string) {
    const rowPending = pending && pendingId === row.id;
    return (
      <div className="flex flex-wrap justify-end gap-x-3 gap-y-2">
        <div role="group" aria-label="Credencial" className="flex gap-1.5">
          {row.status !== "aprobado" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10 sm:min-h-8"
              disabled={rowPending}
              onClick={() => runReview(row.id, { status: "aprobado" })}
            >
              Aprobar
            </Button>
          ) : null}
          {row.status !== "rechazado" ? (
            <ConfirmDialog
              trigger={
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className="min-h-10 text-destructive hover:bg-destructive/10 hover:text-destructive sm:min-h-8"
                  disabled={rowPending}
                />
              }
              triggerContent="Rechazar"
              title={`¿Rechazar la credencial de ${fullName}?`}
              description="El jugador no podrá jugar con esta credencial. Puedes aprobarla después si fue un error."
              confirmLabel="Rechazar credencial"
              pendingLabel="Rechazando…"
              successMessage="Credencial rechazada."
              onConfirm={() =>
                updateRegistrationReview(orgSlug, row.id, {
                  status: "rechazado",
                })
              }
              onSuccess={() => router.refresh()}
            />
          ) : null}
        </div>
        <div
          role="group"
          aria-label="Elegibilidad"
          className="flex gap-1.5 border-l border-border pl-3"
        >
          {row.eligibility !== "elegible" ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="min-h-10 sm:min-h-8"
              disabled={rowPending}
              onClick={() => runReview(row.id, { eligibility: "elegible" })}
            >
              Elegible
            </Button>
          ) : null}
          {row.eligibility !== "no_elegible" ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="min-h-10 sm:min-h-8"
              disabled={rowPending}
              onClick={() => runReview(row.id, { eligibility: "no_elegible" })}
            >
              No elegible
            </Button>
          ) : null}
        </div>
      </div>
    );
  }

  function badges(row: ApprovalQueueRow) {
    return (
      <>
        <Badge variant="secondary" className={cn(STATUS_TONE[row.status])}>
          {APPROVAL_STATUS_LABELS[row.status]}
        </Badge>
        <Badge variant="secondary" className={cn(ELIGIBILITY_TONE[row.eligibility])}>
          {ELIGIBILITY_STATUS_LABELS[row.eligibility]}
        </Badge>
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex min-h-11 items-center gap-2 text-sm text-foreground md:hidden">
          <input
            type="checkbox"
            checked={selected.size === rows.length && rows.length > 0}
            onChange={toggleAll}
            className="size-5 accent-primary"
          />
          Seleccionar todas
        </label>
        <ConfirmDialog
          trigger={<Button type="button" disabled={pending || selected.size === 0} />}
          triggerContent={`Aprobar seleccionados (${selected.size})`}
          variant="default"
          title={`¿Aprobar ${selected.size} credencial${selected.size === 1 ? "" : "es"}?`}
          description="Las credenciales seleccionadas pasarán a Aprobado. Revisa que los datos de cada jugador sean correctos."
          confirmLabel="Aprobar todas"
          pendingLabel="Aprobando…"
          successMessage="Credenciales aprobadas."
          onConfirm={() => bulkApproveRegistrations(orgSlug, Array.from(selected))}
          onSuccess={() => {
            setSelected(new Set());
            router.refresh();
          }}
        />
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <ul className="grid gap-2 md:hidden" aria-label="Credenciales">
        {rows.map((row) => {
          const fullName = `${row.firstNames} ${row.lastNames}`;
          return (
            <li key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  aria-label={`Seleccionar ${fullName}`}
                  checked={selected.has(row.id)}
                  onChange={() => toggle(row.id)}
                  className="mt-0.5 size-5 shrink-0 accent-primary"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{fullName}</p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {row.folio}
                    {row.jerseyNumber != null ? ` · #${row.jerseyNumber}` : ""}
                  </p>
                  <p className="mt-1 text-sm text-foreground">
                    {row.teamName}
                    <span className="text-muted-foreground"> · {row.clubName}</span>
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">{badges(row)}</div>
                </div>
              </div>
              <div className="mt-3 border-t border-border pt-3">
                {rowActions(row, fullName)}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-border bg-card md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-12 bg-secondary">
                <input
                  type="checkbox"
                  aria-label="Seleccionar todas"
                  checked={selected.size === rows.length && rows.length > 0}
                  onChange={toggleAll}
                  className="size-5 accent-primary"
                />
              </TableHead>
              <TableHead className="bg-secondary text-foreground">Jugador</TableHead>
              <TableHead className="bg-secondary text-foreground">Equipo</TableHead>
              <TableHead className="bg-secondary text-foreground">Estado</TableHead>
              <TableHead className="bg-secondary text-right text-foreground">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const fullName = `${row.firstNames} ${row.lastNames}`;
              return (
                <TableRow key={row.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${fullName}`}
                      checked={selected.has(row.id)}
                      onChange={() => toggle(row.id)}
                      className="size-5 accent-primary"
                    />
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-foreground">{fullName}</p>
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
                    <div className="flex flex-col items-start gap-1">{badges(row)}</div>
                  </TableCell>
                  <TableCell className="text-right">{rowActions(row, fullName)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
