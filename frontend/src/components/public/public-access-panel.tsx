"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signOut, type AuthActionState } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, notice: null };

type PublicAccessPanelProps = {
  orgSlug: string;
  /** Si hay sesión, muestra acceso al panel operate en vez del form. */
  panelHref?: string | null;
};

export function PublicAccessPanel({
  orgSlug,
  panelHref,
}: PublicAccessPanelProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  if (panelHref) {
    return (
      <div className="space-y-3">
        <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
          Acceso
        </p>
        <p className="text-xs text-muted-foreground">
          Ya tienes sesión. Entra a tu panel o sigue consultando en público.
        </p>
        <Link
          href={panelHref}
          className="inline-flex h-8 w-full items-center justify-center rounded-full bg-primary px-2.5 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
        >
          Ir a mi panel
        </Link>
        <form action={signOut}>
          <Button
            type="submit"
            variant="outline"
            className="h-8 w-full rounded-full"
          >
            Salir
          </Button>
        </form>
        <p className="rounded-full bg-primary/20 px-2 py-1.5 text-center text-[0.75rem] font-medium text-foreground">
          Estás en la vista pública
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[0.6875rem] font-medium uppercase tracking-wide text-muted-foreground">
        Acceso
      </p>
      <form action={formAction} className="flex flex-col gap-2.5">
        <input type="hidden" name="next" value={`/${orgSlug}`} />
        <div className="flex flex-col gap-1">
          <Label htmlFor="public-email" className="sr-only">
            Correo
          </Label>
          <Input
            id="public-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="correo"
            className="h-8 rounded-full bg-card text-sm"
            disabled={pending}
          />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="public-password" className="sr-only">
            Contraseña
          </Label>
          <Input
            id="public-password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="contraseña"
            className="h-8 rounded-full bg-card text-sm"
            disabled={pending}
          />
        </div>
        {state.error ? (
          <p role="alert" className="text-xs text-destructive">
            {state.error}
          </p>
        ) : null}
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={pending}
            className="h-8 flex-1 rounded-full bg-primary text-foreground hover:bg-foreground hover:text-background"
          >
            {pending ? "…" : "Entrar"}
          </Button>
          <Link
            href="/signup"
            className="inline-flex h-8 flex-1 items-center justify-center rounded-full border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Registrarse
          </Link>
        </div>
      </form>
      <p className="text-[0.6875rem] leading-snug text-muted-foreground">
        Acceso restringido a administración, delegados y árbitros autorizados.
      </p>
      <p className="rounded-full bg-primary/20 px-2 py-1.5 text-center text-[0.75rem] font-medium text-foreground">
        Estás en la vista pública
      </p>
    </div>
  );
}
