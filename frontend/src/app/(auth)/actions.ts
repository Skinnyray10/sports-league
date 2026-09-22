"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listUserOrganizations } from "@/lib/org";

export type AuthActionState = {
  error: string | null;
  /** Resultado correcto que aún no navega a ningún lado (p. ej. confirmar correo). */
  notice: string | null;
};

function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

async function redirectAfterAuth(next: string | null) {
  const safe = safeNextPath(next);
  if (safe) {
    redirect(safe);
  }

  const orgs = await listUserOrganizations();
  if (orgs.length === 0) {
    redirect("/onboarding");
  }
  redirect(`/${orgs[0]!.slug}`);
}

/**
 * Supabase responde en inglés y con texto pensado para desarrolladores.
 * Traducimos lo conocido y caemos a un mensaje accionable en vez de filtrarlo.
 */
function authErrorMessage(raw: string, fallback: string): string {
  const message = raw.toLowerCase();

  if (message.includes("invalid login credentials")) {
    return "El correo o la contraseña no coinciden. Inténtalo de nuevo o crea una cuenta.";
  }
  if (message.includes("email not confirmed")) {
    return "Todavía no confirmas tu correo. Abre el enlace que te enviamos y vuelve a entrar.";
  }
  if (message.includes("user already registered")) {
    return "Ya existe una cuenta con ese correo. Inicia sesión en vez de crear una nueva.";
  }
  if (message.includes("invalid format") || message.includes("valid email")) {
    return "Revisa el correo: parece que le falta algo.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.";
  }
  return fallback;
}

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || null;

  if (!email || !password) {
    return {
      error: "Escribe tu correo y tu contraseña para continuar.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      error: authErrorMessage(
        error.message,
        "No pudimos iniciar tu sesión. Inténtalo de nuevo en un momento."
      ),
      notice: null,
    };
  }

  await redirectAfterAuth(next);
  return { error: null, notice: null };
}

export async function signUp(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || null;

  if (!email || !password) {
    return {
      error: "Escribe un correo y una contraseña para crear tu cuenta.",
      notice: null,
    };
  }
  if (password.length < 8) {
    return {
      error: "La contraseña necesita al menos 8 caracteres.",
      notice: null,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({ email, password });

  if (error) {
    return {
      error: authErrorMessage(
        error.message,
        "No pudimos crear tu cuenta. Inténtalo de nuevo en un momento."
      ),
      notice: null,
    };
  }

  if (!data.session) {
    return {
      error: null,
      notice: `Listo, creamos tu cuenta. Te enviamos un correo a ${email}: ábrelo para confirmarla y luego inicia sesión.`,
    };
  }

  await redirectAfterAuth(next);
  return { error: null, notice: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
