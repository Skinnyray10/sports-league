import Link from "next/link";
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
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

export type TeamListRow = {
  id: string;
  name: string;
  logo_url: string | null;
  club_name: string;
  division_label: string;
  sport_key: string;
  branch: Branch;
  category_name: string;
  group_name: string | null;
};

type TeamsTableProps = {
  orgSlug: string;
  teams: TeamListRow[];
  canManageStaff: boolean;
  managedTeamId: string | null;
};

export function TeamsTable({
  orgSlug,
  teams,
  canManageStaff,
  managedTeamId,
}: TeamsTableProps) {
  if (teams.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          Todavía no hay equipos
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canManageStaff
            ? "Necesitas clubes y divisiones. Luego agrega el primer equipo."
            : "Pídele a un administrador que dé de alta los equipos."}
        </p>
      </div>
    );
  }

  return (
    <>
    <ul className="grid gap-2 md:hidden" aria-label="Equipos">
      {teams.map((team) => {
        const canEdit = canManageStaff || managedTeamId === team.id;
        return (
          <li key={team.id}>
            <Link
              href={`/${orgSlug}/teams/${team.id}`}
              className="flex min-h-11 items-center justify-between gap-3 border border-border bg-card px-4 py-3 hover:bg-muted"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-2 font-medium text-foreground">
                  <span className="truncate">{team.name}</span>
                  {managedTeamId === team.id ? (
                    <Badge variant="secondary" className="text-xs">
                      Tu equipo
                    </Badge>
                  ) : null}
                </span>
                <span className="mt-0.5 block truncate text-sm text-muted-foreground">
                  {team.club_name} · {sportLabel(team.sport_key)} ·{" "}
                  {BRANCH_LABELS[team.branch]} · {team.category_name}
                  {team.group_name ? ` · ${team.group_name}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-sm font-medium text-foreground">
                {canEdit ? (canManageStaff ? "Administrar" : "Editar") : "Ver"}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
    <div className="hidden overflow-hidden border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-secondary text-foreground">
              Equipo
            </TableHead>
            <TableHead className="bg-secondary text-foreground">Club</TableHead>
            <TableHead className="bg-secondary text-foreground">
              División
            </TableHead>
            <TableHead className="bg-secondary text-foreground">Grupo</TableHead>
            <TableHead className="bg-secondary text-right text-foreground">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const canEdit =
              canManageStaff || managedTeamId === team.id;
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium text-foreground">
                  <Link
                    href={`/${orgSlug}/teams/${team.id}`}
                    className="underline-offset-4 hover:underline"
                  >
                    {team.name}
                  </Link>
                  {managedTeamId === team.id ? (
                    <Badge
                      variant="secondary"
                      className="ml-2 text-xs"
                    >
                      Tu equipo
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="text-foreground">
                  {team.club_name}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <span className="text-foreground">
                    {sportLabel(team.sport_key)}
                  </span>
                  {" · "}
                  {BRANCH_LABELS[team.branch]}
                  {" · "}
                  {team.category_name}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {team.group_name ?? "—"}
                </TableCell>
                <TableCell className="text-right">
                  {canEdit ? (
                    <Button
                      variant="outline"
                      size="sm"
                      render={
                        <Link href={`/${orgSlug}/teams/${team.id}`} />
                      }
                    >
                      {canManageStaff ? "Administrar" : "Editar"}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      render={
                        <Link href={`/${orgSlug}/teams/${team.id}`} />
                      }
                    >
                      Ver
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
