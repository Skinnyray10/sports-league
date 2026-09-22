import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getUser } from "@/lib/auth";
import { listUserOrganizations } from "@/lib/org";

type LoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { next } = await searchParams;
  const user = await getUser();

  if (user) {
    if (next?.startsWith("/") && !next.startsWith("//")) {
      redirect(next);
    }
    const orgs = await listUserOrganizations();
    redirect(orgs[0] ? `/${orgs[0].slug}` : "/onboarding");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Iniciar sesión</h1>
        <p className="text-[0.9375rem] text-muted-foreground">
          Entra para administrar tu liga.
        </p>
      </div>
      <LoginForm next={next} />
    </div>
  );
}
