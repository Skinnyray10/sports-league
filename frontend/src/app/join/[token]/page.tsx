import Link from "next/link";
import { AcceptInviteForm } from "@/components/auth/accept-invite-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { buttonVariants } from "@/components/ui/button";
import { getUser } from "@/lib/auth";
import { cn } from "@/lib/utils";

type JoinPageProps = {
  params: Promise<{ token: string }>;
};

export default async function JoinPage({ params }: JoinPageProps) {
  const { token } = await params;
  const user = await getUser();
  const joinPath = `/join/${token}`;

  if (!user) {
    return (
      <AuthShell>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-2xl font-bold tracking-tight">
              Te invitaron a una organización
            </h1>
            <p className="text-[0.9375rem] text-muted-foreground">
              Necesitas una cuenta para aceptar la invitación. Al terminar
              volvemos a esta página.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Link
              href={`/login?next=${encodeURIComponent(joinPath)}`}
              className={cn(buttonVariants(), "rounded-sm")}
            >
              Iniciar sesión
            </Link>
            <Link
              href={`/signup?next=${encodeURIComponent(joinPath)}`}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "rounded-sm"
              )}
            >
              Crear cuenta
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Te invitaron a una organización
          </h1>
          <p className="text-[0.9375rem] text-muted-foreground">
            Al aceptar entras con el rol que te asignó quien te invitó.
          </p>
        </div>
        <AcceptInviteForm token={token} />
      </div>
    </AuthShell>
  );
}
