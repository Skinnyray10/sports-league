import {
  StandingsTable,
  toStandingRow,
} from "@/components/standings/standings-table";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { PublicScorer, PublicStanding } from "@/lib/public-org";

type PublicStandingsProps = {
  rows: PublicStanding[];
};

type DivisionBucket = {
  key: string;
  title: string;
  sportKey: string;
  rows: PublicStanding[];
};

function groupStandings(rows: PublicStanding[]): DivisionBucket[] {
  const map = new Map<string, DivisionBucket>();
  for (const row of rows) {
    const key = `${row.division_id}:${row.group_id ?? "all"}`;
    const existing = map.get(key);
    if (existing) {
      existing.rows.push(row);
      continue;
    }
    map.set(key, {
      key,
      sportKey: row.sport_key,
      title: [
        sportLabel(row.sport_key),
        BRANCH_LABELS[row.branch],
        row.category_name || null,
        row.group_name,
      ]
        .filter(Boolean)
        .join(" · "),
      rows: [row],
    });
  }
  return [...map.values()];
}

export function PublicStandingsSections({ rows }: PublicStandingsProps) {
  const buckets = groupStandings(rows);

  if (buckets.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          La tabla todavía está vacía
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aparecerá cuando haya partidos finalizados en una organización
          pública.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {buckets.map((bucket) => {
        const sorted = [...bucket.rows].sort((a, b) => {
          if (Number(b.puntos) !== Number(a.puntos)) {
            return Number(b.puntos) - Number(a.puntos);
          }
          return Number(b.diferencia) - Number(a.diferencia);
        });
        return (
          <section key={bucket.key} className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {bucket.title}
            </h2>
            <StandingsTable
              rows={sorted.map(toStandingRow)}
              hasTournament
            />
          </section>
        );
      })}
    </div>
  );
}

type PublicScorersProps = {
  scorers: PublicScorer[];
};

export function PublicScorersTable({ scorers }: PublicScorersProps) {
  if (scorers.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">Sin goleo aún</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Las anotaciones aparecen cuando el árbitro cierra la cédula.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-secondary text-left">
            <th className="px-3 py-2 font-medium text-foreground">#</th>
            <th className="px-3 py-2 font-medium text-foreground">Jugador</th>
            <th className="px-3 py-2 font-medium text-foreground">Equipo</th>
            <th className="px-3 py-2 font-medium text-foreground">División</th>
            <th className="px-3 py-2 text-right font-medium text-foreground">
              Anotaciones
            </th>
          </tr>
        </thead>
        <tbody>
          {scorers.map((row, index) => (
              <tr
                key={row.player_registration_id}
                className="border-b border-border last:border-0"
              >
                <td className="px-3 py-2 font-mono text-muted-foreground">
                  {index + 1}
                </td>
                <td className="px-3 py-2 font-medium text-foreground">
                  {row.first_names} {row.last_names}
                </td>
                <td className="px-3 py-2 text-muted-foreground">{row.team_name}</td>
                <td className="px-3 py-2 text-muted-foreground">
                  {[
                    sportLabel(row.sport_key),
                    BRANCH_LABELS[row.branch],
                    row.category_name || null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </td>
                <td className="px-3 py-2 text-right font-mono font-bold tabular-nums text-foreground">
                  {row.anotaciones ?? 0}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
