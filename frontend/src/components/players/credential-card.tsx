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
};

type CredentialCardProps = {
  credential: CredentialView;
  /** Absolute or path used for QR payload. */
  verifyUrl: string;
};

export function CredentialCard({
  credential,
  verifyUrl,
}: CredentialCardProps) {
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verifyUrl)}`;
  const fullName = `${credential.firstNames} ${credential.lastNames}`;

  return (
    <article className="credential-print mx-auto w-full max-w-md border border-[#D0D5DB] bg-white">
      <div className="h-1.5 w-full bg-[#FF2DA1]" aria-hidden />
      <div className="grid gap-5 p-5 sm:grid-cols-[120px_1fr]">
        <div className="mx-auto size-[120px] overflow-hidden border border-[#D0D5DB] bg-[#E6E9EC] sm:mx-0">
          {credential.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={credential.photoUrl}
              alt={`Foto de ${fullName}`}
              className="size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-center justify-center text-xs text-[#5C6570]">
              Sin foto
            </div>
          )}
        </div>
        <div className="min-w-0 space-y-2">
          <h2 className="text-xl font-bold tracking-tight text-[#0A0A0A]">
            {fullName}
          </h2>
          <p className="font-mono text-sm text-[#5C6570]">
            Folio {credential.folio}
            {credential.jerseyNumber != null
              ? ` · #${credential.jerseyNumber}`
              : ""}
          </p>
          <dl className="grid gap-1 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Equipo</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {credential.teamName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Club</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {credential.clubName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Deporte</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {sportLabel(credential.sportName)}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Rama</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {BRANCH_LABELS[credential.branch]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Categoría</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {credential.categoryName}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Clasificación</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {credential.classification || "—"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Estado</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {APPROVAL_STATUS_LABELS[credential.status]}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-[#5C6570]">Elegibilidad</dt>
              <dd className="text-right font-medium text-[#0A0A0A]">
                {ELIGIBILITY_STATUS_LABELS[credential.eligibility]}
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="flex flex-col items-center gap-2 border-t border-[#D0D5DB] px-5 py-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={qrSrc} alt="Código QR de verificación" width={150} height={150} />
        <p className="break-all text-center font-mono text-xs text-[#5C6570]">
          {verifyUrl}
        </p>
      </div>
    </article>
  );
}
