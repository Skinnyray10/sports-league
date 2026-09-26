import { createClient } from "@/lib/supabase/server";
import {
  APPROVAL_STATUS_LABELS,
  BRANCH_LABELS,
  ELIGIBILITY_STATUS_LABELS,
} from "@/lib/labels";
import type { ApprovalStatus, Branch, EligibilityStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ folio: string }>;
};

export default async function CredentialPublicPage({ params }: PageProps) {
  const { folio } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("validate_credential", {
    p_folio: folio,
  });

  if (error) {
    throw error;
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    return (
      <main className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-destructive">
          No encontrada
        </p>
        <h1 className="text-2xl font-bold">Folio inválido</h1>
        <p className="text-sm text-muted-foreground">
          No hay ninguna credencial con el folio{" "}
          <span className="font-mono">{folio}</span>.
        </p>
      </main>
    );
  }

  const valid = row.is_valid;

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-12">
      <div
        className={`border px-4 py-3 text-center ${
          valid
            ? "border-emerald-600 bg-emerald-50 text-emerald-900"
            : "border-destructive bg-red-50 text-destructive"
        }`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide">
          {valid ? "VÁLIDA" : "NO VÁLIDA"}
        </p>
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {row.first_names} {row.last_names}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Folio {row.folio}
        </p>
      </div>

      <dl className="grid gap-2 border border-border bg-card px-4 py-3 text-sm">
        <Row label="Equipo" value={row.team_name} />
        <Row label="Club" value={row.club_name} />
        <Row label="Deporte" value={row.sport_name} />
        <Row
          label="Rama"
          value={BRANCH_LABELS[row.branch as Branch] ?? row.branch}
        />
        <Row label="Categoría" value={row.category_name} />
        <Row label="Clasificación" value={row.classification ?? "—"} />
        <Row
          label="Status"
          value={
            APPROVAL_STATUS_LABELS[row.status as ApprovalStatus] ?? row.status
          }
        />
        <Row
          label="Elegibilidad"
          value={
            ELIGIBILITY_STATUS_LABELS[row.eligibility as EligibilityStatus] ??
            row.eligibility
          }
        />
      </dl>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-right">{value}</dd>
    </div>
  );
}
