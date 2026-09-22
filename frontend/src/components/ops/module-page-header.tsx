import type { ReactNode } from "react";
import { cn } from "cn";

type ModuleBand = "teams" | "tournaments";

const bandClass: Record<ModuleBand, string> = {
  teams: "bg-[#FFD40D]",
  tournaments: "bg-[#FF2DA1]",
};

type ModulePageHeaderProps = {
  band: ModuleBand;
  title: string;
  description: string;
  actions?: ReactNode;
  className?: string;
};

/**
 * Operate page chrome: identity band + title + primary actions.
 * Shared shell layout is owned by Agente A; this is page-local only.
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
        "mb-6 flex flex-col gap-4 border-b border-[#D0D5DB] pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className={cn("mb-3 h-1 w-12", bandClass[band])} aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight text-[#0A0A0A]">
          {title}
        </h1>
        <p className="mt-1 max-w-prose text-[0.9375rem] text-[#5C6570]">
          {description}
        </p>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
