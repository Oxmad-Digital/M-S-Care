import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/admin/AuthLayout";
import { LoginForm } from "@/components/admin/LoginForm";
import { getCurrentUser } from "@/lib/current-user";

export default async function AdminLoginPage() {
  // Déjà connecté (ex. retour depuis le site) : pas besoin de se reconnecter.
  if (await getCurrentUser()) redirect("/admin/produits");

  return (
    <AuthLayout>
      <LoginForm />
    </AuthLayout>
  );
}
