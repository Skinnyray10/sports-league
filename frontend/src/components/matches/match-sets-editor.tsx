"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon, Trash2Icon } from "lucide-react";
import {
  deleteMatchSet,
  upsertMatchSet,
} from "@/app/(app)/[orgSlug]/matches/actions";
import type { Tables } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type MatchSet = Tables<"match_sets">;

type MatchSetsEditorProps = {
  orgSlug: string;
  matchId: string;
  sets: MatchSet[];
  canEdit: boolean;
};

export function MatchSetsEditor({
  orgSlug,
  matchId,
  sets,
  canEdit,
}: MatchSetsEditorProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const nextSetNumber =
    sets.reduce((max, s) => Math.max(max, s.set_number), 0) + 1;

  function onAdd(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertMatchSet(orgSlug, matchId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onUpdate(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await upsertMatchSet(orgSlug, matchId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function onDelete(setId: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteMatchSet(orgSlug, matchId, setId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section className="border border-border bg-card p-5">
      <h2 className="text-base font-semibold text-foreground">Sets</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Captura el parcial de cada set. El marcador del partido sigue siendo la
        cantidad de sets ganados por cada equipo.
      </p>

      {sets.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">
          Todavía no capturas ningún set.
        </p>
      ) : (
        <div className="mt-4 overflow-hidden border border-border">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="bg-secondary text-foreground">Set</TableHead>
                <TableHead className="bg-secondary text-foreground">
                  Local
                </TableHead>
                <TableHead className="bg-secondary text-foreground">
                  Visitante
                </TableHead>
                {canEdit ? (
                  <TableHead className="bg-secondary text-right text-foreground">
                    Acciones
                  </TableHead>
                ) : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {sets.map((set) =>
                canEdit ? (
                  <TableRow key={set.id}>
                    <TableCell colSpan={4} className="p-3">
                      <form
                        action={onUpdate}
                        className="flex flex-wrap items-end gap-3"
                      >
                        <input type="hidden" name="set_id" value={set.id} />
                        <div className="grid gap-1">
                          <Label className="text-xs">#</Label>
                          <Input
                            name="set_number"
                            type="number"
                            min={1}
                            required
                            defaultValue={set.set_number}
                            className="w-16 rounded-[4px] font-mono tabular-nums"
                            disabled={pending}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Local</Label>
                          <Input
                            name="home_set_score"
                            type="number"
                            min={0}
                            required
                            defaultValue={set.home_set_score}
                            className="w-20 rounded-[4px] font-mono tabular-nums"
                            disabled={pending}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label className="text-xs">Visitante</Label>
                          <Input
                            name="away_set_score"
                            type="number"
                            min={0}
                            required
                            defaultValue={set.away_set_score}
                            className="w-20 rounded-[4px] font-mono tabular-nums"
                            disabled={pending}
                          />
                        </div>
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-[2px]"
                          disabled={pending}
                        >
                          Guardar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="rounded-[2px] text-[#DC2626]"
                          disabled={pending}
                          onClick={() => onDelete(set.id)}
                        >
                          <Trash2Icon />
                          Quitar
                        </Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ) : (
                  <TableRow key={set.id}>
                    <TableCell className="font-mono tabular-nums">
                      {set.set_number}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {set.home_set_score}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {set.away_set_score}
                    </TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {canEdit ? (
        <form action={onAdd} className="mt-4 flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <Label htmlFor="new-set-number" className="text-xs">
              Set #
            </Label>
            <Input
              id="new-set-number"
              name="set_number"
              type="number"
              min={1}
              required
              defaultValue={nextSetNumber}
              className="w-16 rounded-[4px] font-mono tabular-nums"
              disabled={pending}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="new-home-set" className="text-xs">
              Local
            </Label>
            <Input
              id="new-home-set"
              name="home_set_score"
              type="number"
              min={0}
              required
              defaultValue={0}
              className="w-20 rounded-[4px] font-mono tabular-nums"
              disabled={pending}
            />
          </div>
          <div className="grid gap-1">
            <Label htmlFor="new-away-set" className="text-xs">
              Visitante
            </Label>
            <Input
              id="new-away-set"
              name="away_set_score"
              type="number"
              min={0}
              required
              defaultValue={0}
              className="w-20 rounded-[4px] font-mono tabular-nums"
              disabled={pending}
            />
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={pending}
            className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
          >
            <PlusIcon data-icon="inline-start" />
            Agregar set
          </Button>
        </form>
      ) : null}

      {error ? (
        <p className="mt-3 text-sm text-[#DC2626]" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
