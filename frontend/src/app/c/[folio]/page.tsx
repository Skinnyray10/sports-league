import type { Metadata } from "next";
import { CheckCircle2Icon, XCircleIcon } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  APPROVAL_STATUS_LABELS,
  BRANCH_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  sportLabel,
} from "@/lib/labels";
import type { ApprovalStatus, Branch, EligibilityStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ folio: string }>;
};

export const metadata: Metadata = {
  title: "Verificar credencial",
  robots: { index: false, follow: false },
};

const FOLIO_PATTERN = /^[A-Za-z0-9-]{6,40}$/;

export default async function CredentialPublicPage({ params }: PageProps) {
  const { folio } = await params;

  const row = FOLIO_PATTERN.test(folio) ? await lookup(folio) : null;

  if (!row) {
    return (
      <main id="contenido" className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-destructive">
          No encontrada
        </p>
        <h1 className="font-heading text-2xl font-extrabold">Folio inválido</h1>
        <p className="text-sm text-muted-foreground">
          No hay ninguna credencial con el folio{" "}
          <span className="font-mono">{folio.slice(0, 40)}</span>. Revisa que
          esté bien escrito o escanea de nuevo el código QR.
        </p>
      </main>
    );
  }

  const valid = row.is_valid;
  const fullName = [row.first_names, row.last_names].filter(Boolean).join(" ");

  return (
    <main id="contenido" className="mx-auto flex min-h-full max-w-md flex-col gap-6 px-4 py-12">
      <div
        role="status"
        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-center ${
          valid
            ? "border-status-final bg-status-final/10 text-status-final"
            : "border-destructive bg-destructive/10 text-destructive"
        }`}
      >
        {valid ? (
          <CheckCircle2Icon className="size-5" aria-hidden />
        ) : (
          <XCircleIcon className="size-5" aria-hidden />
        )}
        <p className="text-sm font-semibold uppercase tracking-wide">
          {valid ? "Credencial vigente" : "Credencial no vigente"}
        </p>
      </div>

      <div className="text-center">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          {fullName || "Credencial en revisión"}
        </h1>
        <p className="mt-1 font-mono text-xs text-muted-foreground">
          Folio {row.folio}
        </p>
      </div>

      <dl className="grid gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm">
        {row.team_name ? <Row label="Equipo" value={row.team_name} /> : null}
        {row.club_name ? <Row label="Club" value={row.club_name} /> : null}
        <Row label="Deporte" value={sportLabel(row.sport_name)} />
        <Row
          label="Rama"
          value={BRANCH_LABELS[row.branch as Branch] ?? row.branch}
        />
        <Row label="Categoría" value={row.category_name} />
        {row.classification ? (
          <Row label="Clasificación" value={row.classification} />
        ) : null}
        <Row
          label="Estado"
          value={APPROVAL_STATUS_LABELS[row.status as ApprovalStatus] ?? row.status}
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

async function lookup(folio: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("validate_credential", {
    p_folio: folio,
  });
  if (error) throw error;
  return (Array.isArray(data) ? data[0] : data) ?? null;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
