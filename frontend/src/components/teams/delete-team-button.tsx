"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Trash2Icon } from "lucide-react";
import { deleteTeam } from "@/app/(app)/[orgSlug]/teams/actions";
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

type DeleteTeamButtonProps = {
  orgSlug: string;
  teamId: string;
  teamName: string;
};

export function DeleteTeamButton({
  orgSlug,
  teamId,
  teamName,
}: DeleteTeamButtonProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteTeam(orgSlug, teamId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.push(`/${orgSlug}/teams`);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button variant="destructive" className="rounded-[2px]" />}>
        <Trash2Icon data-icon="inline-start" />
        Eliminar
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar {teamName}?</DialogTitle>
          <DialogDescription>
            El equipo sale de la organización y no se puede deshacer. Si ya
            tiene partidos registrados, primero tendrás que eliminarlos.
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
            {pending ? "Eliminando…" : "Eliminar equipo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
