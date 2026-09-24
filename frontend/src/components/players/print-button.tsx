"use client";

import { Button } from "@/components/ui/button";

export function PrintButton({ label = "Imprimir" }: { label?: string }) {
  return (
    <Button
      type="button"
      className="rounded-[2px] bg-[#00B7FF] text-[#0A0A0A] hover:bg-[#0A0A0A] hover:text-white print:hidden"
      onClick={() => window.print()}
    >
      {label}
    </Button>
  );
}
