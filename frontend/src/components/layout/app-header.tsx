import Link from "next/link";
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
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-3 backdrop-blur-[2px] md:px-6">
      <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <Link
          href={`/${currentSlug}/tournaments`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Torneos
        </Link>
        <Link
          href={`/p/${currentSlug}`}
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Vista pública
        </Link>
        <Link
          href="/"
          className="font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Cambiar de liga
        </Link>
      </nav>
      <UserMenu
        email={email}
        organizations={organizations}
        currentSlug={currentSlug}
      />
    </header>
  );
}
