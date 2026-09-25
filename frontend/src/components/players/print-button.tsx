"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button
      type="button"
      className="rounded-[2px] bg-primary text-foreground hover:bg-foreground hover:text-background print:hidden"
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
