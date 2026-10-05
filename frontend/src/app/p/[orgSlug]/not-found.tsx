import Link from "next/link";
import { StatusPanel } from "@/components/states/status-panel";
import { buttonVariants } from "@/components/ui/button";

export default function PublicOrgNotFound() {
  return (
    <div className="py-10">
      <StatusPanel
        eyebrow="No encontrado"
        title="No encontramos esta página"
        description="El partido, aviso o liga que buscas no existe o ya no es público."
        actions={
          <Link href="/" className={buttonVariants()}>
            Ver ligas públicas
          </Link>
        }
      />
    </div>
  );
}
