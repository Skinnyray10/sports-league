"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signIn, type AuthActionState } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, notice: null };

type LoginFormProps = {
  next?: string;
};

export function LoginForm({ next }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(signIn, initialState);
  const invalid = (field: "email" | "password") =>
    state.error && (state.field === field || !state.field) ? true : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="tu@liga.mx"
          defaultValue={state.values?.email ?? ""}
          aria-invalid={invalid("email")}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-11 rounded-full bg-card"
          disabled={pending}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <Label htmlFor="password">Contraseña</Label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="current-password"
          required
          aria-invalid={invalid("password")}
          aria-describedby={state.error ? "login-error" : undefined}
          className="h-11 rounded-full bg-card"
          disabled={pending}
        />
      </div>

      <Turnstile resetKey={state} />

      <FormAlert id="login-error" error={state.error} notice={state.notice} />

      <Button type="submit" disabled={pending} className="h-11 rounded-full">
        {pending ? "Entrando…" : "Iniciar sesión"}
      </Button>

      <p className="text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link
          href={next ? `/signup?next=${encodeURIComponent(next)}` : "/signup"}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Crea una
        </Link>
      </p>
    </form>
  );
}
