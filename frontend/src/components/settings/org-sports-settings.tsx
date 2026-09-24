"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateOrgSport } from "@/app/(app)/[orgSlug]/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sportLabel } from "@/lib/labels";

export type OrgSportRow = {
  id: string;
  active: boolean;
  points_win: number | null;
  points_draw: number | null;
  points_loss: number | null;
  points_shootout_win: number | null;
  points_shootout_loss: number | null;
  draw_requires_shootout: boolean | null;
  sport: {
    key: string;
    name: string;
    points_win: number;
    points_draw: number;
    points_loss: number;
    points_shootout_win: number;
    points_shootout_loss: number;
    draw_requires_shootout: boolean;
  };
};

type OrgSportsSettingsProps = {
  orgSlug: string;
  orgSports: OrgSportRow[];
};

function pointValue(
  override: number | null,
  fallback: number
): string {
  return String(override ?? fallback);
}

function OrgSportCard({
  orgSlug,
  row,
}: {
  orgSlug: string;
  row: OrgSportRow;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const sport = row.sport;

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrgSport(orgSlug, row.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      action={onSubmit}
      className="grid gap-4 border border-[#D0D5DB] bg-white p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-[#0A0A0A]">
          {sportLabel(sport.key) || sportLabel(sport.name)}
        </h3>
        <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
          <input
            type="checkbox"
            name="active"
            defaultChecked={row.active}
            disabled={pending}
            className="size-4 rounded-[2px] border-[#D0D5DB] accent-[#00B7FF]"
          />
          Activo
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {(
          [
            ["points_win", "Victoria", sport.points_win, row.points_win],
            ["points_draw", "Empate", sport.points_draw, row.points_draw],
            ["points_loss", "Derrota", sport.points_loss, row.points_loss],
            [
              "points_shootout_win",
              "Penales G",
              sport.points_shootout_win,
              row.points_shootout_win,
            ],
            [
              "points_shootout_loss",
              "Penales P",
              sport.points_shootout_loss,
              row.points_shootout_loss,
            ],
          ] as const
        ).map(([name, label, fallback, override]) => (
          <div key={name} className="grid gap-1.5">
            <Label htmlFor={`${row.id}-${name}`} className="text-xs">
              {label}
            </Label>
            <Input
              id={`${row.id}-${name}`}
              name={name}
              type="number"
              step={1}
              defaultValue={pointValue(override, fallback)}
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
        <input
          type="checkbox"
          name="draw_requires_shootout"
          defaultChecked={
            row.draw_requires_shootout ?? sport.draw_requires_shootout
          }
          disabled={pending}
          className="size-4 rounded-[2px] border-[#D0D5DB] accent-[#00B7FF]"
        />
        Empate define por penales / shootout
      </label>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="rounded-[2px]"
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar deporte"}
        </Button>
      </div>
    </form>
  );
}

export function OrgSportsSettings({
  orgSlug,
  orgSports,
}: OrgSportsSettingsProps) {
  if (orgSports.length === 0) {
    return (
      <p className="text-sm text-[#5C6570]">
        No hay deportes configurados para esta organización.
      </p>
    );
  }

  return (
    <div className="grid gap-3">
      {orgSports.map((row) => (
        <OrgSportCard key={row.id} orgSlug={orgSlug} row={row} />
      ))}
    </div>
  );
}
