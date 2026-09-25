import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type StandingRow = {
  teamId: string;
  teamName: string;
  jugados: number;
  ganados: number;
  perdidos: number;
  empatados: number;
  empates_ganados: number;
  empates_perdidos: number;
  a_favor: number;
  en_contra: number;
  diferencia: number;
  puntos: number;
};

type StandingsTableProps = {
  rows: StandingRow[];
  hasTournament: boolean;
};

export function toStandingRow(row: {
  team_id: string;
  team_name: string;
  jugados: number;
  ganados: number;
  perdidos: number;
  empatados: number;
  empates_ganados: number;
  empates_perdidos: number;
  a_favor: number;
  en_contra: number;
  diferencia: number;
  puntos: number;
}): StandingRow {
  return {
    teamId: row.team_id,
    teamName: row.team_name,
    jugados: Number(row.jugados),
    ganados: Number(row.ganados),
    perdidos: Number(row.perdidos),
    empatados: Number(row.empatados),
    empates_ganados: Number(row.empates_ganados),
    empates_perdidos: Number(row.empates_perdidos),
    a_favor: Number(row.a_favor),
    en_contra: Number(row.en_contra),
    diferencia: Number(row.diferencia),
    puntos: Number(row.puntos),
  };
}

export function StandingsTable({ rows, hasTournament }: StandingsTableProps) {
  if (!hasTournament) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">Elige un torneo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          La tabla se calcula por torneo, a partir de sus partidos finalizados.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
        <p className="text-base font-medium text-foreground">
          La tabla todavía está vacía
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Aparecerá cuando haya equipos en una división y al menos un partido
          finalizado.
        </p>
      </div>
    );
  }

  const sorted = [...rows].sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.diferencia !== a.diferencia) return b.diferencia - a.diferencia;
    return a.teamName.localeCompare(b.teamName, "es");
  });

  const cols: { key: keyof StandingRow; label: string; title: string }[] = [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "empatados", label: "J.E.", title: "Empatados" },
    { key: "empates_ganados", label: "J.E.G.", title: "Empates ganados" },
    { key: "empates_perdidos", label: "J.E.P.", title: "Empates perdidos" },
    { key: "a_favor", label: "A.F.", title: "A favor" },
    { key: "en_contra", label: "E.C.", title: "En contra" },
    { key: "diferencia", label: "DIF.", title: "Diferencia" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ];

  return (
    <div className="overflow-x-auto border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-secondary w-12 text-foreground">#</TableHead>
            <TableHead className="bg-secondary text-foreground">Equipo</TableHead>
            {cols.map((c) => (
              <TableHead
                key={c.key}
                className="bg-secondary text-right text-foreground"
              >
                <abbr title={c.title} className="no-underline">
                  {c.label}
                </abbr>
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.map((row, i) => (
            <TableRow key={row.teamId}>
              <TableCell className="font-mono text-muted-foreground">
                {i + 1}
              </TableCell>
              <TableCell className="font-medium">{row.teamName}</TableCell>
              {cols.map((c) => (
                <TableCell
                  key={c.key}
                  className="text-right font-mono tabular-nums"
                >
                  {row[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
