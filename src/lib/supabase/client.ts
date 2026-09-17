import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente de Supabase para usar en Client Components ("use client").
 * Usa las variables públicas expuestas al navegador.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
