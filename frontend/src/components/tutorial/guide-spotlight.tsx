"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";
import { GUIDE_HINTS } from "@/lib/tutorial";

/**
 * Al llegar desde una misión (`?guia=equipo`, etc.) oscurece la pantalla y
 * resalta el botón marcado con `data-guia` para que la persona sepa dónde tocar.
 */
export function GuideSpotlight() {
  const guia = useSearchParams().get("guia");

  React.useEffect(() => {
    const hint = guia ? GUIDE_HINTS[guia] : undefined;
    if (!hint) return;

    const element = document.querySelector<HTMLElement>(`[data-guia="${guia}"]`);
    const tour = driver({
      popoverClass: "guia-popover",
      overlayOpacity: 0.6,
      stageRadius: 12,
      showButtons: ["close"],
      closeBtnLabel: "Cerrar",
    });
    tour.highlight({
      element: element ?? undefined,
      popover: { ...hint, side: "bottom", align: "start" },
    });

    // Al tocar lo resaltado, se quita el foco para que el formulario quede libre.
    const close = () => tour.destroy();
    element?.addEventListener("click", close, { once: true });
    return () => {
      element?.removeEventListener("click", close);
      tour.destroy();
    };
  }, [guia]);

  return null;
}
