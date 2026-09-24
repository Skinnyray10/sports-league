import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getUser } from "@/lib/auth";
import { homePathAfterAuth, listUserOrganizations } from "@/lib/org";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const user = await getUser();

  if (user) {
    if (next?.startsWith("/") && !next.startsWith("//") && !next.startsWith("/p/")) {
      const segment = next.split("/").filter(Boolean)[0];
      if (
        segment &&
        !["login", "signup", "onboarding", "c", "join"].includes(segment) &&
        next !== `/${segment}`
      ) {
        redirect(next);
      }
    }
    const orgs = await listUserOrganizations();
    if (orgs.length === 0) {
      redirect("/onboarding");
    }
    redirect(await homePathAfterAuth(orgs[0]!.slug));
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-[0.9375rem] text-muted-foreground">
          Solo para administración, delegados y árbitros. El público consulta
          sin cuenta.
        </p>
      </div>
      <LoginForm next={next} />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/" className="font-medium text-foreground underline">
          Volver a la vista pública
        </Link>
      </p>
    </div>
  );
}
