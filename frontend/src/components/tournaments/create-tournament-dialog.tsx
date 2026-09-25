"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createTournament } from "@/app/(app)/[orgSlug]/tournaments/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type CreateTournamentDialogProps = {
  orgSlug: string;
};

export function CreateTournamentDialog({
  orgSlug,
}: CreateTournamentDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [format, setFormat] = React.useState("round_robin");
  const [legs, setLegs] = React.useState("1");
  const [status, setStatus] = React.useState("registration");

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("format", format);
    formData.set("legs", legs);
    formData.set("status", status);

    startTransition(async () => {
      const result = await createTournament(orgSlug, formData);
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
          <Button className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        Agregar torneo
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Agregar torneo</DialogTitle>
          <DialogDescription>
            Define temporada y formato. El deporte se elige al crear cada
            división dentro del torneo.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="tournament-name">Nombre</Label>
            <Input
              id="tournament-name"
              name="name"
              required
              maxLength={100}
              placeholder="Ej. Apertura"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tournament-season">Temporada</Label>
            <Input
              id="tournament-season"
              name="season"
              required
              maxLength={40}
              placeholder="Ej. 2026"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Formato</Label>
              <Select
                value={format}
                onValueChange={(value) => setFormat(value ?? "round_robin")}
                disabled={pending}
              >
                <SelectTrigger className="w-full rounded-[4px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="round_robin">
                    Todos contra todos
                  </SelectItem>
                  <SelectItem value="knockout">
                    Eliminación directa
                  </SelectItem>
                  <SelectItem value="groups">Grupos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Vueltas</Label>
              <Select
                value={legs}
                onValueChange={(value) => setLegs(value ?? "1")}
                disabled={pending}
              >
                <SelectTrigger className="w-full rounded-[4px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Solo ida</SelectItem>
                  <SelectItem value="2">Ida y vuelta</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Estado</Label>
            <Select
              value={status}
              onValueChange={(value) => setStatus(value ?? "registration")}
              disabled={pending}
            >
              <SelectTrigger className="w-full rounded-[4px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="registration">Inscripciones</SelectItem>
                <SelectItem value="active">En curso</SelectItem>
                <SelectItem value="finished">Finalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tournament-start">Fecha de inicio (opcional)</Label>
            <Input
              id="tournament-start"
              name="start_date"
              type="date"
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
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
              type="submit"
              className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background"
              disabled={pending}
            >
              {pending ? "Guardando…" : "Crear torneo"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
