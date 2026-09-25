"use client";

import { useActionState } from "react";
import {
  acceptInviteAction,
  type JoinActionState,
} from "@/app/join/[token]/actions";
import { Button } from "@/components/ui/button";

const initialState: JoinActionState = { error: null };

type AcceptInviteFormProps = {
  token: string;
};

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [state, formAction, pending] = useActionState(
    acceptInviteAction,
    initialState
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="token" value={token} />

      {state.error ? (
        <p
          role="alert"
          className="rounded-md border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive"
        >
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="rounded-full">
        {pending ? "Entrando…" : "Aceptar invitación"}
      </Button>
    </form>
  );
}
