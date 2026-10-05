"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";

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
      <NativeSelect
        id="standings-tournament"
        value={selectedId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          const href = value
            ? `/${orgSlug}/standings?tournament=${encodeURIComponent(value)}`
            : `/${orgSlug}/standings`;
          router.push(href);
        }}
        className="w-auto min-w-[12rem]"
      >
        <option value="">Elige un torneo</option>
        {tournaments.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.season})
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
