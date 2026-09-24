import Link from "next/link";
import type { ApprovalStatus, EligibilityStatus } from "@/types/database";
import { EditPlayerDialog } from "@/components/players/edit-player-dialog";
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

export type PlayerRegistrationRow = {
  id: string;
  folio: string;
  jerseyNumber: number | null;
  status: ApprovalStatus;
  eligibility: EligibilityStatus;
  firstNames: string;
  lastNames: string;
  idNumber: string | null;
  classification: string | null;
  photoUrl: string | null;
};

type PlayersTableProps = {
  orgSlug: string;
  rows: PlayerRegistrationRow[];
};

function statusBadgeClass(status: ApprovalStatus): string {
  if (status === "aprobado") return "bg-[#1F6B4A]/10 text-[#1F6B4A]";
  if (status === "rechazado") return "bg-[#DC2626]/10 text-[#DC2626]";
  return "bg-[#E6E9EC] text-[#5C6570]";
}

export function PlayersTable({ orgSlug, rows }: PlayersTableProps) {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">
          Todavía no hay jugadores
        </p>
        <p className="mt-1 text-sm text-[#5C6570]">
          Registra a tu plantilla para solicitar credenciales.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#D0D5DB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Jugador</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">#</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Estado</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Elegibilidad
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell>
                <p className="font-medium text-[#0A0A0A]">
                  {row.firstNames} {row.lastNames}
                </p>
                <p className="font-mono text-xs text-[#5C6570]">{row.folio}</p>
              </TableCell>
              <TableCell className="font-mono tabular-nums text-[#0A0A0A]">
                {row.jerseyNumber ?? "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant="secondary"
                  className={`rounded-[2px] ${statusBadgeClass(row.status)}`}
                >
                  {APPROVAL_STATUS_LABELS[row.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-sm text-[#5C6570]">
                {ELIGIBILITY_STATUS_LABELS[row.eligibility]}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex flex-wrap justify-end gap-2">
                  {row.status === "pendiente" ? (
                    <EditPlayerDialog
                      orgSlug={orgSlug}
                      registrationId={row.id}
                      defaults={{
                        firstNames: row.firstNames,
                        lastNames: row.lastNames,
                        idNumber: row.idNumber,
                        classification: row.classification,
                        photoUrl: row.photoUrl,
                        jerseyNumber: row.jerseyNumber,
                      }}
                    />
                  ) : null}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="rounded-[2px]"
                    render={
                      <Link
                        href={`/${orgSlug}/players/${row.id}/credential`}
                      />
                    }
                  >
                    Credencial
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
