"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/app/(auth)/actions";
import { FormAlert } from "@/components/auth/form-alert";
import { PasswordInput } from "@/components/auth/password-input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: AuthActionState = { error: null, notice: null };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState
  );
  const invalid = (field: "password" | "password_confirm") =>
    state.error && state.field === field ? true : undefined;

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">Nueva contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={72}
          aria-invalid={invalid("password")}
          aria-describedby="new-password-hint"
          className="h-11 rounded-full bg-card"
          disabled={pending}
        />
        <p id="new-password-hint" className="text-xs text-muted-foreground">
          Mínimo 8 caracteres, con letras y números.
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password_confirm">Repite la contraseña</Label>
        <PasswordInput
          id="password_confirm"
          name="password_confirm"
          autoComplete="new-password"
          required
          maxLength={72}
          aria-invalid={invalid("password_confirm")}
          aria-describedby={state.error ? "reset-error" : undefined}
          className="h-11 rounded-full bg-card"
          disabled={pending}
        />
      </div>

      <FormAlert id="reset-error" error={state.error} />

      <Button type="submit" disabled={pending} className="h-11 rounded-full">
        {pending ? "Guardando…" : "Guardar contraseña"}
      </Button>
    </form>
  );
}
