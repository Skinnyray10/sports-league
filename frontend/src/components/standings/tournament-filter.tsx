"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export type TournamentFilterOption = {
  id: string;
  name: string;
  season: string;
};

type TournamentFilterProps = {
  orgSlug: string;
  tournaments: TournamentFilterOption[];
  selectedId: string | null;
};

export function TournamentFilter({
  orgSlug,
  tournaments,
  selectedId,
}: TournamentFilterProps) {
  const router = useRouter();

  if (tournaments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay torneos. Crea uno para ver su tabla de posiciones.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Label htmlFor="standings-tournament" className="text-muted-foreground">
        Torneo
      </Label>
      <select
        id="standings-tournament"
        value={selectedId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          const href = value
            ? `/${orgSlug}/standings?tournament=${encodeURIComponent(value)}`
            : `/${orgSlug}/standings`;
          router.push(href);
        }}
        className="h-8 min-w-[12rem] rounded-[4px] border border-border bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
      >
        <option value="">Elige un torneo</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.season})
          </option>
        ))}
      </select>
    </div>
  );
}
