import Link from "next/link";
import type { Tables } from "@/types/database";
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

type Team = Tables<"teams">;

type TeamsTableProps = {
  orgSlug: string;
  teams: Team[];
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
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">No teams yet</p>
        <p className="mt-1 text-sm text-[#5C6570]">
          {canManageStaff
            ? "Add the first team to start building your league."
            : "Ask a league manager to add teams for this organization."}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#D0D5DB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Team</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Logo</TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const canEdit =
              canManageStaff || managedTeamId === team.id;
            return (
              <TableRow key={team.id}>
                <TableCell className="font-medium text-[#0A0A0A]">
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
                      Your team
                    </Badge>
                  ) : null}
                </TableCell>
                <TableCell className="font-mono text-xs text-[#5C6570]">
                  {team.logo_url ? "Set" : "—"}
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
                      {canManageStaff ? "Manage" : "Edit"}
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
                      View
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
