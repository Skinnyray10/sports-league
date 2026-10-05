import Link from "next/link";
import { StatusPanel } from "@/components/states/status-panel";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main id="contenido" className="flex flex-1 items-center justify-center px-4 py-16">
      <StatusPanel
        eyebrow="Error 404"
        title="No encontramos esta página"
        description="El enlace puede estar mal escrito, o la liga ya no está disponible para tu cuenta."
        actions={
          <>
            <Link href="/" className={buttonVariants()}>
              Ir al inicio
            </Link>
            <Link href="/login" className={buttonVariants({ variant: "outline" })}>
              Iniciar sesión
            </Link>
          </>
        }
      />
    </main>
  );
}
