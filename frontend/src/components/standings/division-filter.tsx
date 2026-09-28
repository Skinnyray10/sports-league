"use client";

import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";

export type DivisionFilterOption = {
  id: string;
  label: string;
};

type DivisionFilterProps = {
  orgSlug: string;
  divisions: DivisionFilterOption[];
  selectedId: string | null;
};

export function DivisionFilter({
  orgSlug,
  divisions,
  selectedId,
}: DivisionFilterProps) {
  const router = useRouter();

  if (divisions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Todavía no hay divisiones. Crea un torneo con divisiones para ver
        posiciones.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Label htmlFor="standings-division" className="text-muted-foreground">
        División
      </Label>
      <select
        id="standings-division"
        value={selectedId ?? ""}
        onChange={(e) => {
          const value = e.target.value;
          const href = value
            ? `/${orgSlug}/standings?division=${encodeURIComponent(value)}`
            : `/${orgSlug}/standings`;
          router.push(href);
        }}
        className="h-8 min-w-[16rem] max-w-full rounded-[4px] border border-border bg-card px-2.5 text-sm text-foreground outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-ring/35"
      >
        <option value="">Elige una división</option>
        {divisions.map((d) => (
          <option key={d.id} value={d.id}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
}
