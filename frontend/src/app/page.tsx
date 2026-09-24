import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { homePathAfterAuth, listUserOrganizations } from "@/lib/org";
import { listPublicOrganizations } from "@/lib/public-org";

/**
 * Entrada de la app: la vista pública es lo primero.
 * Con sesión, va al panel según rol (admin / delegado / árbitro).
 */
export default async function RootPage() {
  const user = await getUser();

  if (user) {
    const orgs = await listUserOrganizations();
    if (orgs.length === 0) {
      redirect("/onboarding");
    }
    redirect(await homePathAfterAuth(orgs[0]!.slug));
  }

  const publicOrgs = await listPublicOrganizations();

  if (publicOrgs.length === 1) {
    redirect(`/p/${publicOrgs[0]!.slug}`);
  }

  if (publicOrgs.length > 1) {
    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
        <div className="space-y-2">
          <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
            Vista pública
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Elige una liga</h1>
          <p className="text-sm text-muted-foreground">
            Consulta partidos, resultados y tablas sin iniciar sesión. Si eres
            admin, delegado o árbitro, entra desde el acceso de cada liga.
          </p>
        </div>
        <ul className="divide-y divide-border border border-border bg-card">
          {publicOrgs.map((org) => (
            <li key={org.id}>
              <Link
                href={`/p/${org.slug}`}
                className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-secondary/70"
              >
                <span className="text-sm font-semibold text-foreground">
                  {org.name}
                </span>
                {org.tagline ? (
                  <span className="text-sm text-muted-foreground">
                    {org.tagline}
                  </span>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">
                    /p/{org.slug}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
        <p className="text-center text-sm text-muted-foreground">
          ¿Personal autorizado?{" "}
          <Link href="/login" className="font-medium text-foreground underline">
            Iniciar sesión
          </Link>
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-full max-w-md flex-col justify-center gap-6 px-4 py-16">
      <div className="space-y-2">
        <p className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
          Sports League
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          Consulta sin cuenta
        </h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Aquí verás el rol de juegos, resultados y tablas cuando una
          organización active su vista pública. El acceso de administración,
          alta de jugadores y cédula solo abre con credenciales.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Link
          href="/login"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-sm bg-[#00B7FF] px-4 text-sm font-medium text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-sm border border-border bg-white px-4 text-sm font-medium hover:bg-muted"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
