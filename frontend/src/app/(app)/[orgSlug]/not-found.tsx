import Link from "next/link";
import { StatusPanel } from "@/components/states/status-panel";
import { buttonVariants } from "@/components/ui/button";

export default function OrgNotFound() {
  return (
    <div className="py-10">
      <StatusPanel
        eyebrow="No encontrado"
        title="Este registro no existe"
        description="Puede que se haya eliminado, o que pertenezca a otra liga o equipo al que tu cuenta no tiene acceso."
        actions={
          <Link href="/" className={buttonVariants()}>
            Elegir liga
          </Link>
        }
      />
    </div>
  );
}
