"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homePathAfterAuth } from "@/lib/org";
import { clientIp, hit } from "@/lib/rate-limit";
import {
  operateDeepLink,
  orgSlugFromPath,
  safeNextPath,
} from "@/lib/safe-redirect";
import { getSiteUrl } from "@/lib/site-url";
import type { MembershipRole } from "@/types/database";

export type AuthField =
  | "full_name"
  | "username"
  | "email"
  | "phone"
  | "organization_id"
  | "club_id"
  | "requested_role"
  | "password"
  | "password_confirm";

export type AuthActionState = {
  error: string | null;
  /** Resultado correcto que aún no navega a ningún lado (p. ej. confirmar correo). */
  notice: string | null;
  /** Campo responsable del error, para marcarlo con aria-invalid. */
  field?: AuthField;
  /** Valores no sensibles para repoblar el formulario tras un error. */
  values?: Partial<Record<AuthField, string>>;
};

const MINUTE = 60_000;

function captchaToken(formData: FormData): string | undefined {
  const token = formData.get("cf-turnstile-response");
  return typeof token === "string" && token.length > 0 ? token : undefined;
}

/** Política mínima: 8–72 caracteres con letras y números (igual que config.toml). */
function passwordProblem(password: string): string | null {
  if (password.length < 8) return "La contraseña necesita al menos 8 caracteres.";
  if (password.length > 72) return "La contraseña puede tener como máximo 72 caracteres.";
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    return "La contraseña debe combinar letras y números.";
  }
  return null;
}

/**
 * Tras auth: deep-links de operate se respetan; `/p/…` y rutas genéricas
 * llevan al home por rol (admin → panel, delegado → jugadores, árbitro → cédula).
 */
async function redirectAfterAuth(next: string | null) {
  const deepLink = operateDeepLink(next);
  if (deepLink) {
    redirect(deepLink);
  }

  const safe = safeNextPath(next);
  const preferredSlug = safe ? orgSlugFromPath(safe) : null;
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
  if (message.includes("captcha")) {
    return "Completa la verificación anti-bots e inténtalo de nuevo.";
  }
  if (message.includes("weak") || message.includes("pwned") || message.includes("leaked")) {
    return "Esa contraseña es muy débil o apareció en filtraciones. Elige otra.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Demasiados intentos seguidos. Espera un minuto y vuelve a intentarlo.";
  }
  return fallback;
}

const TOO_MANY: AuthActionState = {
  error: "Demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.",
  notice: null,
};

export async function signIn(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "") || null;
  const values = { email };

  if (!email || !password) {
    return {
      error: "Escribe tu correo y tu contraseña para continuar.",
      notice: null,
      field: email ? "password" : "email",
      values,
    };
  }

  const ip = await clientIp();
  if (
    !hit(`signin:ip:${ip}`, 30, 10 * MINUTE) ||
    !hit(`signin:acct:${ip}:${email.toLowerCase()}`, 8, 10 * MINUTE)
  ) {
    return { ...TOO_MANY, values };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: { captchaToken: captchaToken(formData) },
  });

  if (error) {
    return {
      error: authErrorMessage(
        error.message,
        "No pudimos iniciar tu sesión. Inténtalo de nuevo en un momento."
      ),
      notice: null,
      values,
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

  const values: AuthActionState["values"] = {
    full_name: fullName,
    username,
    email,
    phone: phone ?? "",
    organization_id: organizationId,
    club_id: clubId ?? "",
    requested_role: requestedRole,
  };
  const fail = (error: string, field?: AuthField): AuthActionState => ({
    error,
    notice: null,
    field,
    values,
  });

  if (!fullName) return fail("Escribe tu nombre completo.", "full_name");
  if (fullName.length > 120) return fail("El nombre puede tener como máximo 120 caracteres.", "full_name");
  if (!username) return fail("Elige un nombre de usuario.", "username");
  if (!/^[a-zA-Z0-9._-]{3,40}$/.test(username)) {
    return fail("El usuario debe tener 3 a 40 letras, números, puntos o guiones.", "username");
  }
  if (!email || email.length > 254) return fail("Escribe un correo válido.", "email");
  if (phone && phone.length > 30) return fail("El teléfono es demasiado largo.", "phone");
  if (!organizationId) return fail("Elige la liga a la que quieres unirte.", "organization_id");
  if (requestedRole !== "team_manager" && requestedRole !== "referee") {
    return fail("Solo puedes solicitar acceso como Delegado o Árbitro.", "requested_role");
  }
  if (requestedRole === "team_manager" && !clubId) {
    return fail("Como Delegado, elige la empresa o club al que perteneces.", "club_id");
  }
  const weak = passwordProblem(password);
  if (weak) return fail(weak, "password");

  const ip = await clientIp();
  if (!hit(`signup:ip:${ip}`, 5, 60 * MINUTE)) {
    return { ...TOO_MANY, values };
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
      captchaToken: captchaToken(formData),
    },
  });

  if (error) {
    return fail(
      authErrorMessage(
        error.message,
        "No pudimos crear tu cuenta. Inténtalo de nuevo en un momento."
      )
    );
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

/** Envía el correo de recuperación. Responde igual exista o no la cuenta. */
export async function requestPasswordReset(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim().slice(0, 254);
  const values = { email };
  if (!email) {
    return { error: "Escribe el correo de tu cuenta.", notice: null, field: "email", values };
  }

  const ip = await clientIp();
  if (
    !hit(`reset:ip:${ip}`, 10, 60 * MINUTE) ||
    !hit(`reset:acct:${email.toLowerCase()}`, 3, 60 * MINUTE)
  ) {
    return { ...TOO_MANY, values };
  }

  const supabase = await createClient();
  const site = await getSiteUrl();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${site}/auth/confirm?next=/reset-password`,
    captchaToken: captchaToken(formData),
  });

  if (error && error.message.toLowerCase().includes("captcha")) {
    return { error: authErrorMessage(error.message, ""), notice: null, values };
  }

  return {
    error: null,
    notice: `Si ${email} tiene una cuenta, te enviamos un enlace para crear una nueva contraseña. Revisa también la carpeta de spam.`,
  };
}

/** Cambia la contraseña de la sesión abierta por el enlace de recuperación. */
export async function updatePassword(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("password_confirm") ?? "");

  const weak = passwordProblem(password);
  if (weak) return { error: weak, notice: null, field: "password" };
  if (password !== confirm) {
    return {
      error: "Las contraseñas no coinciden.",
      notice: null,
      field: "password_confirm",
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      error: "El enlace expiró. Solicita uno nuevo desde «¿Olvidaste tu contraseña?».",
      notice: null,
    };
  }

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    return {
      error: authErrorMessage(error.message, "No pudimos cambiar la contraseña. Inténtalo de nuevo."),
      notice: null,
      field: "password",
    };
  }

  await redirectAfterAuth(null);
  return { error: null, notice: null };
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
