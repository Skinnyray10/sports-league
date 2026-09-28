"use server";

import { redirect } from "next/navigation";
import { createOrganization } from "@/lib/org";

export type OnboardingActionState = {
  error: string | null;
};

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function createOrganizationAction(
  _prev: OnboardingActionState,
  formData: FormData
): Promise<OnboardingActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const slugInput = String(formData.get("slug") ?? "").trim();
  const slug = slugify(slugInput || name);

  if (!name) {
    return { error: "Escribe el nombre de tu organización." };
  }
  if (!slug || slug.length < 2) {
    return {
      error:
        "La dirección web necesita al menos 2 caracteres: letras, números o guiones.",
    };
  }
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    return {
      error:
        "La dirección web solo admite minúsculas, números y guiones. Quita acentos, espacios y símbolos.",
    };
  }

  try {
    const org = await createOrganization({ name, slug });
    redirect(`/${org.slug}`);
  } catch (err) {
    // Next.js redirect() throws; rethrow so the navigation completes.
    if (
      err &&
      typeof err === "object" &&
      "digest" in err &&
      typeof (err as { digest?: unknown }).digest === "string" &&
      String((err as { digest: string }).digest).startsWith("NEXT_REDIRECT")
    ) {
      throw err;
    }

    const message =
      err && typeof err === "object" && "message" in err
        ? String((err as { message: unknown }).message)
        : String(err);
    const code =
      err && typeof err === "object" && "code" in err
        ? String((err as { code: unknown }).code)
        : "";

    if (
      code === "23505" ||
      message.toLowerCase().includes("duplicate") ||
      message.toLowerCase().includes("unique")
    ) {
      return {
        error: `La dirección "${slug}" ya está ocupada. Elige otra.`,
      };
    }
    return {
      error: "No pudimos crear la organización. Inténtalo de nuevo.",
    };
  }
}
