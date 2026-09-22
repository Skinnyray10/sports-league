import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLE_LABELS } from "@/lib/labels";
import { getMembership } from "@/lib/org";

type OrgDashboardProps = {
  params: Promise<{ orgSlug: string }>;
};

const MODULES = [
  {
    key: "teams",
    label: "Equipos",
    description: "Da de alta los equipos de tu organización.",
    bandClass: "bg-band-teams",
  },
  {
    key: "tournaments",
    label: "Torneos",
    description: "Crea torneos e inscribe equipos.",
    bandClass: "bg-band-tournaments",
  },
  {
    key: "matches",
    label: "Partidos",
    description: "Programa la jornada y captura resultados.",
    bandClass: "bg-band-matches",
  },
  {
    key: "standings",
    label: "Posiciones",
    description: "Consulta la tabla de cada torneo.",
    bandClass: "bg-band-standings",
  },
] as const;

export default async function OrgDashboardPage({ params }: OrgDashboardProps) {
  const { orgSlug } = await params;
  const membership = await getMembership(orgSlug);

  if (!membership) {
    notFound();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">
          {membership.organization.name}
        </h2>
        <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
          Entraste como{" "}
          <span className="font-medium text-foreground">
            {ROLE_LABELS[membership.role]}
          </span>
          . Abre un módulo para continuar.
        </p>
      </div>

      <ul className="divide-y divide-border border border-border bg-card">
        {MODULES.map((mod) => (
          <li key={mod.key}>
            <Link
              href={`/${orgSlug}/${mod.key}`}
              className="group flex items-start gap-3 px-4 py-3 transition-colors duration-150 hover:bg-secondary/70"
            >
              <span
                aria-hidden
                className={`mt-1 h-8 w-1 shrink-0 rounded-sm ${mod.bandClass}`}
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="text-sm font-semibold text-foreground group-hover:underline group-hover:underline-offset-4">
                  {mod.label}
                </span>
                <span className="text-sm text-muted-foreground">
                  {mod.description}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
