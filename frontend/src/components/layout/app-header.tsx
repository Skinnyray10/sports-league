import Link from "next/link";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { UserMenu } from "@/components/layout/user-menu";
import type { NavItem } from "@/lib/nav";
import type { Organization } from "@/lib/org";

type AppHeaderProps = {
  email: string | undefined;
  organizations: Organization[];
  currentSlug: string;
  modules: NavItem[];
};

export function AppHeader({
  email,
  organizations,
  currentSlug,
  modules,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-card/80 px-4 py-2 backdrop-blur-[2px] md:px-6 md:py-3">
      <Breadcrumbs orgSlug={currentSlug} modules={modules} />
      <div className="flex shrink-0 items-center gap-4">
        <nav aria-label="Accesos" className="hidden items-center gap-4 text-sm lg:flex">
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
      </div>
    </header>
  );
}
