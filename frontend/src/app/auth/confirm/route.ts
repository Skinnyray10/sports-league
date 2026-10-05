import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Destino de los enlaces de correo de Supabase (recuperación, confirmación).
 * Acepta `?code=` (PKCE) o `?token_hash=&type=` y redirige a `next` interno.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const next = safeNextPath(searchParams.get("next")) ?? "/";
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const supabase = await createClient();
  let ok = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    ok = !error;
  }

  const target = request.nextUrl.clone();
  target.search = "";
  if (ok) {
    const [pathname, query] = next.split("?");
    target.pathname = pathname ?? "/";
    if (query) target.search = `?${query}`;
  } else {
    target.pathname = "/forgot-password";
    target.searchParams.set("error", "enlace");
  }
  return NextResponse.redirect(target);
}
