"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button
      type="button"
      className="print:hidden"
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
