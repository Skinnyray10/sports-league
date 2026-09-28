import {
  APPROVAL_STATUS_LABELS,
  BRANCH_LABELS,
  ELIGIBILITY_STATUS_LABELS,
  sportLabel,
} from "@/lib/labels";
import type {
  ApprovalStatus,
  Branch,
  EligibilityStatus,
} from "@/types/database";

export type CredentialView = {
  folio: string;
  firstNames: string;
  lastNames: string;
  photoUrl: string | null;
  teamName: string;
  clubName: string;
  sportName: string;
  branch: Branch;
  categoryName: string;
  classification: string | null;
  status: ApprovalStatus;
  eligibility: EligibilityStatus;
  jerseyNumber: number | null;
  /** Logo de la liga; si falta, la ficha indica que hay que cargarlo en Configuración. */
  organizationLogoUrl: string | null;
  /** Logo del equipo; solo se muestra si hay URL. */
  teamLogoUrl: string | null;
};

type CredentialCardProps = {
  credential: CredentialView;
};

export function CredentialCard({ credential }: CredentialCardProps) {
  const fullName = `${credential.firstNames} ${credential.lastNames}`;

  return (
    <article className="credential-print mx-auto w-full max-w-md border border-border bg-card">
      <div className="h-1.5 w-full bg-band-tournaments" aria-hidden />
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {credential.organizationLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={credential.organizationLogoUrl}
              alt="Logo de la liga"
              className="h-10 w-auto max-w-[140px] object-contain"
            />
          ) : (
            <p className="text-xs text-muted-foreground">
              Falta el logo de la liga. Cárgalo en Configuración.
            </p>
          )}
        </div>
        {credential.teamLogoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={credential.teamLogoUrl}
            alt={`Logo de ${credential.teamName}`}
            className="h-10 w-auto max-w-[100px] shrink-0 object-contain"
          />
        ) : null}
      </div>
      <div className="grid gap-5 p-5 sm:grid-cols-[120px_1fr]">
        <div className="mx-auto size-[120px] overflow-hidden border border-border bg-secondary sm:mx-0">
          {credential.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={credential.photoUrl}
              alt={`Foto de ${fullName}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-muted-foreground">
              Sin foto
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            {fullName}
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            Folio {credential.folio}
            {credential.jerseyNumber != null
              ? ` · #${credential.jerseyNumber}`
              : ""}
          </p>
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Equipo</dt>
              <dd className="text-right font-medium text-foreground">
                {credential.teamName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Club</dt>
              <dd className="text-right font-medium text-foreground">
                {credential.clubName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Deporte</dt>
              <dd className="text-right font-medium text-foreground">
                {sportLabel(credential.sportName)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Rama</dt>
              <dd className="text-right font-medium text-foreground">
                {BRANCH_LABELS[credential.branch]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Categoría</dt>
              <dd className="text-right font-medium text-foreground">
                {credential.categoryName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Clasificación</dt>
              <dd className="text-right font-medium text-foreground">
                {credential.classification || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Estado</dt>
              <dd className="text-right font-medium text-foreground">
                {APPROVAL_STATUS_LABELS[credential.status]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Elegibilidad</dt>
              <dd className="text-right font-medium text-foreground">
                {ELIGIBILITY_STATUS_LABELS[credential.eligibility]}
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </article>
  );
}
