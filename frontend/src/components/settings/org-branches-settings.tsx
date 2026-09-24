"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { updateOrgSportBranch } from "@/app/(app)/[orgSlug]/settings/actions";
import { Button } from "@/components/ui/button";
import { BRANCH_LABELS, sportLabel } from "@/lib/labels";
import type { Branch } from "@/types/database";

export type OrgBranchRow = {
  id: string;
  branch: Branch;
  active: boolean;
  sport: { key: string; name: string };
};

type OrgBranchesSettingsProps = {
  orgSlug: string;
  branches: OrgBranchRow[];
};

function BranchRow({
  orgSlug,
  row,
}: {
  orgSlug: string;
  row: OrgBranchRow;
}) {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();

  function onSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = await updateOrgSportBranch(orgSlug, row.id, formData);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <form
      action={onSubmit}
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D0D5DB] px-4 py-3 last:border-b-0"
    >
      <div className="min-w-0 text-sm">
        <p className="font-medium text-[#0A0A0A]">
          {sportLabel(row.sport.key) || sportLabel(row.sport.name)}
        </p>
        <p className="text-[#5C6570]">{BRANCH_LABELS[row.branch]}</p>
      </div>
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm text-[#0A0A0A]">
          <input
            type="checkbox"
            name="active"
            defaultChecked={row.active}
            disabled={pending}
            className="size-4 rounded-[2px] border-[#D0D5DB] accent-[#00B7FF]"
          />
          Activa
        </label>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          className="rounded-[2px]"
          disabled={pending}
        >
          {pending ? "…" : "Guardar"}
        </Button>
      </div>
      {error ? (
        <p className="w-full text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}

export function OrgBranchesSettings({
  orgSlug,
  branches,
}: OrgBranchesSettingsProps) {
  if (branches.length === 0) {
    return (
      <p className="text-sm text-[#5C6570]">
        No hay ramas configuradas.
      </p>
    );
  }

  return (
    <div className="overflow-hidden border border-[#D0D5DB] bg-white">
      {branches.map((row) => (
        <BranchRow key={row.id} orgSlug={orgSlug} row={row} />
      ))}
    </div>
  );
}
