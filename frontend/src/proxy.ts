import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

/**
 * Rutas que no requieren sesión.
 * `(app)/[orgSlug]/…` vive en URLs `/{orgSlug}/…` (el group no aparece).
 */
function isPublicPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/login" || pathname === "/signup") {
    return true;
  }
  if (pathname.startsWith("/join/")) {
    return true;
  }
  return false;
}

/**
 * Rutas protegidas: `/onboarding` y el shell `(app)` (`/{orgSlug}/…`).
 */
function isProtectedPath(pathname: string): boolean {
  if (pathname === "/onboarding" || pathname.startsWith("/onboarding/")) {
    return true;
  }
  // Cualquier path no público es el área autenticada de la app (org slug).
  return !isPublicPath(pathname);
}

// Nota: en Next.js 16 el archivo `middleware.ts` fue renombrado a `proxy.ts`
// y la función exportada pasó de `middleware` a `proxy`.
export async function proxy(request: NextRequest) {
  const { response, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    const redirectResponse = NextResponse.redirect(url);
    // Conservar cookies de refresh de sesión en el redirect.
    response.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie.name, cookie.value);
    });
    return redirectResponse;
  }

  return response;
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
