import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminTutorial, type Mission } from "@/components/tutorial/admin-tutorial";
import { requireUser } from "@/lib/auth";
import { ROLE_LABELS } from "@/lib/labels";
import { modulesForRoles } from "@/lib/nav";
import { getMembership } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { adminTutorialState } from "@/lib/tutorial";

type OrgDashboardProps = {
  params: Promise<{ orgSlug: string }>;
};

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
  const modules = modulesForRoles(orgSlug, roles);

  const user = await requireUser();
  const tutorialState = adminTutorialState(user.user_metadata);
  const missions =
    roles.includes("admin") && tutorialState !== "done"
      ? await loadMissions(orgSlug, membership.organization_id)
      : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight">
          {membership.organization.name}
        </h1>
        <p className="max-w-prose text-[0.9375rem] text-muted-foreground">
          Entraste como{" "}
          <span className="font-medium text-foreground">
            {ROLE_LABELS[membership.role]}
          </span>
          . Abre un módulo para continuar.
        </p>
      </div>

      {missions ? (
        <AdminTutorial state={tutorialState} missions={missions} />
      ) : null}

      <ul className="divide-y divide-border rounded-xl border border-border bg-card">
        {modules.map((mod) => (
          <li key={mod.key}>
            <Link
              href={mod.href}
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

/** Misiones del tutorial; cada una se marca sola al detectar los datos reales. */
async function loadMissions(orgSlug: string, orgId: string): Promise<Mission[]> {
  const supabase = await createClient();
  const count = (table: "clubs" | "divisions" | "teams" | "matches" | "sanctions") =>
    supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId);

  const [clubs, divisions, teams, matches, scheduled, sanctions, tournament] =
    await Promise.all([
      count("clubs"),
      count("divisions"),
      count("teams"),
      count("matches"),
      count("matches").not("scheduled_at", "is", null),
      count("sanctions"),
      supabase
        .from("tournaments")
        .select("id")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  const base = `/${orgSlug}`;
  const tournamentHref = tournament.data
    ? `${base}/tournaments/${tournament.data.id}`
    : null;

  return [
    {
      key: "club",
      title: "Agrega los clubes",
      description: "Las instituciones o empresas que inscriben equipos.",
      href: `${base}/clubs?guia=club`,
      done: (clubs.count ?? 0) > 0,
    },
    {
      key: "torneo",
      title: "Crea tu torneo y una división",
      description: "Nombre, temporada y la división (deporte, rama y categoría).",
      href: tournamentHref
        ? `${tournamentHref}?guia=division`
        : `${base}/tournaments?guia=torneo`,
      done: (divisions.count ?? 0) > 0,
    },
    {
      key: "equipo",
      title: "Da de alta los equipos",
      description: "Necesitas al menos 2 equipos en la división.",
      href: `${base}/teams?guia=equipo`,
      done: (teams.count ?? 0) >= 2,
    },
    {
      key: "rol",
      title: "Genera el rol de juegos",
      description: "La app arma todos los enfrentamientos por ti.",
      href: tournamentHref ? `${tournamentHref}?guia=rol` : `${base}/tournaments`,
      done: (matches.count ?? 0) > 0,
    },
    {
      key: "jornada",
      title: "Arma la primera jornada",
      description: "Después de la junta, pon día, hora y cancha.",
      href: `${base}/matches/jornada?guia=jornada`,
      done: (scheduled.count ?? 0) > 0,
    },
    {
      key: "castigo",
      title: "Registra un castigado",
      description: "Cuando haya jugadores, anota la falta y los juegos que se pierde.",
      href: `${base}/sanctions?guia=castigo`,
      done: (sanctions.count ?? 0) > 0,
    },
  ];
}
