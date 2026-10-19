import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLoginPage() {
  // Déjà connecté (ex. retour depuis le site) : pas besoin de se reconnecter.
  if (await getCurrentUser()) redirect("/admin/produits");

  return (
    <div className="flex min-h-screen items-center justify-center bg-ms-bg px-5">
      <LoginForm />
    </div>
  );
}
