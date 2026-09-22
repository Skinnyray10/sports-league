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
  pj: number;
  g: number;
  e: number;
  p: number;
  gf: number;
  gc: number;
  dg: number;
  pts: number;
};

type StandingsViewRow = {
  team_id: string | null;
  team_name: string | null;
  pj: number | null;
  g: number | null;
  e: number | null;
  p: number | null;
  gf: number | null;
  gc: number | null;
  dg: number | null;
  pts: number | null;
};

type StandingsTableProps = {
  rows: StandingRow[];
  hasTournament: boolean;
};

export function StandingsTable({ rows, hasTournament }: StandingsTableProps) {
  if (!hasTournament) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">
          Elige un torneo
        </p>
        <p className="mt-1 text-sm text-[#5C6570]">
          La tabla se calcula por torneo, a partir de sus partidos finalizados.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">
          La tabla todavía está vacía
        </p>
        <p className="mt-1 text-sm text-[#5C6570]">
          Aparecerá cuando este torneo tenga equipos inscritos y al menos un
          partido marcado como finalizado.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto border border-[#D0D5DB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-[#E6E9EC] w-12 text-[#0A0A0A]">#</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">
              Equipo
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Partidos jugados" className="no-underline">
                PJ
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Ganados" className="no-underline">
                G
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Empatados" className="no-underline">
                E
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Perdidos" className="no-underline">
                P
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="A favor" className="no-underline">
                GF
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="En contra" className="no-underline">
                GC
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Diferencia" className="no-underline">
                DG
              </abbr>
            </TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              <abbr title="Puntos" className="no-underline">
                Pts
              </abbr>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, index) => (
            <TableRow key={row.teamId} className="hover:bg-[#E6E9EC]/40">
              <TableCell className="font-mono text-sm tabular-nums text-[#5C6570]">
                {index + 1}
              </TableCell>
              <TableCell className="font-medium text-[#0A0A0A]">
                {row.teamName}
              </TableCell>
              <NumCell value={row.pj} />
              <NumCell value={row.g} />
              <NumCell value={row.e} />
              <NumCell value={row.p} />
              <NumCell value={row.gf} />
              <NumCell value={row.gc} />
              <NumCell value={row.dg} />
              <TableCell className="text-right font-mono text-sm font-semibold tabular-nums text-[#0A0A0A]">
                {row.pts}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function NumCell({ value }: { value: number }) {
  return (
    <TableCell className="text-right font-mono text-sm tabular-nums text-[#0A0A0A]">
      {value}
    </TableCell>
  );
}

/** Map a standings view row into UI numbers (null-safe). */
export function toStandingRow(row: StandingsViewRow): StandingRow | null {
  if (!row.team_id) return null;
  return {
    teamId: row.team_id,
    teamName: row.team_name ?? "Equipo",
    pj: Number(row.pj ?? 0),
    g: Number(row.g ?? 0),
    e: Number(row.e ?? 0),
    p: Number(row.p ?? 0),
    gf: Number(row.gf ?? 0),
    gc: Number(row.gc ?? 0),
    dg: Number(row.dg ?? 0),
    pts: Number(row.pts ?? 0),
  };
}
