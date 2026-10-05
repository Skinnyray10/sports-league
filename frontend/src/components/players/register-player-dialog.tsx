"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { registerPlayer } from "@/app/(app)/[orgSlug]/players/actions";
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
import { toast } from "sonner";

type RegisterPlayerDialogProps = {
  orgSlug: string;
};

export function RegisterPlayerDialog({ orgSlug }: RegisterPlayerDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await registerPlayer(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Jugador registrado. Queda pendiente de aprobación.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Registrar jugador
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Registrar jugador</DialogTitle>
          <DialogDescription>
            Queda en pendiente hasta que la liga apruebe la credencial.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="first_names">Nombre(s)</Label>
              <Input
                id="first_names"
                name="first_names"
                required
                maxLength={80}
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="last_names">Apellido(s)</Label>
              <Input
                id="last_names"
                name="last_names"
                required
                maxLength={80}
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="id_number">Identificación (opcional)</Label>
            <Input
              id="id_number"
              name="id_number"
              maxLength={40}
              placeholder="CURP o documento"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="classification">Clasificación</Label>
              <Input
                id="classification"
                name="classification"
                maxLength={40}
                placeholder="Ej. libre"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="jersey_number">Playera</Label>
              <Input
                id="jersey_number"
                name="jersey_number"
                type="number"
                min={1}
                className="font-mono tabular-nums"
                disabled={pending}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="photo_url">URL de la foto (opcional)</Label>
            <Input
              id="photo_url"
              name="photo_url"
              type="url"
              placeholder="https://"
              disabled={pending}
            />
          </div>
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={pending}
            >
              {pending ? "Guardando…" : "Registrar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
