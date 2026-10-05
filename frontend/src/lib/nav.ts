import type { MembershipRole } from "@/types/database";

export type NavItem = {
  href: string;
  label: string;
  bandClass: string;
};

export type OrgModule = NavItem & {
  key: string;
  description: string;
};

type ModuleDef = Omit<OrgModule, "href">;

const ADMIN_MODULES: ModuleDef[] = [
  { key: "clubs", label: "Clubes", description: "Instituciones o empresas que inscriben equipos.", bandClass: "bg-band-teams" },
  { key: "tournaments", label: "Torneos", description: "Divisiones, grupos y estructura de competencia.", bandClass: "bg-band-tournaments" },
  { key: "teams", label: "Equipos", description: "Equipos por club, deporte, rama y categoría.", bandClass: "bg-band-teams" },
  { key: "matches", label: "Partidos", description: "Programa la jornada, asigna árbitros y gestiona aplazos.", bandClass: "bg-band-matches" },
  { key: "standings", label: "Posiciones", description: "Tabla calculada por división.", bandClass: "bg-band-standings" },
  { key: "approvals", label: "Credenciales", description: "Aprueba jugadores y marca elegibilidad.", bandClass: "bg-band-matches" },
  { key: "members", label: "Solicitudes", description: "Aprueba Delegados y Árbitros que se registraron.", bandClass: "bg-muted-foreground" },
  { key: "settings", label: "Configuración", description: "Marca, deportes, ramas y categorías.", bandClass: "bg-muted-foreground" },
];

const DELEGADO_MODULES: ModuleDef[] = [
  { key: "players", label: "Jugadores", description: "Registra a tu plantilla y revisa credenciales.", bandClass: "bg-band-teams" },
  { key: "matches", label: "Partidos", description: "Consulta tus partidos y cédulas.", bandClass: "bg-band-matches" },
  { key: "standings", label: "Posiciones", description: "Tabla de tu división.", bandClass: "bg-band-standings" },
];

const REFEREE_MODULES: ModuleDef[] = [
  { key: "referee", label: "Mis partidos", description: "Captura la cédula desde la cancha.", bandClass: "bg-band-matches" },
  { key: "standings", label: "Posiciones", description: "Consulta la tabla.", bandClass: "bg-band-standings" },
];

/** Módulos visibles para el conjunto de roles (una persona puede tener varios). */
export function modulesForRoles(
  orgSlug: string,
  roles: MembershipRole[]
): OrgModule[] {
  const defs: ModuleDef[] = [];
  if (roles.includes("admin")) defs.push(...ADMIN_MODULES);
  if (roles.includes("team_manager")) defs.push(...DELEGADO_MODULES);
  if (roles.includes("referee")) defs.push(...REFEREE_MODULES);

  const seen = new Set<string>();
  return defs
    .filter((def) => {
      if (seen.has(def.key)) return false;
      seen.add(def.key);
      return true;
    })
    .map((def) => ({ ...def, href: `/${orgSlug}/${def.key}` }));
}

export function publicNav(orgSlug: string): NavItem[] {
  return [
    { href: `/p/${orgSlug}`, label: "Inicio", bandClass: "bg-band-standings" },
    { href: `/p/${orgSlug}/rol`, label: "Rol de juegos", bandClass: "bg-band-matches" },
    { href: `/p/${orgSlug}/resultados`, label: "Resultados", bandClass: "bg-band-matches" },
    { href: `/p/${orgSlug}/estadisticas`, label: "Estadísticas", bandClass: "bg-band-standings" },
    { href: `/p/${orgSlug}/avisos`, label: "Avisos", bandClass: "bg-muted-foreground" },
  ];
}
