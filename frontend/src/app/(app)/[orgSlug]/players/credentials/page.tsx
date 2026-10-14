import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CredentialCard } from "@/components/players/credential-card";
import { PrintButton } from "@/components/players/print-button";
import { Button } from "@/components/ui/button";
import { loadCredentials } from "@/lib/credentials";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function TeamCredentialsPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const access = await getOrgAccess(orgSlug);

  if (!access.isDelegado && !access.isAdmin) {
    redirect(`/${orgSlug}`);
  }

  const teamId = access.managedTeamId;
  if (!teamId) {
    redirect(`/${orgSlug}/players`);
  }

  const items = (
    await loadCredentials(
      access.membership.organization_id,
      access.membership.organization.logo_url ?? null,
      { teamId }
    )
  ).filter((item) => item.credential.status !== "rechazado");

  return (
    <section className="mx-auto w-full max-w-5xl">
      <ModulePageHeader
        band="players"
        title="Imprimir credenciales"
        description={
          items.length === 1
            ? "1 credencial lista para imprimir."
            : `${items.length} credenciales listas para imprimir.`
        }
        className="print:hidden"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              nativeButton={false}
              render={<Link href={`/${orgSlug}/players`} />}
            >
              Volver
            </Button>
            {items.length > 0 ? (
              <PrintButton label="Imprimir todas" />
            ) : null}
          </div>
        }
      />

      {items.length === 0 ? (
        <div className="border border-dashed border-border bg-card px-6 py-12 text-center">
          <p className="text-base font-medium text-foreground">
            No hay credenciales para imprimir
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Registra jugadores para generar sus credenciales.
          </p>
        </div>
      ) : (
        <div className="print-area grid gap-6 md:grid-cols-2 print:grid-cols-2 print:gap-4 print:[zoom:0.85]">
          {items.map((item) => (
            <CredentialCard
              key={item.credential.folio}
              credential={item.credential}
            />
          ))}
        </div>
      )}
    </section>
  );
}
