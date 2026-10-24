"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { toast } from "sonner";
import { createSanction } from "@/app/(app)/[orgSlug]/sanctions/actions";
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
import { NativeSelect } from "@/components/ui/native-select";

export type PlayerOption = { id: string; name: string; teamName: string };

type CreateSanctionDialogProps = {
  orgSlug: string;
  players: PlayerOption[];
};

export function CreateSanctionDialog({
  orgSlug,
  players,
}: CreateSanctionDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  const teams = Array.from(new Set(players.map((p) => p.teamName)));

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createSanction(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Castigo registrado.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button disabled={players.length === 0} />}>
        <PlusIcon data-icon="inline-start" />
        Agregar castigo
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Agregar castigo</DialogTitle>
          <DialogDescription>
            Queda en la lista de castigados de la liga.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="sanction-player">Jugador</Label>
            <NativeSelect
              id="sanction-player"
              name="registration_id"
              required
              defaultValue=""
              disabled={pending}
            >
              <option value="" disabled>
                Elige al jugador
              </option>
              {teams.map((team) => (
                <optgroup key={team} label={team}>
                  {players
                    .filter((p) => p.teamName === team)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </optgroup>
              ))}
            </NativeSelect>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="sanction-reason">Falta</Label>
            <Input
              id="sanction-reason"
              name="reason"
              required
              maxLength={300}
              placeholder="Ej. Doble amarilla"
              disabled={pending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sanction-jornada">Jornada</Label>
              <Input
                id="sanction-jornada"
                name="jornada"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="Ej. 3"
                disabled={pending}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sanction-sanction">Castigo</Label>
              <Input
                id="sanction-sanction"
                name="sanction"
                required
                maxLength={120}
                placeholder="Ej. 2 juegos"
                disabled={pending}
              />
            </div>
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
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar castigo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
