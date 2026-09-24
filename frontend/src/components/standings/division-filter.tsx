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
      <p className="text-sm text-[#5C6570]">
        Todavía no hay divisiones. Crea un torneo con divisiones para ver
        posiciones.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Label htmlFor="standings-division" className="text-[#5C6570]">
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
        className="h-8 min-w-[16rem] max-w-full rounded-[4px] border border-[#D0D5DB] bg-white px-2.5 text-sm text-[#0A0A0A] outline-none focus-visible:border-[#00B7FF] focus-visible:ring-2 focus-visible:ring-[#00B7FF]/35"
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
