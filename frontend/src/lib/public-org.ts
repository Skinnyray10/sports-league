import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/types/database";

export type PublicOrg = Pick<
  Tables<"organizations">,
  "id" | "name" | "slug" | "tagline" | "logo_url" | "is_public"
>;

export type PublicMatch = Tables<"public_matches">;
export type PublicStanding = Tables<"public_standings">;
export type PublicScorer = Tables<"public_scorers">;
export type PublicNotice = Tables<"public_notices">;

/**
 * Organización pública por slug. 404 si no existe o no es pública.
 */
export async function requirePublicOrg(orgSlug: string): Promise<PublicOrg> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, tagline, logo_url, is_public")
    .eq("slug", orgSlug)
    .eq("is_public", true)
    .maybeSingle();

  if (error) throw error;
  if (!data) notFound();
  return data;
}

/** Ligas visibles sin sesión (ordenadas por nombre). */
export async function listPublicOrganizations(): Promise<PublicOrg[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug, tagline, logo_url, is_public")
    .eq("is_public", true)
    .order("name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicMatches(
  orgSlug: string
): Promise<PublicMatch[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_matches")
    .select("*")
    .eq("org_slug", orgSlug)
    .order("scheduled_at", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicStandings(
  orgSlug: string
): Promise<PublicStanding[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_standings")
    .select("*")
    .eq("org_slug", orgSlug)
    .order("puntos", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicScorers(
  orgSlug: string
): Promise<PublicScorer[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_scorers")
    .select("*")
    .eq("org_slug", orgSlug)
    .order("anotaciones", { ascending: false, nullsFirst: false })
    .limit(50);

  if (error) throw error;
  return data ?? [];
}

export async function loadPublicNotices(
  orgSlug: string
): Promise<PublicNotice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("public_notices")
    .select("*")
    .eq("org_slug", orgSlug)
    .order("published_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

const UPCOMING: PublicMatch["status"][] = ["programado", "en_vivo", "aplazado"];

export function pickNextMatch(matches: PublicMatch[]): PublicMatch | null {
  const now = Date.now();
  const upcoming = matches
    .filter((m) => UPCOMING.includes(m.status))
    .sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return ta - tb;
    });

  const future = upcoming.find((m) => {
    if (!m.scheduled_at) return true;
    return new Date(m.scheduled_at).getTime() >= now - 2 * 60 * 60 * 1000;
  });

  return future ?? upcoming[0] ?? null;
}

export function pickLastResult(matches: PublicMatch[]): PublicMatch | null {
  const finished = matches
    .filter((m) => m.status === "finalizado")
    .sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return tb - ta;
    });
  return finished[0] ?? null;
}

export function formatPublicWhen(iso: string | null): string {
  if (!iso) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPublicDate(iso: string | null): string {
  if (!iso) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatPublicTime(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}
