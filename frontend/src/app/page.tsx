import Link from "next/link";
import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { listUserOrganizations, roleHomePath } from "@/lib/org";
import { listPublicOrganizations } from "@/lib/public-org";

/**
 * Entrada de la app: la vista pública es lo primero.
 * Con sesión, esta página deja elegir liga en vez de entrar sola a una.
 */
export default async function RootPage() {
  const user = await getUser();

  if (user) {
    const orgs = await listUserOrganizations();
    if (orgs.length === 0) {
      redirect("/onboarding");
    }
    const publicOrgs = await listPublicOrganizations();
    const memberSlugs = new Set(orgs.map((org) => org.slug));
    const choices = await Promise.all(
      orgs.map(async (org) => ({
        org,
        panelHref: await roleHomePath(org.slug),
      }))
    );
    const otherPublic = publicOrgs.filter((org) => !memberSlugs.has(org.slug));

    return (
      <main className="mx-auto flex min-h-full max-w-lg flex-col gap-6 px-4 py-16">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Elige una liga</h1>
          <p className="text-sm text-muted-foreground">
            Entra al panel de la liga o ábrela en la vista pública.
          </p>
        </div>
        <ul className="divide-y divide-border border border-border bg-card">
          {choices.map(({ org, panelHref }) => (
            <li key={org.id} className="flex flex-col gap-2 px-4 py-3">
              <span className="text-sm font-semibold text-foreground">
                {org.name}
              </span>
              <span className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link
                  href={panelHref}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Entrar al panel
                </Link>
                <Link
                  href={`/p/${org.slug}`}
                  className="font-medium text-muted-foreground underline underline-offset-4 hover:text-foreground"
                >
                  Vista pública
                </Link>
              </span>
            </li>
          ))}
        </ul>
        {otherPublic.length > 0 ? (
          <ul className="divide-y divide-border border border-border bg-card">
            {otherPublic.map((org) => (
              <li key={org.id}>
                <Link
                  href={`/p/${org.slug}`}
                  className="flex flex-col gap-0.5 px-4 py-3 transition-colors hover:bg-secondary/70"
                >
                  <span className="text-sm font-semibold text-foreground">
                    {org.name}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Vista pública
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </main>
    );
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
          className="inline-flex h-10 flex-1 items-center justify-center rounded-full bg-primary px-4 text-sm font-medium text-foreground hover:bg-foreground hover:text-background"
        >
          Iniciar sesión
        </Link>
        <Link
          href="/signup"
          className="inline-flex h-10 flex-1 items-center justify-center rounded-full border border-border bg-card px-4 text-sm font-medium hover:bg-muted"
        >
          Crear cuenta
        </Link>
      </div>
    </main>
  );
}
