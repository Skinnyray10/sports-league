"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathAfterAuth } from "@/lib/org";
import type { MembershipRole } from "@/types/database";

export type AuthActionState = {
  error: string | null;
  /** Resultado correcto que aún no navega a ningún lado (p. ej. confirmar correo). */
  notice: string | null;
};

const RESERVED_ROOTS = new Set([
  "login",
  "signup",
  "onboarding",
  "p",
  "c",
  "join",
  "pending",
]);

function safeNextPath(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return null;
  }
  return next;
}

function orgSlugFromPath(path: string): string | null {
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment || RESERVED_ROOTS.has(segment)) {
    return null;
  }
  return segment;
}

/**
 * Tras auth: deep-links de operate se respetan; `/p/…` y rutas genéricas
 * llevan al home por rol (admin → panel, delegado → jugadores, árbitro → cédula).
 */
async function redirectAfterAuth(next: string | null) {
  const safe = safeNextPath(next);
  const preferredSlug = safe ? orgSlugFromPath(safe) : null;

  if (
    safe &&
    preferredSlug &&
    !safe.startsWith("/p/") &&
    !safe.startsWith("/c/") &&
    safe !== `/${preferredSlug}`
  ) {
    redirect(safe);
  }

  redirect(await homePathAfterAuth(preferredSlug));
}

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

/**
 * Registro de Delegado o Árbitro: crea cuenta + solicitud pendiente.
 * Los jugadores no usan este flujo.
 */
export async function signUpRequest(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const fullName = String(formData.get("full_name") ?? "").trim();
  const username = String(formData.get("username") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim() || null;
  const organizationId = String(formData.get("organization_id") ?? "").trim();
  const clubId = String(formData.get("club_id") ?? "").trim() || null;
  const requestedRole = String(
    formData.get("requested_role") ?? ""
  ).trim() as MembershipRole;
  const password = String(formData.get("password") ?? "");

  if (!fullName || !username || !email || !organizationId || !password) {
    return {
      error: "Completa nombre, usuario, correo, liga y contraseña.",
      notice: null,
    };
  }
  if (password.length < 8) {
    return {
      error: "La contraseña necesita al menos 8 caracteres.",
      notice: null,
    };
  }
  if (
    requestedRole !== "team_manager" &&
    requestedRole !== "referee"
  ) {
    return {
      error: "Solo puedes solicitar acceso como Delegado o Árbitro.",
      notice: null,
    };
  }
  if (requestedRole === "team_manager" && !clubId) {
    return {
      error: "Como Delegado, elige la empresa o club al que perteneces.",
      notice: null,
    };
  }

  const nameParts = fullName.split(/\s+/);
  const nombre = nameParts[0] ?? fullName;
  const apellido = nameParts.slice(1).join(" ") || username;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido, username },
    },
  });

  if (error) {
    return {
      error: authErrorMessage(
        error.message,
        "No pudimos crear tu cuenta. Inténtalo de nuevo en un momento."
      ),
      notice: null,
    };
  }

  if (!data.session || !data.user) {
    return {
      error: null,
      notice: `Listo, creamos tu cuenta. Confirma el correo en ${email} e inicia sesión: tu solicitud quedará pendiente de aprobación.`,
    };
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ nombre, apellido })
    .eq("id", data.user.id);

  if (profileError) {
    return {
      error: "Tu cuenta se creó, pero no pudimos guardar el perfil. Intenta iniciar sesión.",
      notice: null,
    };
  }

  const { error: requestError } = await supabase
    .from("membership_requests")
    .insert({
      organization_id: organizationId,
      club_id: clubId,
      user_id: data.user.id,
      email,
      full_name: fullName,
      username,
      phone,
      requested_role: requestedRole,
      status: "pendiente",
    });

  if (requestError) {
    return {
      error:
        "Tu cuenta se creó, pero no pudimos registrar la solicitud. Escribe al administrador de la liga.",
      notice: null,
    };
  }

  redirect("/pending");
  return { error: null, notice: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
