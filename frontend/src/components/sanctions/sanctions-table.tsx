"use client";

import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { deleteSanction } from "@/app/(app)/[orgSlug]/sanctions/actions";
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

export type SanctionRow = {
  id: string;
  playerName: string;
  teamName: string;
  reason: string;
  jornada: number | null;
  sanction: string;
  createdAt: string;
};

type SanctionsTableProps = {
  orgSlug: string;
  sanctions: SanctionRow[];
};

export function SanctionsTable({ orgSlug, sanctions }: SanctionsTableProps) {
  const router = useRouter();

  if (sanctions.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          No hay castigados
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cuando registres un castigo aparecerá aquí.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Jugador</TableHead>
            <TableHead>Equipo</TableHead>
            <TableHead>Falta</TableHead>
            <TableHead>Jornada</TableHead>
            <TableHead>Castigo</TableHead>
            <TableHead className="w-12">
              <span className="sr-only">Acciones</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sanctions.map((s) => (
            <TableRow key={s.id}>
              <TableCell className="font-medium">{s.playerName}</TableCell>
              <TableCell>{s.teamName}</TableCell>
              <TableCell className="min-w-48 whitespace-normal">
                {s.reason}
              </TableCell>
              <TableCell>{s.jornada != null ? `J-${s.jornada}` : "—"}</TableCell>
              <TableCell>{s.sanction}</TableCell>
              <TableCell>
                <ConfirmDialog
                  trigger={
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      className="text-muted-foreground hover:text-destructive"
                      aria-label={`Quitar castigo de ${s.playerName}`}
                    />
                  }
                  triggerContent={<Trash2Icon />}
                  title={`¿Quitar el castigo de ${s.playerName}?`}
                  description="Se borra de la lista de castigados. No se puede deshacer."
                  confirmLabel="Quitar castigo"
                  pendingLabel="Quitando…"
                  successMessage="Castigo quitado."
                  onConfirm={() => deleteSanction(orgSlug, s.id)}
                  onSuccess={() => router.refresh()}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
