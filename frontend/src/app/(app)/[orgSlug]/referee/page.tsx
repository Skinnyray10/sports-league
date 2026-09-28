import Link from "next/link";
import { requireOrgRole } from "@/lib/org";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { MatchStatusBadge } from "@/components/matches/match-status-badge";
import type { MatchStatus } from "@/types/database";

type PageProps = {
  params: Promise<{ orgSlug: string }>;
};

export default async function RefereeMatchesPage({ params }: PageProps) {
  const { orgSlug } = await params;
  const user = await requireUser();
  await requireOrgRole(orgSlug, ["referee", "admin"]);
  const membership = await requireOrgRole(orgSlug, ["referee", "admin"]);
  const supabase = await createClient();

  const { data: matches, error } = await supabase
    .from("matches")
    .select(
      `
      id, status, scheduled_at, venue, jornada,
      home_team:teams!matches_home_team_id_fkey(name),
      away_team:teams!matches_away_team_id_fkey(name)
    `
    )
    .eq("organization_id", membership.organization_id)
    .eq("referee_id", user.id)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (error) throw error;

  return (
    <section className="mx-auto w-full max-w-lg">
      <ModulePageHeader
        band="referee"
        title="Mis partidos"
        description="Captura la cédula desde la cancha. Solo ves los partidos que te asignaron."
      />
      <ul className="divide-y divide-border border border-border bg-card">
        {(matches ?? []).length === 0 ? (
          <li className="px-4 py-8 text-sm text-muted-foreground">
            Aún no tienes partidos asignados.
          </li>
        ) : (
          (matches ?? []).map((m) => {
            const home = Array.isArray(m.home_team)
              ? m.home_team[0]
              : m.home_team;
            const away = Array.isArray(m.away_team)
              ? m.away_team[0]
              : m.away_team;
            return (
              <li key={m.id}>
                <Link
                  href={`/${orgSlug}/referee/${m.id}`}
                  className="flex flex-col gap-1 px-4 py-3 transition-colors hover:bg-secondary/70"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {home?.name ?? "Local"} vs {away?.name ?? "Visitante"}
                    </span>
                    <MatchStatusBadge status={m.status as MatchStatus} />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {m.jornada != null ? `Jornada ${m.jornada}` : "Sin jornada"}
                    {m.venue ? ` · ${m.venue}` : ""}
                  </span>
                </Link>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
