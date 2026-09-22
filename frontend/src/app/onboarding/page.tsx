import { AuthShell } from "@/components/auth/auth-shell";
import { CreateOrgForm } from "@/components/auth/create-org-form";
import { requireUser } from "@/lib/auth";

export default async function OnboardingPage() {
  await requireUser({ next: "/onboarding" });

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Crea tu organización
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground">
            Es el espacio donde vivirán tus equipos, torneos y partidos. Quedas
            como administrador y desde ahí invitas al resto.
          </p>
        </div>
        <CreateOrgForm />
      </div>
    </AuthShell>
  );
}
