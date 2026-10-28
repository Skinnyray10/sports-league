import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  /** El siguiente paso, normalmente un botón grande. */
  action?: ReactNode;
};

/** Pantalla vacía que explica qué va aquí y ofrece el primer paso. */
export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <p className="font-heading text-lg font-extrabold text-foreground">{title}</p>
      <p className="max-w-sm text-[0.9375rem] text-muted-foreground">{description}</p>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
