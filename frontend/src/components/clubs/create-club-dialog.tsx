"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { PlusIcon } from "lucide-react";
import { createClub } from "@/app/(app)/[orgSlug]/clubs/actions";
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

type CreateClubDialogProps = {
  orgSlug: string;
  /** Texto del botón; por defecto «Agregar …». */
  label?: string;
};

export function CreateClubDialog({ orgSlug, label }: CreateClubDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await createClub(orgSlug, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Club creado.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button data-guia="club" />
        }
      >
        <PlusIcon data-icon="inline-start" />
        {label ?? "Agregar club"}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md" showCloseButton>
        <DialogHeader>
          <DialogTitle>Agregar club</DialogTitle>
          <DialogDescription>
            El club agrupa equipos. Después creas equipos ligados a un club y
            una división.
          </DialogDescription>
        </DialogHeader>
        <form action={onSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="club-name">Nombre</Label>
            <Input
              id="club-name"
              name="name"
              required
              maxLength={80}
              placeholder="Ej. Club Norte"
              disabled={pending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="club-logo">URL del logo (opcional)</Label>
            <Input
              id="club-logo"
              name="logo_url"
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
              {pending ? "Guardando…" : "Crear club"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
