import type { MatchStatus } from "@/types/database";
import { cn } from "cn";
import { MATCH_STATUS_LABELS } from "@/lib/labels";

const STATUS_CLASS: Record<MatchStatus, string> = {
  programado: "bg-secondary text-muted-foreground border border-border",
  en_vivo: "bg-[color-mix(in_oklab,var(--status-live)_18%,transparent)] text-[color-mix(in_oklab,var(--status-live)_85%,black)] border border-[color-mix(in_oklab,var(--status-live)_35%,transparent)]",
  finalizado:
    "bg-[color-mix(in_oklab,var(--status-final)_16%,transparent)] text-[color-mix(in_oklab,var(--status-final)_90%,black)] border border-[color-mix(in_oklab,var(--status-final)_30%,transparent)]",
  aplazado:
    "bg-[color-mix(in_oklab,var(--status-live)_12%,transparent)] text-[color-mix(in_oklab,var(--status-live)_80%,black)] border border-[color-mix(in_oklab,var(--status-live)_28%,transparent)]",
  cancelado: "bg-destructive/10 text-destructive border border-destructive/25",
};

export function MatchStatusBadge({
  status,
  className,
}: {
  status: MatchStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        STATUS_CLASS[status],
        className
      )}
    >
      {MATCH_STATUS_LABELS[status]}
    </span>
  );
}

export function matchStatusLabel(status: MatchStatus): string {
  return MATCH_STATUS_LABELS[status];
}
