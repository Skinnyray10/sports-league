import { requireUser } from "@/lib/auth";

/**
 * Authenticated app shell. Org membership is validated in `[orgSlug]/layout`.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireUser();
  return children;
}
