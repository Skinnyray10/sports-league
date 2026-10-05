"use client";

import { useParams } from "next/navigation";
import { SegmentError } from "@/components/states/segment-error";

export default function PublicOrgError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const { orgSlug } = useParams<{ orgSlug: string }>();
  return (
    <SegmentError
      error={error}
      retry={retry}
      homeHref={`/p/${orgSlug}`}
      homeLabel="Inicio de la liga"
    />
  );
}
