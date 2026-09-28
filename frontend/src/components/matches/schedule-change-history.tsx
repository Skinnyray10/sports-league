import type { ScheduleChangeType, MatchStatus } from "@/types/database";
import {
  MATCH_STATUS_LABELS,
  SCHEDULE_CHANGE_LABELS,
} from "@/lib/labels";

export type ScheduleChangeRow = {
  id: string;
  changeType: ScheduleChangeType;
  reason: string | null;
  previousScheduledAt: string | null;
  newScheduledAt: string | null;
  previousVenue: string | null;
  newVenue: string | null;
  previousStatus: MatchStatus | null;
  newStatus: MatchStatus | null;
  createdAt: string;
};

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function ScheduleChangeHistory({
  changes,
}: {
  changes: ScheduleChangeRow[];
}) {
  if (changes.length === 0) {
    return (
      <section className="border border-border bg-card p-5">
        <h2 className="text-base font-semibold text-foreground">
          Historial de programación
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Todavía no hay aplazamientos, cancelaciones ni reprogramaciones.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">
        Historial de programación
      </h2>
      <ul className="mt-4 grid gap-3">
        {changes.map((change) => (
          <li
            key={change.id}
            className="border-l-2 border-primary pl-3 text-sm"
          >
            <p className="font-medium text-foreground">
              {SCHEDULE_CHANGE_LABELS[change.changeType]}
              <span className="ml-2 font-normal text-muted-foreground">
                {formatWhen(change.createdAt)}
              </span>
            </p>
            {change.reason ? (
              <p className="mt-0.5 text-muted-foreground">{change.reason}</p>
            ) : null}
            <p className="mt-1 font-mono text-xs tabular-nums text-muted-foreground">
              {change.changeType === "reprogramar" ? (
                <>
                  {formatWhen(change.previousScheduledAt)} →{" "}
                  {formatWhen(change.newScheduledAt)}
                  {change.previousVenue !== change.newVenue
                    ? ` · ${change.previousVenue ?? "—"} → ${change.newVenue ?? "—"}`
                    : ""}
                </>
              ) : (
                <>
                  {change.previousStatus
                    ? MATCH_STATUS_LABELS[change.previousStatus]
                    : "—"}{" "}
                  →{" "}
                  {change.newStatus
                    ? MATCH_STATUS_LABELS[change.newStatus]
                    : "—"}
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
