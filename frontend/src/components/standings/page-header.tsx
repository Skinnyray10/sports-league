import { cn } from "cn";

type StandingsPageHeaderProps = {
  title: string;
  description: string;
  actions?: React.ReactNode;
  className?: string;
};

/** Standings module chrome — green identity band (DESIGN.md). */
export function StandingsPageHeader({
  title,
  description,
  actions,
  className,
}: StandingsPageHeaderProps) {
  return (
    <header
      className={cn(
        "mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="min-w-0">
        <div className="mb-3 h-1 w-12 bg-band-standings" aria-hidden />
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
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
