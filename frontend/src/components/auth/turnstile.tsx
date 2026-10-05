"use client";

import { useEffect, useRef } from "react";
import Script from "next/script";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

/**
 * Widget de Cloudflare Turnstile. Solo se muestra si hay
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY; inyecta `cf-turnstile-response` en el form.
 * `resetKey` cambia tras cada envío: el token es de un solo uso.
 */
export function Turnstile({ resetKey }: { resetKey?: unknown }) {
  const ref = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);

  function mount() {
    if (!SITE_KEY || !ref.current || !window.turnstile || widgetId.current) return;
    widgetId.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      language: "es",
      theme: "light",
    });
  }

  useEffect(() => {
    mount();
    return () => {
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
      }
      widgetId.current = null;
    };
  }, []);

  useEffect(() => {
    if (widgetId.current && window.turnstile) {
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onReady={mount}
      />
      <div ref={ref} className="min-h-[65px]" />
    </>
  );
}
