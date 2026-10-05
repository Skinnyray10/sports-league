import { z } from "zod";

function storageOrigin(): string | null {
  try {
    return process.env.NEXT_PUBLIC_SUPABASE_URL
      ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).origin
      : null;
  } catch {
    return null;
  }
}

/** Texto obligatorio, recortado, con longitud máxima. */
export function requiredText(message: string, max = 120) {
  return z
    .string()
    .trim()
    .min(1, message)
    .max(max, `Usa como máximo ${max} caracteres.`);
}

/** Texto opcional: cadena vacía se convierte en null. */
export function optionalText(max = 500) {
  return z
    .string()
    .trim()
    .max(max, `Usa como máximo ${max} caracteres.`)
    .transform((v) => (v.length > 0 ? v : null));
}

export const uuidField = (message: string) => z.string().trim().uuid(message);

export const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v.length > 0 ? v : null))
  .refine((v) => v === null || z.string().uuid().safeParse(v).success, {
    message: "Selección no válida.",
  });

/**
 * URL de imagen opcional. Solo se aceptan imágenes servidas por el Storage de
 * Supabase del proyecto: evita que cada visitante cargue hosts de terceros.
 */
export const imageUrl = z
  .string()
  .trim()
  .max(1000, "La URL es demasiado larga.")
  .transform((v) => (v.length > 0 ? v : null))
  .refine(
    (v) => {
      if (v === null) return true;
      try {
        const url = new URL(v);
        const allowed = storageOrigin();
        return (
          url.protocol === "https:" &&
          allowed !== null &&
          url.origin === allowed &&
          url.pathname.startsWith("/storage/v1/")
        );
      } catch {
        return false;
      }
    },
    { message: "La imagen debe estar subida al almacenamiento de la liga (URL https de Supabase Storage)." }
  );

/** Devuelve un error legible si algún texto supera su límite. */
export function lengthError(
  fields: Array<[value: string | null | undefined, max: number]>
): { ok: false; error: string } | null {
  for (const [value, max] of fields) {
    if (value && value.length > max) {
      return { ok: false, error: `Usa como máximo ${max} caracteres.` };
    }
  }
  return null;
}

export type ParseResult<T> = { ok: true; data: T } | { ok: false; error: string };

/** Valida un FormData contra un esquema de objeto y devuelve el primer error legible. */
export function parseForm<T extends z.ZodRawShape>(
  shape: T,
  formData: FormData
): ParseResult<z.output<z.ZodObject<T>>> {
  const raw: Record<string, string> = {};
  for (const key of Object.keys(shape)) {
    const value = formData.get(key);
    raw[key] = typeof value === "string" ? value : "";
  }
  const result = z.object(shape).safeParse(raw);
  if (!result.success) {
    return { ok: false, error: result.error.issues[0]?.message ?? "Revisa los datos." };
  }
  return { ok: true, data: result.data };
}
