import type { MatchStatus } from "@/types/database";
import { cn } from "cn";
import { MATCH_STATUS_LABELS } from "@/lib/labels";

const STATUS_CLASS: Record<MatchStatus, string> = {
  programado: "bg-[#E6E9EC] text-[#5C6570]",
  en_vivo: "bg-[rgba(232,93,4,0.15)] text-[#7C2D12]",
  finalizado: "bg-[rgba(31,107,74,0.15)] text-[#0B2E1F]",
  suspendido: "bg-[rgba(220,38,38,0.12)] text-[#991B1B]",
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
        "inline-flex items-center rounded-[2px] px-2 py-0.5 text-xs font-medium",
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
