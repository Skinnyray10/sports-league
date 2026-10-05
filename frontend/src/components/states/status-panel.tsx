import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type StatusPanelProps = {
  eyebrow?: string;
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  className?: string;
  /** El encabezado de página ya existe (p. ej. dentro de un layout con h1). */
  headingLevel?: "h1" | "h2";
};

export function StatusPanel({
  eyebrow,
  title,
  description,
  actions,
  className,
  headingLevel = "h1",
}: StatusPanelProps) {
  const Heading = headingLevel;
  return (
    <section
      className={cn(
        "mx-auto flex w-full max-w-md flex-col gap-4 rounded-xl border border-border bg-card p-6 text-left",
        className
      )}
    >
      <div className="h-1 w-12 rounded-full bg-primary" aria-hidden />
      {eyebrow ? (
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <Heading className="font-heading text-2xl font-extrabold tracking-tight text-foreground">
        {title}
      </Heading>
      <div className="text-[0.9375rem] leading-relaxed text-muted-foreground">
        {description}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
