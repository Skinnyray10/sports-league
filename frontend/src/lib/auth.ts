import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Devuelve el usuario de la sesión actual, o `null` si no hay sesión.
 */
export async function getUser(): Promise<User | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Exige un usuario autenticado. Redirige a `/login` si no hay sesión.
 */
export async function requireUser(options?: {
  /** Path al que volver tras login (query `next`). */
  next?: string;
}): Promise<User> {
  const user = await getUser();
  if (!user) {
    const next = options?.next;
    const loginUrl = next
      ? `/login?next=${encodeURIComponent(next)}`
      : "/login";
    redirect(loginUrl);
  }
  return user;
}
