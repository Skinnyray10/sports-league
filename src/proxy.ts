import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Nota: en Next.js 16 el archivo `middleware.ts` fue renombrado a `proxy.ts`
// y la función exportada pasó de `middleware` a `proxy`.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Ejecuta el proxy en todas las rutas excepto:
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico
     * - archivos de imagen comunes
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
