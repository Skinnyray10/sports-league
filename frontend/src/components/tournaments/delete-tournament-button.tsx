"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { deleteTournament } from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type DeleteTournamentButtonProps = {
  orgSlug: string;
  tournamentId: string;
  tournamentName: string;
};

export function DeleteTournamentButton({
  orgSlug,
  tournamentId,
  tournamentName,
}: DeleteTournamentButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTournament(orgSlug, tournamentId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/${orgSlug}/tournaments`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={<Button variant="destructive" className="rounded-[2px]" />}
      >
        <Trash2Icon data-icon="inline-start" />
        Eliminar
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar {tournamentName}?</DialogTitle>
          <DialogDescription>
            Se borra el torneo junto con sus inscripciones y no se puede
            deshacer. Si ya tiene partidos registrados, primero tendrás que
            eliminarlos.
          </DialogDescription>
        </DialogHeader>
        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        <DialogFooter className="rounded-b-[4px]">
          <Button
            type="button"
            variant="outline"
            className="rounded-[2px]"
            disabled={pending}
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="destructive"
            className="rounded-[2px]"
            disabled={pending}
            onClick={onConfirm}
          >
            {pending ? "Eliminando…" : "Eliminar torneo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
