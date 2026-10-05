"use client";

import { useRouter } from "next/navigation";
import { ChevronDownIcon, UserIcon } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Organization } from "@/lib/org";

type UserMenuProps = {
  email: string | undefined;
  organizations: Organization[];
  currentSlug: string;
};

export function UserMenu({ email, organizations, currentSlug }: UserMenuProps) {
  const router = useRouter();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            className="border-border bg-card"
            aria-label="Menú de cuenta"
          />
        }
      >
        <UserIcon className="size-4 sm:hidden" aria-hidden />
        <span className="hidden max-w-[10rem] truncate text-[0.8125rem] sm:inline">
          {email ?? "Mi cuenta"}
        </span>
        <ChevronDownIcon className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48 rounded-md">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="font-normal">
            <span className="block truncate text-xs text-muted-foreground">
              {email}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => router.push(`/${org.slug}`)}
            aria-current={org.slug === currentSlug ? "true" : undefined}
            className={org.slug === currentSlug ? "bg-muted font-semibold" : undefined}
          >
            {org.name}
            {org.slug === currentSlug ? (
              <span className="sr-only"> (liga actual)</span>
            ) : null}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/")}>
          Cambiar de liga
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push(`/p/${currentSlug}`)}>
          Vista pública
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/onboarding")}>
          Crear organización
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void signOut();
          }}
        >
          Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
