import type {
  MatchStatus,
  MembershipRole,
  ScoreType,
  TournamentStatus,
} from "@/types/database";

/**
 * Glosario único de la interfaz. La base guarda los valores en inglés (o en
 * español abreviado); aquí viven los nombres que lee la persona. Un solo lugar
 * para que el mismo concepto no se llame distinto en dos pantallas.
 */

export const ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Administrador",
  league_manager: "Coordinador de liga",
  team_manager: "Delegado de equipo",
  referee: "Árbitro",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  programado: "Programado",
  en_vivo: "En vivo",
  finalizado: "Finalizado",
  suspendido: "Suspendido",
};

export const TOURNAMENT_STATUS_LABELS: Record<TournamentStatus, string> = {
  registration: "Inscripciones",
  active: "En curso",
  finished: "Finalizado",
};

export const TOURNAMENT_FORMAT_LABELS: Record<string, string> = {
  round_robin: "Todos contra todos",
  knockout: "Eliminación directa",
  groups: "Grupos",
};

/** `legs` es 1 (solo ida) o 2 (ida y vuelta). */
export const LEGS_LABELS: Record<string, string> = {
  "1": "Solo ida",
  "2": "Ida y vuelta",
};

/** Los deportes se siembran sin acentos ni mayúsculas en la base. */
const SPORT_LABELS: Record<string, string> = {
  futbol: "Fútbol",
  basquetbol: "Basquetbol",
  voleibol: "Voleibol",
  tenis: "Tenis",
};

export function sportLabel(name: string): string {
  return SPORT_LABELS[name] ?? name;
}

/** Cómo se llama lo que se anota en este deporte: goles, puntos o sets. */
export function scoreNoun(scoreType: ScoreType): string {
  if (scoreType === "sets") return "sets";
  if (scoreType === "points") return "puntos";
  return "goles";
}

export function formatLabel(format: string): string {
  return TOURNAMENT_FORMAT_LABELS[format] ?? format;
}

export function legsLabel(legs: number): string {
  return LEGS_LABELS[String(legs)] ?? `${legs} vueltas`;
}
