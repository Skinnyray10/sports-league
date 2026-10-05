import Link from "next/link";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { getUser } from "@/lib/auth";

export const metadata = { title: "Nueva contraseña" };

export default async function ResetPasswordPage() {
  const user = await getUser();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Nueva contraseña</h1>
        <p className="text-[0.9375rem] text-muted-foreground">
          {user
            ? `Elige una contraseña nueva para ${user.email ?? "tu cuenta"}.`
            : "Abre esta página desde el enlace que te enviamos por correo."}
        </p>
      </div>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <Link
          href="/forgot-password"
          className="font-medium text-foreground underline underline-offset-4"
        >
          Pedir un enlace nuevo
        </Link>
      )}
    </div>
  );
}
