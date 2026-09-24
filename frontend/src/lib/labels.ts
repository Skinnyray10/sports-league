import type {
  ApprovalStatus,
  Branch,
  EligibilityStatus,
  MatchEventType,
  MatchStatus,
  MembershipRole,
  ScheduleChangeType,
  ScoreType,
  TournamentStatus,
} from "@/types/database";

/**
 * Glosario único de la interfaz (español MX). Un concepto nuevo se nombra aquí.
 */

export const ROLE_LABELS: Record<MembershipRole, string> = {
  admin: "Administrador",
  team_manager: "Delegado de equipo",
  referee: "Árbitro",
};

export const MATCH_STATUS_LABELS: Record<MatchStatus, string> = {
  programado: "Programado",
  en_vivo: "En vivo",
  finalizado: "Finalizado",
  aplazado: "Aplazado",
  cancelado: "Cancelado",
};

export const MATCH_STAGE_LABELS: Record<string, string> = {
  regular: "Regular",
  cuartos: "Cuartos",
  semifinal: "Semifinal",
  final: "Final",
};

export const SCHEDULE_CHANGE_LABELS: Record<ScheduleChangeType, string> = {
  reprogramar: "Reprogramación",
  aplazar: "Aplazamiento",
  cancelar: "Cancelación",
};

export const BRANCH_LABELS: Record<Branch, string> = {
  varonil: "Varonil",
  femenil: "Femenil",
  mixto: "Mixto",
};

export const APPROVAL_STATUS_LABELS: Record<ApprovalStatus, string> = {
  pendiente: "Pendiente",
  aprobado: "Aprobado",
  rechazado: "Rechazado",
};

export const ELIGIBILITY_STATUS_LABELS: Record<EligibilityStatus, string> = {
  pendiente: "Pendiente",
  elegible: "Elegible",
  no_elegible: "No elegible",
};

export const MATCH_EVENT_LABELS: Record<MatchEventType, string> = {
  gol: "Gol",
  pts: "Puntos",
  carrera: "Carrera",
  amonestacion: "Amonestación",
  expulsion: "Expulsión",
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

export const LEGS_LABELS: Record<string, string> = {
  "1": "Solo ida",
  "2": "Ida y vuelta",
};

const SPORT_LABELS: Record<string, string> = {
  soccer: "Soccer",
  futbol_7x7: "Fútbol 7x7",
  basquetbol: "Basquetbol",
  softbol: "Softbol",
  tochito: "Tochito",
  voleibol: "Voleibol",
};

export type StandingColumn = { key: string; label: string; title: string };

/** Columnas de posiciones por deporte (abreviaciones de Ejemplos.md). */
export const STANDINGS_COLUMNS: Record<string, StandingColumn[]> = {
  soccer: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "empatados", label: "J.E.", title: "Empatados" },
    { key: "empates_ganados", label: "J.E.G.", title: "Empates ganados" },
    { key: "empates_perdidos", label: "J.E.P.", title: "Empates perdidos" },
    { key: "a_favor", label: "G.F.", title: "Goles a favor" },
    { key: "en_contra", label: "G.C.", title: "Goles en contra" },
    { key: "diferencia", label: "D.G.", title: "Diferencia de goles" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
  futbol_7x7: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "empatados", label: "J.E.", title: "Empatados" },
    { key: "empates_ganados", label: "J.E.G.", title: "Empates ganados" },
    { key: "empates_perdidos", label: "J.E.P.", title: "Empates perdidos" },
    { key: "a_favor", label: "G.F.", title: "Goles a favor" },
    { key: "en_contra", label: "G.C.", title: "Goles en contra" },
    { key: "diferencia", label: "D.G.", title: "Diferencia de goles" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
  basquetbol: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "a_favor", label: "P.F.", title: "Puntos a favor" },
    { key: "en_contra", label: "P.C.", title: "Puntos en contra" },
    { key: "diferencia", label: "DIF.", title: "Diferencia" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
  softbol: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "a_favor", label: "C.F.", title: "Carreras a favor" },
    { key: "en_contra", label: "C.C.", title: "Carreras en contra" },
    { key: "diferencia", label: "D.C.", title: "Diferencia de carreras" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
  tochito: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "empatados", label: "J.E.", title: "Empatados" },
    { key: "a_favor", label: "P.F.", title: "Puntos a favor" },
    { key: "en_contra", label: "P.C.", title: "Puntos en contra" },
    { key: "diferencia", label: "DIF.", title: "Diferencia" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
  voleibol: [
    { key: "jugados", label: "J.J.", title: "Jugados" },
    { key: "ganados", label: "J.G.", title: "Ganados" },
    { key: "perdidos", label: "J.P.", title: "Perdidos" },
    { key: "a_favor", label: "S.F.", title: "Sets a favor" },
    { key: "en_contra", label: "S.C.", title: "Sets en contra" },
    { key: "diferencia", label: "D.S.", title: "Diferencia de sets" },
    { key: "puntos", label: "PTS.", title: "Puntos" },
  ],
};

export function sportLabel(keyOrName: string): string {
  return SPORT_LABELS[keyOrName] ?? keyOrName;
}

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

export function standingsColumnsFor(sportKey: string): StandingColumn[] {
  return STANDINGS_COLUMNS[sportKey] ?? STANDINGS_COLUMNS.soccer!;
}
