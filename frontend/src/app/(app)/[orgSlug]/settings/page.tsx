import { requireOrgRole } from "@/lib/org";
import { createClient } from "@/lib/supabase/server";
import { ModulePageHeader } from "@/components/ops/module-page-header";
import { OrgSettingsForm } from "@/components/settings/org-settings-form";
import {
  OrgSportsSettings,
  type OrgSportRow,
} from "@/components/settings/org-sports-settings";
import {
  OrgBranchesSettings,
  type OrgBranchRow,
} from "@/components/settings/org-branches-settings";
import { CategoriesSettings } from "@/components/settings/categories-settings";
import type { Branch } from "@/types/database";

type SettingsPageProps = {
  params: Promise<{ orgSlug: string }>;
};

function resolveSport(
  sport:
    | {
        key: string;
        name: string;
        points_win: number;
        points_draw: number;
        points_loss: number;
        points_shootout_win: number;
        points_shootout_loss: number;
        draw_requires_shootout: boolean;
      }
    | {
        key: string;
        name: string;
        points_win: number;
        points_draw: number;
        points_loss: number;
        points_shootout_win: number;
        points_shootout_loss: number;
        draw_requires_shootout: boolean;
      }[]
    | null
) {
  if (!sport) return null;
  return Array.isArray(sport) ? sport[0] ?? null : sport;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { orgSlug } = await params;
  const membership = await requireOrgRole(orgSlug, ["admin"]);
  const orgId = membership.organization_id;
  const org = membership.organization;
  const supabase = await createClient();

  const [
    { data: orgSportsRaw, error: orgSportsError },
    { data: branchesRaw, error: branchesError },
    { data: categories, error: categoriesError },
  ] = await Promise.all([
    supabase
      .from("org_sports")
      .select(
        "id, active, points_win, points_draw, points_loss, points_shootout_win, points_shootout_loss, draw_requires_shootout, sport:sports(key, name, points_win, points_draw, points_loss, points_shootout_win, points_shootout_loss, draw_requires_shootout)"
      )
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("org_sport_branches")
      .select("id, branch, active, sport:sports(key, name)")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("organization_id", orgId)
      .order("sort_order", { ascending: true }),
  ]);

  if (orgSportsError) throw orgSportsError;
  if (branchesError) throw branchesError;
  if (categoriesError) throw categoriesError;

  const orgSports: OrgSportRow[] = (orgSportsRaw ?? []).flatMap((row) => {
    const sport = resolveSport(row.sport);
    if (!sport) return [];
    return [
      {
        id: row.id,
        active: row.active,
        points_win: row.points_win,
        points_draw: row.points_draw,
        points_loss: row.points_loss,
        points_shootout_win: row.points_shootout_win,
        points_shootout_loss: row.points_shootout_loss,
        draw_requires_shootout: row.draw_requires_shootout,
        sport,
      },
    ];
  });

  const branches: OrgBranchRow[] = (branchesRaw ?? []).flatMap((row) => {
    const sport = row.sport as
      | { key: string; name: string }
      | { key: string; name: string }[]
      | null;
    const resolved = Array.isArray(sport) ? sport[0] : sport;
    if (!resolved) return [];
    return [
      {
        id: row.id,
        branch: row.branch as Branch,
        active: row.active,
        sport: resolved,
      },
    ];
  });

  return (
    <section className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <ModulePageHeader
        band="settings"
        title="Configuración"
        description="Datos de tu organización, deportes activos, ramas y categorías."
      />

      <div className="space-y-10">
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">
            Organización
          </h2>
          <div className="border border-[#D0D5DB] bg-white p-5">
            <OrgSettingsForm
              orgSlug={orgSlug}
              initial={{
                name: org.name,
                tagline: org.tagline,
                logoUrl: org.logo_url,
                isPublic: org.is_public,
              }}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">Deportes</h2>
          <p className="text-sm text-[#5C6570]">
            Activa o desactiva deportes y ajusta los puntos. Si dejas un campo
            vacío al guardar, se usa el valor por defecto del deporte.
          </p>
          <OrgSportsSettings orgSlug={orgSlug} orgSports={orgSports} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">Ramas</h2>
          <p className="text-sm text-[#5C6570]">
            Varonil, femenil y mixto por deporte. Solo las activas aparecen al
            crear divisiones.
          </p>
          <OrgBranchesSettings orgSlug={orgSlug} branches={branches} />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-[#0A0A0A]">Categorías</h2>
          <p className="text-sm text-[#5C6570]">
            Las usas al armar divisiones dentro de un torneo (1RA, 2DA, etc.).
          </p>
          <CategoriesSettings
            orgSlug={orgSlug}
            categories={categories ?? []}
          />
        </section>
      </div>
    </section>
  );
}
