import { UserMenu } from "@/components/layout/user-menu";
import type { Organization } from "@/lib/org";

type AppHeaderProps = {
  email: string | undefined;
  organizations: Organization[];
  currentSlug: string;
};

export function AppHeader({
  email,
  organizations,
  currentSlug,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-end gap-4 border-b border-border bg-card px-4 py-3 md:px-6">
      <UserMenu
        email={email}
        organizations={organizations}
        currentSlug={currentSlug}
      />
    </header>
  );
}
