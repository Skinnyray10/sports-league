const RESERVED_ROOTS = new Set([
  "login",
  "signup",
  "onboarding",
  "forgot-password",
  "reset-password",
  "p",
  "c",
  "join",
  "pending",
  "api",
  "auth",
  "admin",
  "_next",
]);

const PLACEHOLDER_ORIGIN = "http://internal.invalid";

/**
 * Devuelve una ruta interna segura (`/algo?x=y#z`) o null.
 * Rechaza URLs absolutas, protocol-relative (`//`, `/\`), y caracteres de control.
 */
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next || typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//")) return null;
  if (/[\\\u0000-\u001f\u007f]/.test(next)) return null;

  let url: URL;
  try {
    url = new URL(next, PLACEHOLDER_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== PLACEHOLDER_ORIGIN) return null;

  return `${url.pathname}${url.search}${url.hash}`;
}

export function orgSlugFromPath(path: string): string | null {
  const segment = path.split("/").filter(Boolean)[0];
  if (!segment || RESERVED_ROOTS.has(segment)) return null;
  return segment;
}

/** Deep-link de operate (`/{orgSlug}/...`) que vale la pena respetar tras login. */
export function operateDeepLink(next: string | null | undefined): string | null {
  const safe = safeNextPath(next);
  if (!safe) return null;
  const slug = orgSlugFromPath(safe);
  if (!slug || safe === `/${slug}`) return null;
  return safe;
}

export function isReservedRoot(segment: string): boolean {
  return RESERVED_ROOTS.has(segment.toLowerCase());
}
