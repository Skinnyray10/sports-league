"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PencilIcon, Trash2Icon } from "lucide-react";
import {
  deleteClub,
  updateClub,
} from "@/app/(app)/[orgSlug]/clubs/actions";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Tables } from "@/types/database";

type Club = Tables<"clubs">;

type ClubsTableProps = {
  orgSlug: string;
  clubs: Club[];
};

function EditClubDialog({
  orgSlug,
  club,
}: {
  orgSlug: string;
  club: Club;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateClub(orgSlug, club.id, formData);
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
          <Button variant="outline" size="sm" className="rounded-[2px]" />
        }
      >
        <PencilIcon data-icon="inline-start" />
        Editar
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Editar club</DialogTitle>
          <DialogDescription>
            Los cambios se reflejan en los equipos de este club.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor={`edit-club-name-${club.id}`}>Nombre</Label>
            <Input
              id={`edit-club-name-${club.id}`}
              name="name"
              required
              maxLength={80}
              defaultValue={club.name}
              className="rounded-[4px]"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor={`edit-club-logo-${club.id}`}>
              URL del logo (opcional)
            </Label>
            <Input
              id={`edit-club-logo-${club.id}`}
              name="logo_url"
              type="url"
              defaultValue={club.logo_url ?? ""}
              placeholder="https://"
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
              className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
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

function DeleteClubButton({
  orgSlug,
  club,
}: {
  orgSlug: string;
  club: Club;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await deleteClub(orgSlug, club.id);
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
            variant="ghost"
            size="sm"
            className="rounded-[2px] text-destructive hover:bg-destructive/10 hover:text-destructive"
          />
        }
      >
        <Trash2Icon data-icon="inline-start" />
        Eliminar
      </DialogTrigger>
      <DialogContent className="rounded-[4px] sm:max-w-md">
        <DialogHeader>
          <DialogTitle>¿Eliminar {club.name}?</DialogTitle>
          <DialogDescription>
            Si el club ya tiene equipos, primero tendrás que eliminarlos o
            moverlos.
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
            {pending ? "Eliminando…" : "Eliminar club"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function ClubsTable({ orgSlug, clubs }: ClubsTableProps) {
  if (clubs.length === 0) {
    return (
      <div className="border border-dashed border-[#D0D5DB] bg-white px-6 py-12 text-center">
        <p className="text-base font-medium text-[#0A0A0A]">
          Todavía no hay clubes
        </p>
        <p className="mt-1 text-sm text-[#5C6570]">
          Agrega el primer club para poder crear equipos.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-[#D0D5DB] bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Club</TableHead>
            <TableHead className="bg-[#E6E9EC] text-[#0A0A0A]">Logo</TableHead>
            <TableHead className="bg-[#E6E9EC] text-right text-[#0A0A0A]">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clubs.map((club) => (
            <TableRow key={club.id}>
              <TableCell className="font-medium text-[#0A0A0A]">
                {club.name}
              </TableCell>
              <TableCell className="text-xs text-[#5C6570]">
                {club.logo_url ? "Cargado" : "Sin logo"}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <EditClubDialog orgSlug={orgSlug} club={club} />
                  <DeleteClubButton orgSlug={orgSlug} club={club} />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
