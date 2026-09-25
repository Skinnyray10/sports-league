"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon } from "lucide-react";
import { updatePendingPlayer } from "@/app/(app)/[orgSlug]/players/actions";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type EditPlayerDialogProps = {
  orgSlug: string;
  registrationId: string;
  defaults: {
    firstNames: string;
    lastNames: string;
    idNumber: string | null;
    classification: string | null;
    photoUrl: string | null;
    jerseyNumber: number | null;
  };
};

export function EditPlayerDialog({
  orgSlug,
  registrationId,
  defaults,
}: EditPlayerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updatePendingPlayer(
        orgSlug,
        registrationId,
        formData
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            className="rounded-[2px]"
          />
        }
      >
        <PencilIcon data-icon="inline-start" />
        Editar
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Editar jugador</DialogTitle>
          <DialogDescription>
            Solo mientras la credencial sigue pendiente de aprobación.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`edit-first-${registrationId}`}>Nombre(s)</Label>
              <Input
                id={`edit-first-${registrationId}`}
                name="first_names"
                required
                maxLength={80}
                defaultValue={defaults.firstNames}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-last-${registrationId}`}>Apellido(s)</Label>
              <Input
                id={`edit-last-${registrationId}`}
                name="last_names"
                required
                maxLength={80}
                defaultValue={defaults.lastNames}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-id-${registrationId}`}>Identificación</Label>
            <Input
              id={`edit-id-${registrationId}`}
              name="id_number"
              maxLength={40}
              defaultValue={defaults.idNumber ?? ""}
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor={`edit-class-${registrationId}`}>
                Clasificación
              </Label>
              <Input
                id={`edit-class-${registrationId}`}
                name="classification"
                maxLength={40}
                defaultValue={defaults.classification ?? ""}
                className="rounded-[4px]"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor={`edit-jersey-${registrationId}`}>Playera</Label>
              <Input
                id={`edit-jersey-${registrationId}`}
                name="jersey_number"
                type="number"
                min={1}
                defaultValue={defaults.jerseyNumber ?? ""}
                className="rounded-[4px] font-mono tabular-nums"
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-photo-${registrationId}`}>URL de la foto</Label>
            <Input
              id={`edit-photo-${registrationId}`}
              name="photo_url"
              type="url"
              defaultValue={defaults.photoUrl ?? ""}
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          {error ? (
            <p className="text-sm text-[#DC2626]" role="alert">
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
              type="submit"
              className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
              disabled={pending}
            >
              {pending ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
