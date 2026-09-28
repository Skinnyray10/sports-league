"use client";

import Link from "next/link";
import type { TournamentStatus } from "@/types/database";
import { TOURNAMENT_STATUS_LABELS, formatLabel } from "@/lib/labels";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type TournamentRow = {
  id: string;
  name: string;
  season: string;
  format: string;
  legs: number;
  status: TournamentStatus;
  division_count: number;
};

type TournamentsListProps = {
  orgSlug: string;
  tournaments: TournamentRow[];
  canManageStaff: boolean;
};

function TournamentTable({
  orgSlug,
  rows,
  canManageStaff,
}: {
  orgSlug: string;
  rows: TournamentRow[];
  canManageStaff: boolean;
}) {
  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-10 text-center">
        <p className="font-medium text-foreground">
          Ningún torneo en este estado
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Cambia de pestaña para ver los demás.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-secondary text-foreground">
              Torneo
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Temporada
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Formato
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Divisiones
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Estado
            </TableHead>
            <TableHead className="bg-secondary text-right text-foreground">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-foreground">
                <Link
                  href={`/${orgSlug}/tournaments/${row.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell className="font-mono text-sm text-foreground">
                {row.season}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {formatLabel(row.format)}
                {row.legs === 2 ? " · Ida y vuelta" : ""}
              </TableCell>
              <TableCell className="tabular-nums text-foreground">
                {row.division_count}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="rounded-[2px]">
                  {TOURNAMENT_STATUS_LABELS[row.status]}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-[2px]"
                  render={
                    <Link href={`/${orgSlug}/tournaments/${row.id}`} />
                  }
                >
                  {canManageStaff ? "Administrar" : "Ver"}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function TournamentsList({
  orgSlug,
  tournaments,
  canManageStaff,
}: TournamentsListProps) {
  if (tournaments.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          Todavía no hay torneos
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManageStaff
            ? "Crea un torneo y luego agrega divisiones (deporte, rama y categoría)."
            : "Pídele a un administrador que cree el primer torneo."}
        </p>
      </div>
    );
  }

  const byStatus = (status: TournamentStatus | "all") =>
    status === "all"
      ? tournaments
      : tournaments.filter((t) => t.status === status);

  return (
    <Tabs defaultValue="all">
      <TabsList variant="line" className="mb-4 rounded-none">
        <TabsTrigger value="all" className="rounded-[2px]">
          Todos ({tournaments.length})
        </TabsTrigger>
        <TabsTrigger value="registration" className="rounded-[2px]">
          Inscripciones ({byStatus("registration").length})
        </TabsTrigger>
        <TabsTrigger value="active" className="rounded-[2px]">
          En curso ({byStatus("active").length})
        </TabsTrigger>
        <TabsTrigger value="finished" className="rounded-[2px]">
          Finalizados ({byStatus("finished").length})
        </TabsTrigger>
      </TabsList>
      {(
        ["all", "registration", "active", "finished"] as const
      ).map((status) => (
        <TabsContent key={status} value={status}>
          <TournamentTable
            orgSlug={orgSlug}
            rows={byStatus(status)}
            canManageStaff={canManageStaff}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
