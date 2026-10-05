"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateTournament } from "@/app/(app)/[orgSlug]/tournaments/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { TournamentStatus } from "@/types/database";
import { toast } from "sonner";

type TournamentEditFormProps = {
  orgSlug: string;
  tournamentId: string;
  initial: {
    name: string;
    season: string;
    format: string;
    legs: number;
    status: TournamentStatus;
    startDate: string | null;
  };
};

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function TournamentEditForm({
  orgSlug,
  tournamentId,
  initial,
}: TournamentEditFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const [format, setFormat] = React.useState(initial.format);
  const [legs, setLegs] = React.useState(String(initial.legs));
  const [status, setStatus] = React.useState(initial.status);

  function onSubmit(formData: FormData) {
    setError(null);
    formData.set("format", format);
    formData.set("legs", legs);
    formData.set("status", status);

    startTransition(async () => {
      const result = await updateTournament(orgSlug, tournamentId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Torneo actualizado.");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-tournament-name">Nombre</Label>
        <Input
          id="edit-tournament-name"
          name="name"
          required
          maxLength={100}
          defaultValue={initial.name}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-tournament-season">Temporada</Label>
        <Input
          id="edit-tournament-season"
          name="season"
          required
          maxLength={40}
          defaultValue={initial.season}
          disabled={pending}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="grid gap-2">
          <Label htmlFor="edit-tournament-1">Formato</Label>
          <Select
            value={format}
            onValueChange={(value) => setFormat(value ?? format)}
            disabled={pending}
          >
            <SelectTrigger id="edit-tournament-1" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">Todos contra todos</SelectItem>
              <SelectItem value="knockout">Eliminación directa</SelectItem>
              <SelectItem value="groups">Grupos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="edit-tournament-2">Vueltas</Label>
          <Select
            value={legs}
            onValueChange={(value) => setLegs(value ?? legs)}
            disabled={pending}
          >
            <SelectTrigger id="edit-tournament-2" className="w-full">
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
        <Label htmlFor="edit-tournament-3">Estado</Label>
        <Select
          value={status}
          onValueChange={(value) =>
            setStatus((value as TournamentStatus) ?? status)
          }
          disabled={pending}
        >
          <SelectTrigger id="edit-tournament-3" className="w-full">
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
        <Label htmlFor="edit-tournament-start">Fecha de inicio (opcional)</Label>
        <Input
          id="edit-tournament-start"
          name="start_date"
          type="date"
          defaultValue={toDateInputValue(initial.startDate)}
          disabled={pending}
        />
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <div>
        <Button
          type="submit"
          disabled={pending}
        >
          {pending ? "Guardando…" : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
