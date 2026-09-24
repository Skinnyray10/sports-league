"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateOrganization } from "@/app/(app)/[orgSlug]/settings/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OrgSettingsFormProps = {
  orgSlug: string;
  initial: {
    name: string;
    tagline: string | null;
    logoUrl: string | null;
    isPublic: boolean;
  };
};

export function OrgSettingsForm({ orgSlug, initial }: OrgSettingsFormProps) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrganization(orgSlug, formData);
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
        <Label htmlFor="org-name">Nombre</Label>
        <Input
          id="org-name"
          name="name"
          required
          maxLength={100}
          defaultValue={initial.name}
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="org-tagline">Eslogan (opcional)</Label>
        <Input
          id="org-tagline"
          name="tagline"
          maxLength={160}
          defaultValue={initial.tagline ?? ""}
          placeholder="Ej. Liga amateur del norte"
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="org-logo">URL del logo (opcional)</Label>
        <Input
          id="org-logo"
          name="logo_url"
          type="url"
          defaultValue={initial.logoUrl ?? ""}
          placeholder="https://"
          className="rounded-[4px]"
          disabled={pending}
        />
      </div>
      <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
        <input
          type="checkbox"
          name="is_public"
          defaultChecked={initial.isPublic}
          disabled={pending}
          className="size-4 rounded-[2px] border-[#D0D5DB] accent-[#00B7FF]"
        />
        Organización pública (visible sin iniciar sesión)
      </label>
      {initial.isPublic ? (
        <p className="text-sm text-[#5C6570]">
          Vista pública:{" "}
          <a
            href={`/p/${orgSlug}`}
            className="font-mono text-[#00B7FF] hover:underline"
            target="_blank"
            rel="noreferrer"
          >
            /p/{orgSlug}
          </a>
        </p>
      ) : null}
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
          {pending ? "Guardando…" : "Guardar organización"}
        </Button>
      </div>
    </form>
  );
}
