import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getOrgAccess } from "@/components/ops/access";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { CredentialCard } from "@/components/players/credential-card";
import { PrintButton } from "@/components/players/print-button";
import { Button } from "@/components/ui/button";
import { loadCredentials } from "@/lib/credentials";

type PageProps = {
  params: Promise<{ orgSlug: string; registrationId: string }>;
};

export default async function CredentialPage({ params }: PageProps) {
  const { orgSlug, registrationId } = await params;
  const access = await getOrgAccess(orgSlug);

  if (!access.isDelegado && !access.isAdmin) {
    redirect(`/${orgSlug}`);
  }

  const [item] = await loadCredentials(
    access.membership.organization_id,
    access.membership.organization.logo_url ?? null,
    { registrationId }
  );
  if (!item) notFound();

  if (
    access.isDelegado &&
    !access.isAdmin &&
    access.managedTeamId !== item.teamId
  ) {
    notFound();
  }

  return (
    <section className="mx-auto w-full max-w-3xl">
      <ModulePageHeader
        band="players"
        title="Credencial"
        description="Imprime o muestra el folio para verificación pública."
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
            <PrintButton />
          </div>
        }
      />
      <div className="print-area">
        <CredentialCard credential={item.credential} />
      </div>
    </section>
  );
}
