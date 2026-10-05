import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export const metadata = { title: "Recuperar contraseña" };

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Recuperar contraseña</h1>
        <p className="text-[0.9375rem] text-muted-foreground">
          Te enviaremos un enlace para crear una contraseña nueva.
        </p>
      </div>
      {error === "enlace" ? (
        <p
          role="alert"
          className="rounded-lg border border-destructive/40 bg-card px-3 py-2 text-sm text-destructive"
        >
          El enlace no es válido o ya expiró. Pide uno nuevo.
        </p>
      ) : null}
      <ForgotPasswordForm />
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-foreground underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </div>
  );
}
