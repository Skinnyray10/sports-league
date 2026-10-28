"use server";

import type { ActionResult } from "@/lib/action-result";
import type { AdminTutorialState } from "@/lib/tutorial";
import { createClient } from "@/lib/supabase/server";

const STATES: AdminTutorialState[] = ["started", "done", null];

/** Guarda en la cuenta del usuario en qué punto va su tutorial. */
export async function setAdminTutorial(
  state: AdminTutorialState
): Promise<ActionResult> {
  if (!STATES.includes(state)) {
    return { ok: false, error: "Estado no válido." };
  }
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { admin_tutorial: state },
  });
  if (error) {
    return { ok: false, error: "No se pudo guardar. Intenta de nuevo." };
  }
  return { ok: true };
}
