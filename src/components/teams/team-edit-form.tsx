"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateTeam } from "@/app/(app)/[orgSlug]/teams/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      router.refresh();
    });
  }

  return (
    <form action={onSubmit} className="grid max-w-lg gap-4">
      <div className="grid gap-2">
        <Label htmlFor="edit-team-name">Name</Label>
        <Input
          id="edit-team-name"
          name="name"
          required
          maxLength={80}
          defaultValue={initialName}
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="edit-team-logo">Logo URL (optional)</Label>
        <Input
          id="edit-team-logo"
          name="logo_url"
          type="url"
          defaultValue={initialLogoUrl ?? ""}
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
      <div>
        <Button
          type="submit"
          className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
          disabled={pending}
        >
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
