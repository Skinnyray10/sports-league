"use client";

import { SegmentError } from "@/components/states/segment-error";

export default function CredentialError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <main className="px-4">
      <SegmentError error={error} retry={retry} homeHref="/" homeLabel="Ir al inicio" />
    </main>
  );
}
