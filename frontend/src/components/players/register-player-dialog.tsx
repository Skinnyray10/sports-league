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
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Registrar jugador
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md" showCloseButton>
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
                className="rounded-[4px]"
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
                className="rounded-[4px]"
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
              className="rounded-[4px]"
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
                className="rounded-[4px]"
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
                className="rounded-[4px] font-mono tabular-nums"
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
              className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
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
