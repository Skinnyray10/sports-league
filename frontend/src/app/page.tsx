import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { listUserOrganizations } from "@/lib/org";

/**
 * Entrada de la app: sin sesión → login; sin organizaciones → onboarding;
 * en caso contrario, al dashboard de la primera organización.
 */
export default async function RootPage() {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  const organizations = await listUserOrganizations();

  if (organizations.length === 0) {
    redirect("/onboarding");
  }

  redirect(`/${organizations[0].slug}`);
}
