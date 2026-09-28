import Link from "next/link";
import { notFound } from "next/navigation";
import { ROLE_LABELS } from "@/lib/labels";
import { getMembership } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import type { MembershipRole } from "@/types/database";

type OrgDashboardProps = {
  params: Promise<{ orgSlug: string }>;
};

type DashModule = {
  key: string;
  label: string;
  description: string;
  bandClass: string;
};

function modulesForRoles(roles: MembershipRole[]): DashModule[] {
  const isAdmin = roles.includes("admin");
  const isDelegado = roles.includes("team_manager");
  const isReferee = roles.includes("referee");
  const items: DashModule[] = [];

  if (isAdmin) {
    items.push(
      {
        key: "clubs",
        label: "Clubes",
        description: "Instituciones o empresas que inscriben equipos.",
        bandClass: "bg-band-teams",
      },
      {
        key: "tournaments",
        label: "Torneos",
        description: "Divisiones, grupos y estructura de competencia.",
        bandClass: "bg-band-tournaments",
      },
      {
        key: "teams",
        label: "Equipos",
        description: "Equipos por club, deporte, rama y categoría.",
        bandClass: "bg-band-teams",
      },
      {
        key: "matches",
        label: "Partidos",
        description: "Programa la jornada, asigna árbitros y gestiona aplazos.",
        bandClass: "bg-band-matches",
      },
      {
        key: "approvals",
        label: "Credenciales",
        description: "Aprueba jugadores y marca elegibilidad.",
        bandClass: "bg-band-matches",
      },
      {
        key: "members",
        label: "Solicitudes",
        description: "Aprueba Delegados y Árbitros que se registraron.",
        bandClass: "bg-muted-foreground",
      },
      {
        key: "standings",
        label: "Posiciones",
        description: "Tabla calculada por división.",
        bandClass: "bg-band-standings",
      },
      {
        key: "settings",
        label: "Configuración",
        description: "Marca, deportes, ramas y categorías.",
        bandClass: "bg-muted-foreground",
      }
    );
  }

  if (isDelegado) {
    items.push(
      {
        key: "players",
        label: "Jugadores",
        description: "Registra a tu plantilla y revisa credenciales.",
        bandClass: "bg-band-teams",
      },
      {
        key: "matches",
        label: "Partidos",
        description: "Consulta tus partidos y cédulas.",
        bandClass: "bg-band-matches",
      },
      {
        key: "standings",
        label: "Posiciones",
        description: "Tabla de tu división.",
        bandClass: "bg-band-standings",
      }
    );
  }

  if (isReferee) {
    items.push(
      {
        key: "referee",
        label: "Mis partidos",
        description: "Captura la cédula desde la cancha.",
        bandClass: "bg-band-matches",
      },
      {
        key: "standings",
        label: "Posiciones",
        description: "Consulta la tabla.",
        bandClass: "bg-band-standings",
      }
    );
  }

  const seen = new Set<string>();
  return items.filter((m) => {
    if (seen.has(m.key)) return false;
    seen.add(m.key);
    return true;
  });
}

export default async function OrgDashboardPage({ params }: OrgDashboardProps) {
  const { orgSlug } = await params;
  const membership = await getMembership(orgSlug);

  if (!membership) {
    notFound();
  }

  const supabase = await createClient();
  const { data: roleRows } = await supabase
    .from("memberships")
    .select("role")
    .eq("organization_id", membership.organization_id)
    .eq("user_id", membership.user_id);

  const roles = (roleRows ?? []).map((r) => r.role);
  const modules = modulesForRoles(roles);

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
        {modules.map((mod) => (
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
