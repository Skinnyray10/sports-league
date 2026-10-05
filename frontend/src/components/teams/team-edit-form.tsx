"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateTeam } from "@/app/(app)/[orgSlug]/teams/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type TeamEditFormProps = {
  orgSlug: string;
  teamId: string;
  initialName: string;
  initialLogoUrl: string | null;
};

export function TeamEditForm({
  orgSlug,
  teamId,
  initialName,
  initialLogoUrl,
}: TeamEditFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateTeam(orgSlug, teamId, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      toast.success("Equipo actualizado.");
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-team-name">Nombre</Label>
        <Input
          id="edit-team-name"
          name="name"
          required
          maxLength={80}
          defaultValue={initialName}
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-team-logo">URL del logo (opcional)</Label>
        <Input
          id="edit-team-logo"
          name="logo_url"
          type="url"
          defaultValue={initialLogoUrl ?? ""}
          placeholder="https://"
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
