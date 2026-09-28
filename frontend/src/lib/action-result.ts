import { unstable_rethrow } from "next/navigation";

export type ActionResult = { ok: true } | { ok: false; error: string };

/** Códigos de Postgres que llegan vía PostgREST y sí le dicen algo a la persona. */
const PG_MESSAGES: Record<string, string> = {
  // foreign_key_violation
  "23503":
    "No se puede porque hay registros que dependen de esto. Quita primero esas relaciones.",
  // check_violation
  "23514":
    "Algún dato no cumple las reglas del torneo. Revisa lo que capturaste.",
  // not_null_violation
  "23502": "Falta un dato obligatorio.",
  // insufficient_privilege (RLS)
  "42501":
    "Tu rol no tiene permiso para hacer esto en esta organización.",
};

function errorCode(error: unknown): string {
  if (error && typeof error === "object" && "code" in error) {
    return String((error as { code: unknown }).code ?? "");
  }
  return "";
}

/**
 * Convierte un error de Supabase en algo que la persona pueda leer y accionar.
 *
 * El mensaje crudo de Postgres viene en inglés y habla de constraints y tablas,
 * así que nunca se muestra: solo se traducen los casos accionables y el resto
 * cae en `fallback`.
 */
export function actionError(
  error: unknown,
  fallback: string,
  /** Mensaje para violación de unicidad, donde el contexto lo sabe quien llama. */
  conflictMessage?: string
): ActionResult {
  // redirect() y notFound() viajan como excepción: no son fallos que mostrar.
  unstable_rethrow(error);

  const code = errorCode(error);

  if (code === "23505") {
    return {
      ok: false,
      error: conflictMessage ?? "Ya existe un registro con esos datos.",
    };
  }

  const known = PG_MESSAGES[code];
  if (known) {
    return { ok: false, error: known };
  }

  return { ok: false, error: fallback };
}
