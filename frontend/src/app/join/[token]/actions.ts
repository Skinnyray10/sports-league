"use server";

import { redirect } from "next/navigation";
import { acceptInvite as acceptInviteHelper } from "@/lib/org";

export type JoinActionState = {
  error: string | null;
};

export async function acceptInviteAction(
  _prev: JoinActionState,
  formData: FormData
): Promise<JoinActionState> {
  const token = String(formData.get("token") ?? "").trim();

  if (!token) {
    return {
      error: "Al enlace le falta el código. Ábrelo otra vez desde tu invitación.",
    };
  }

  try {
    const result = await acceptInviteHelper(token);
    redirect(`/${result.organizationSlug}`);
  } catch (err) {
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
        : "";

    if (message.includes("expired")) {
      return {
        error:
          "La invitación venció. Pídele al administrador de la organización un enlace nuevo.",
      };
    }
    if (message.includes("already accepted")) {
      return {
        error:
          "Esta invitación ya se usó. Si necesitas acceso, pídele al administrador que te invite de nuevo.",
      };
    }
    if (message.includes("not found") || message.includes("invalid")) {
      return {
        error:
          "No encontramos esa invitación. Revisa que el enlace esté completo.",
      };
    }
    if (message.includes("not authenticated") || message.includes("JWT")) {
      return {
        error: "Tu sesión expiró. Inicia sesión y vuelve a abrir el enlace.",
      };
    }
    return {
      error: "No pudimos aceptar la invitación. Inténtalo de nuevo.",
    };
  }
}
