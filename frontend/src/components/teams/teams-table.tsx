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
    <div className="overflow-hidden border border-border bg-card">
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
                      className="ml-2 rounded-[2px] text-xs"
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
                      className="rounded-[2px]"
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
                      className="rounded-[2px]"
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
  );
}
