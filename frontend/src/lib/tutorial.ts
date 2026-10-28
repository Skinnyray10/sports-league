/**
 * Tutorial de primer uso del Administrador.
 *
 * El estado vive en `user_metadata.admin_tutorial` de Supabase Auth (por
 * usuario, no en el navegador):
 * - sin valor  → nunca lo ha visto: se muestra la bienvenida.
 * - "started"  → aceptó la guía: se muestran las misiones.
 * - "done"     → la saltó o la terminó: no vuelve a salir.
 */
export type AdminTutorialState = "started" | "done" | null;

export function adminTutorialState(
  metadata: Record<string, unknown> | undefined
): AdminTutorialState {
  const value = metadata?.admin_tutorial;
  return value === "started" || value === "done" ? value : null;
}

/** Textos del foco que aparece sobre el botón al llegar con `?guia=`. */
export const GUIDE_HINTS: Record<string, { title: string; description: string }> = {
  club: {
    title: "Agrega tu primer club",
    description: "Toca este botón. Un club es la institución o empresa que inscribe equipos.",
  },
  torneo: {
    title: "Crea tu torneo",
    description: "Toca este botón y ponle nombre y temporada. Después agregarás una división.",
  },
  division: {
    title: "Agrega una división",
    description: "Elige deporte, rama y categoría, y toca «Agregar división».",
  },
  equipo: {
    title: "Da de alta los equipos",
    description: "Toca este botón para agregar cada equipo. Necesitas al menos 2 por división.",
  },
  rol: {
    title: "Genera el rol de juegos",
    description: "Con un toque la app arma todos los enfrentamientos, jornada por jornada.",
  },
  jornada: {
    title: "Arma la jornada",
    description: "Después de la junta, pon día, hora y cancha a cada partido y toca guardar.",
  },
  castigo: {
    title: "Registra un castigado",
    description: "Toca este botón, elige al jugador y cuántos juegos se pierde.",
  },
};
