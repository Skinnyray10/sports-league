"use client";

import { useActionState } from "react";
import {
  requestPasswordReset,
  type AuthActionState,
} from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { Turnstile } from "@/components/auth/turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, notice: null };

export function ForgotPasswordForm() {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Correo de tu cuenta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          maxLength={254}
          placeholder="tu@liga.mx"
          defaultValue={state.values?.email ?? ""}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error || state.notice ? "forgot-status" : undefined}
          className="h-11 rounded-full bg-card"
          disabled={pending}
        />
      </div>

      <Turnstile resetKey={state} />

      <FormAlert id="forgot-status" error={state.error} notice={state.notice} />

      <Button type="submit" disabled={pending} className="h-11 rounded-full">
        {pending ? "Enviando…" : "Enviar enlace"}
      </Button>
    </form>
  );
}
