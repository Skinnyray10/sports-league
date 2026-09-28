import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type ModuleBand =
  | "teams"
  | "tournaments"
  | "matches"
  | "standings"
  | "settings"
  | "clubs"
  | "players"
  | "approvals"
  | "referee";

const bandClass: Record<ModuleBand, string> = {
  teams: "bg-band-teams",
  tournaments: "bg-band-tournaments",
  matches: "bg-band-matches",
  standings: "bg-band-standings",
  settings: "bg-muted-foreground",
  clubs: "bg-band-teams",
  players: "bg-band-tournaments",
  approvals: "bg-band-matches",
  referee: "bg-band-matches",
};

type ModulePageHeaderProps = {
  band: ModuleBand;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Operate page chrome: edge accent + title + primary actions.
 */
export function ModulePageHeader({
  band,
  title,
  description,
  actions,
  className,
}: ModulePageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className={cn("mb-3 h-1 w-12 rounded-full", bandClass[band])} aria-hidden />
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
