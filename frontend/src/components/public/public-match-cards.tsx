import Link from "next/link";
import {
  BRANCH_LABELS,
  MATCH_STATUS_LABELS,
  sportLabel,
} from "@/lib/labels";
import {
  formatPublicDate,
  formatPublicTime,
  formatPublicWhen,
  teamInitials,
  type PublicMatch,
} from "@/lib/public-org";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";

type NextMatchCardProps = {
  match: PublicMatch | null;
};

export function NextMatchCard({ match }: NextMatchCardProps) {
  return (
    <section className="border border-[#D0D5DB] bg-white">
      <div className="flex items-center justify-between border-b border-[#D0D5DB] bg-[#E6E9EC] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#0A0A0A]">Próximo partido</h2>
        {match ? (
          <span className="rounded-sm bg-[#FF2D95]/15 px-2 py-0.5 text-[0.6875rem] font-medium text-[#0A0A0A]">
            {sportLabel(match.sport_key)}
          </span>
        ) : null}
      </div>
      {!match ? (
        <p className="px-4 py-8 text-center text-sm text-[#5C6570]">
          No hay partidos próximos publicados.
        </p>
      ) : (
        <div className="space-y-4 p-4">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <TeamBlock name={match.home_team_name} align="right" />
            <div className="text-center">
              <p className="text-lg font-bold tracking-tight text-[#0A0A0A]">
                VS
              </p>
              {match.group_name ? (
                <p className="text-[0.6875rem] text-[#5C6570]">
                  {match.group_name}
                </p>
              ) : null}
            </div>
            <TeamBlock name={match.away_team_name} align="left" />
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-[#D0D5DB] pt-3 text-xs text-[#5C6570]">
            <span>{formatPublicDate(match.scheduled_at)}</span>
            <span>{formatPublicTime(match.scheduled_at)}</span>
            {match.venue ? <span>{match.venue}</span> : null}
            <span>
              {BRANCH_LABELS[match.branch]} · {match.category_name}
            </span>
          </div>
        </div>
      )}
    </section>
  );
}

type LastResultCardProps = {
  match: PublicMatch | null;
  orgSlug: string;
};

export function LastResultCard({ match, orgSlug }: LastResultCardProps) {
  return (
    <section className="border border-[#D0D5DB] bg-white">
      <div className="flex items-center justify-between border-b border-[#D0D5DB] bg-[#E6E9EC] px-4 py-2.5">
        <h2 className="text-sm font-semibold text-[#0A0A0A]">Último resultado</h2>
        <Link
          href={`/p/${orgSlug}/resultados`}
          className="text-xs font-medium text-[#00B7FF] hover:underline"
        >
          Ver todos →
        </Link>
      </div>
      {!match ? (
        <p className="px-4 py-8 text-center text-sm text-[#5C6570]">
          Todavía no hay resultados publicados.
        </p>
      ) : (
        <div className="space-y-3 p-4">
          <div className="flex items-center justify-center gap-4">
            <TeamScore
              name={match.home_team_name}
              score={match.home_score}
              tone="home"
            />
            <span className="text-sm font-medium text-[#5C6570]">—</span>
            <TeamScore
              name={match.away_team_name}
              score={match.away_score}
              tone="away"
            />
          </div>
          <p className="text-center text-xs text-[#5C6570]">
            {[
              match.group_name,
              formatPublicDate(match.scheduled_at),
              sportLabel(match.sport_key),
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
      )}
    </section>
  );
}

type RolCtaCardProps = {
  orgSlug: string;
};

export function RolCtaCard({ orgSlug }: RolCtaCardProps) {
  return (
    <section className="border border-[#D0D5DB] bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0A0A0A]">Rol de juegos</h2>
          <p className="mt-1 text-sm text-[#5C6570]">
            Consulta todos los próximos partidos de la organización.
          </p>
        </div>
        <Link
          href={`/p/${orgSlug}/rol`}
          className="inline-flex h-9 items-center justify-center rounded-sm bg-[#00B7FF] px-4 text-sm font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
        >
          Ver rol completo →
        </Link>
      </div>
    </section>
  );
}

type PublicMatchesListProps = {
  matches: PublicMatch[];
  emptyTitle: string;
  emptyDescription: string;
  showScore?: boolean;
};

export function PublicMatchesList({
  matches,
  emptyTitle,
  emptyDescription,
  showScore = false,
}: PublicMatchesListProps) {
  if (matches.length === 0) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">{emptyTitle}</p>
        <p className="mt-1 text-sm text-[#5C6570]">{emptyDescription}</p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-[#D0D5DB] border border-[#D0D5DB] bg-white">
      {matches.map((match) => (
        <li
          key={match.id}
          className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0 space-y-1">
            <p className="text-sm font-semibold text-[#0A0A0A]">
              {match.home_team_name}
              <span className="mx-1.5 font-normal text-[#5C6570]">vs</span>
              {match.away_team_name}
            </p>
            <p className="text-xs text-[#5C6570]">
              {[
                sportLabel(match.sport_key),
                BRANCH_LABELS[match.branch],
                match.category_name,
                match.group_name,
                match.jornada != null ? `J${match.jornada}` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <p className="text-xs text-[#5C6570]">
              {formatPublicWhen(match.scheduled_at)}
              {match.venue ? ` · ${match.venue}` : ""}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            {showScore || match.status === "finalizado" ? (
              <p className="font-mono text-sm font-bold tabular-nums text-[#0A0A0A]">
                {match.home_score} – {match.away_score}
              </p>
            ) : null}
            <MatchStatusBadge status={match.status} />
            <span className="sr-only">{MATCH_STATUS_LABELS[match.status]}</span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function TeamBlock({
  name,
  align,
}: {
  name: string;
  align: "left" | "right";
}) {
  return (
    <div
      className={
        align === "right"
          ? "flex flex-col items-end gap-2 text-right"
          : "flex flex-col items-start gap-2 text-left"
      }
    >
      <span
        aria-hidden
        className="flex size-12 items-center justify-center rounded-sm bg-[#0A0A0A] font-mono text-sm font-bold text-white"
      >
        {teamInitials(name)}
      </span>
      <p className="max-w-[10rem] text-sm font-semibold leading-tight text-[#0A0A0A] sm:max-w-none">
        {name}
      </p>
    </div>
  );
}

function TeamScore({
  name,
  score,
  tone,
}: {
  name: string;
  score: number;
  tone: "home" | "away";
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      {tone === "home" ? (
        <>
          <span className="truncate text-sm font-medium text-[#0A0A0A]">
            {name}
          </span>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[#00B7FF] font-mono text-[0.6875rem] font-bold text-[#0A0A0A]"
          >
            {teamInitials(name)}
          </span>
          <span className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {score}
          </span>
        </>
      ) : (
        <>
          <span className="font-mono text-2xl font-bold tabular-nums text-[#0A0A0A]">
            {score}
          </span>
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-[#FF2D95] font-mono text-[0.6875rem] font-bold text-white"
          >
            {teamInitials(name)}
          </span>
          <span className="truncate text-sm font-medium text-[#0A0A0A]">
            {name}
          </span>
        </>
      )}
    </div>
  );
}
