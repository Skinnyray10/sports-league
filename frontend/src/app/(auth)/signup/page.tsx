import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getUser } from "@/lib/auth";
import { homePathAfterAuth, listUserOrganizations } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams: Promise<{ org?: string }>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const { org: orgSlug } = await searchParams;
  const user = await getUser();

  if (user) {
    const orgs = await listUserOrganizations();
    if (orgs.length === 0) {
      redirect("/pending");
    }
    redirect(await homePathAfterAuth(orgs[0]!.slug));
  }

  const supabase = await createClient();
  const [{ data: organizations }, { data: clubs }] = await Promise.all([
    supabase
      .from("public_organizations")
      .select("id, name, slug")
      .order("name"),
    supabase
      .from("public_clubs")
      .select("organization_id, club_id, club_name")
      .order("club_name"),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Registro de usuario</h1>
        <p className="text-[0.9375rem] text-muted-foreground">
          Solicita acceso como Delegado o Árbitro. El administrador de la liga
          aprueba la cuenta.
        </p>
      </div>
      <SignupForm
        organizations={organizations ?? []}
        clubs={(clubs ?? []).map((c) => ({
          organizationId: c.organization_id,
          clubId: c.club_id,
          clubName: c.club_name,
        }))}
        defaultOrgSlug={orgSlug}
      />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-foreground underline">
          Volver a la vista pública
        </Link>
      </p>
    </div>
  );
}
