"use client";

import Link from "next/link";
import type { TournamentStatus } from "@/types/database";
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
  sport_name: string;
};

type TournamentsListProps = {
  orgSlug: string;
  tournaments: TournamentRow[];
  canManageStaff: boolean;
};

const STATUS_LABEL: Record<TournamentStatus, string> = {
  registration: "Registration",
  active: "Active",
  finished: "Finished",
};

const FORMAT_LABEL: Record<string, string> = {
  round_robin: "Round robin",
  knockout: "Knockout",
  groups: "Groups",
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
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-10 text-center">
        <p className="font-medium text-[#0A0A0A]">Nothing in this status</p>
        <p className="mt-1 text-sm text-[#5C6570]">
          Switch tabs or create a tournament to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#D0D5DB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Tournament
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Sport</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Season
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Format
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Status
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-medium text-[#0A0A0A]">
                <Link
                  href={`/${orgSlug}/tournaments/${row.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  {row.name}
                </Link>
              </TableCell>
              <TableCell className="capitalize text-[#0A0A0A]">
                {row.sport_name}
              </TableCell>
              <TableCell className="font-mono text-sm text-[#0A0A0A]">
                {row.season}
              </TableCell>
              <TableCell className="text-[#5C6570]">
                {FORMAT_LABEL[row.format] ?? row.format}
                {row.legs === 2 ? " · H&A" : ""}
              </TableCell>
              <TableCell>
                <Badge variant="secondary" className="rounded-[2px]">
                  {STATUS_LABEL[row.status]}
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
                  {canManageStaff ? "Manage" : "View"}
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
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">
          No tournaments yet
        </p>
        <p className="mt-1 text-sm text-[#5C6570]">
          {canManageStaff
            ? "Create a tournament, then enroll teams to open the season."
            : "Ask a league manager to create the first tournament."}
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
          All ({tournaments.length})
        </TabsTrigger>
        <TabsTrigger value="registration" className="rounded-[2px]">
          Registration ({byStatus("registration").length})
        </TabsTrigger>
        <TabsTrigger value="active" className="rounded-[2px]">
          Active ({byStatus("active").length})
        </TabsTrigger>
        <TabsTrigger value="finished" className="rounded-[2px]">
          Finished ({byStatus("finished").length})
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
