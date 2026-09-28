"use client";

import { useActionState, useState } from "react";
import {
  createOrganizationAction,
  type OnboardingActionState,
} from "@/app/onboarding/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: OnboardingActionState = { error: null };

function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export function CreateOrgForm() {
  const [state, formAction, pending] = useActionState(
    createOrganizationAction,
    initialState
  );
  const [name, setName] = useState("");
  // `null` mientras el slug siga derivándose del nombre.
  const [slugOverride, setSlugOverride] = useState<string | null>(null);
  const slug = slugOverride ?? toSlug(name);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="name">Nombre de la organización</Label>
        <Input
          id="name"
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Liga Municipal de Voleibol"
          className="rounded-md bg-card"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="slug">Dirección web</Label>
        <Input
          id="slug"
          name="slug"
          required
          value={slug}
          onChange={(e) => setSlugOverride(toSlug(e.target.value))}
          placeholder="liga-municipal-voleibol"
          className="rounded-md bg-card font-mono text-[0.875rem]"
          aria-describedby="slug-hint"
          disabled={pending}
        />
        <p id="slug-hint" className="text-xs text-muted-foreground">
          La armamos desde el nombre, pero puedes cambiarla. Tu organización
          vivirá en{" "}
          <span className="font-mono text-foreground">/{slug || "…"}</span>
        </p>
      </div>

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Creando…" : "Crear organización"}
      </Button>
    </form>
  );
}
