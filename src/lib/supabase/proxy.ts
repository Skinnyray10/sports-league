import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { User } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export type SessionUpdateResult = {
  response: NextResponse;
  user: User | null;
};

/**
 * Refresca la sesión de Supabase en cada request.
 * Se invoca desde `src/proxy.ts` (antes `middleware.ts` en Next.js < 16).
 */
export async function updateSession(
  request: NextRequest
): Promise<SessionUpdateResult> {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANTE: no ejecutar lógica entre createServerClient y getUser().
  // Un error simple puede hacer muy difícil depurar problemas de sesión.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { response: supabaseResponse, user };
}
