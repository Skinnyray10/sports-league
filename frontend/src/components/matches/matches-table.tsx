import Link from "next/link";
import type { MatchStatus } from "@/types/database";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BRANCH_LABELS, MATCH_STAGE_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

export type MatchListRow = {
  id: string;
  status: MatchStatus;
  homeScore: number;
  awayScore: number;
  scheduledAt: string | null;
  jornada: number | null;
  stage: string;
  venue: string | null;
  tournamentName: string;
  sportKey: string;
  branch: Branch | null;
  categoryName: string | null;
  groupName: string | null;
  homeTeamName: string;
  awayTeamName: string;
};

type MatchesTableProps = {
  orgSlug: string;
  matches: MatchListRow[];
  canCreateMatch: boolean;
  /** Hay filtros activos: el vacío significa "sin coincidencias", no "sin partidos". */
  clearFiltersHref?: string | null;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function MatchesTable({
  orgSlug,
  matches,
  canCreateMatch,
  clearFiltersHref,
}: MatchesTableProps) {
  if (matches.length === 0 && clearFiltersHref) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          Sin partidos con estos filtros
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Prueba con otra combinación o quita los filtros para ver todos.
        </p>
        <Button variant="outline" className="mt-4" render={<Link href={clearFiltersHref} />}>
          Limpiar filtros
        </Button>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          Todavía no hay partidos
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {canCreateMatch
            ? "Programa el primero. Necesitas una división con al menos dos equipos."
            : "Pídele a un administrador que programe la jornada."}
        </p>
      </div>
    );
  }

  return (
    <>
    <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card md:hidden">
      {matches.map((match) => (
        <li key={match.id}>
          <Link
            href={`/${orgSlug}/matches/${match.id}`}
            className="flex flex-col gap-1.5 px-4 py-3 hover:bg-secondary/40"
          >
            <span className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs text-muted-foreground tabular-nums">
                {formatWhen(match.scheduledAt)}
                {match.jornada != null ? ` · J${match.jornada}` : ""}
              </span>
              <MatchStatusBadge status={match.status} />
            </span>
            <span className="flex items-baseline justify-between gap-3">
              <span className="font-medium text-foreground">
                {match.homeTeamName}
                <span className="mx-1.5 font-normal text-muted-foreground">vs</span>
                {match.awayTeamName}
              </span>
              {match.status === "finalizado" ? (
                <span className="font-mono text-sm font-semibold tabular-nums">
                  {match.homeScore}–{match.awayScore}
                </span>
              ) : null}
            </span>
            <span className="text-xs text-muted-foreground">
              {sportLabel(match.sportKey)}
              {match.branch ? ` · ${BRANCH_LABELS[match.branch]}` : ""}
              {match.categoryName ? ` · ${match.categoryName}` : ""}
              {match.venue ? ` · ${match.venue}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
    <div className="hidden overflow-hidden rounded-xl border border-border bg-card md:block">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-secondary text-foreground">
              Fecha
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              División
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Partido
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Sede
            </TableHead>
            <TableHead className="bg-secondary text-foreground">
              Marcador
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
          {matches.map((match) => (
            <TableRow key={match.id} className="hover:bg-secondary/40">
              <TableCell className="font-mono text-sm text-foreground tabular-nums">
                {formatWhen(match.scheduledAt)}
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {match.jornada != null ? `Jornada ${match.jornada}` : null}
                  {match.jornada != null && match.stage !== "regular"
                    ? " · "
                    : null}
                  {match.stage !== "regular"
                    ? (MATCH_STAGE_LABELS[match.stage] ?? match.stage)
                    : match.jornada == null
                      ? "—"
                      : null}
                </span>
              </TableCell>
              <TableCell className="text-foreground">
                <span className="block">{match.tournamentName}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {sportLabel(match.sportKey)}
                  {match.branch ? ` · ${BRANCH_LABELS[match.branch]}` : ""}
                  {match.categoryName ? ` · ${match.categoryName}` : ""}
                  {match.groupName ? ` · ${match.groupName}` : ""}
                </span>
              </TableCell>
              <TableCell className="font-medium text-foreground">
                {match.homeTeamName}
                <span className="mx-1.5 font-normal text-muted-foreground">vs</span>
                {match.awayTeamName}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {match.venue ?? "—"}
              </TableCell>
              <TableCell className="font-mono text-sm tabular-nums text-foreground">
                {match.status === "finalizado"
                  ? `${match.homeScore}–${match.awayScore}`
                  : "—"}
              </TableCell>
              <TableCell>
                <MatchStatusBadge status={match.status} />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="outline"
                  size="sm"
                  render={
                    <Link href={`/${orgSlug}/matches/${match.id}`} />
                  }
                >
                  Abrir
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
    </>
  );
}
