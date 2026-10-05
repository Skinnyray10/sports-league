export { cn } from "cn"

/** Supabase devuelve relaciones embebidas como objeto o arreglo; normaliza a uno. */
export function unwrapOne<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}
