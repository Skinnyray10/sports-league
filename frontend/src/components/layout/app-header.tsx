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
    <header className="flex items-center justify-end gap-4 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-[2px] md:px-6">
      <UserMenu
        email={email}
        organizations={organizations}
        currentSlug={currentSlug}
      />
    </header>
  );
}
