"use client";

import { useEffect } from "react";
import Link from "next/link";
import { StatusPanel } from "@/components/states/status-panel";
import { Button, buttonVariants } from "@/components/ui/button";

type SegmentErrorProps = {
  error: Error & { digest?: string };
  retry: () => void;
  homeHref: string;
  homeLabel: string;
  headingLevel?: "h1" | "h2";
};

export function SegmentError({
  error,
  retry,
  homeHref,
  homeLabel,
  headingLevel,
}: SegmentErrorProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="py-10">
      <StatusPanel
        headingLevel={headingLevel}
        eyebrow="Error"
        title="No pudimos cargar esta sección"
        description={
          <>
            Puede ser un problema de conexión o del servidor. Tus datos no se
            perdieron.
            {error.digest ? (
              <span className="mt-2 block font-mono text-xs">
                Código: {error.digest}
              </span>
            ) : null}
          </>
        }
        actions={
          <>
            <Button type="button" onClick={() => retry()}>
              Reintentar
            </Button>
            <Link href={homeHref} className={buttonVariants({ variant: "outline" })}>
              {homeLabel}
            </Link>
          </>
        }
      />
    </div>
  );
}
