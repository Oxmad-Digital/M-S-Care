import Link from "next/link";
import { redirect } from "next/navigation";
import { logoutAction } from "@/lib/actions/auth";
import { displayName, getCurrentUser } from "@/lib/current-user";
import { getSiteSettings } from "@/lib/site-settings";
import { ROLE_LABEL } from "@/lib/permissions";

const NAV_LINKS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/stats", label: "Statistiques" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session encore valide mais compte retiré : retour à la connexion.
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const { maintenance } = await getSiteSettings();

  return (
    <div className="flex min-h-screen flex-col bg-ms-bg md:flex-row">
      <aside className="sticky top-0 z-30 flex flex-wrap items-center border-b border-ms-border bg-white md:fixed md:inset-y-0 md:left-0 md:w-56 md:overflow-y-auto md:flex-col md:flex-nowrap md:items-stretch md:border-r md:border-b-0">
        <div className="px-4 py-3 md:border-b md:border-ms-border md:px-6 md:py-6">
          <p className="text-lg font-extrabold text-ms-primary">M&amp;S Care</p>
          <p className="text-xs text-ms-text-muted">Administration</p>
        </div>
        <nav className="flex flex-1 gap-1 px-2 py-2 md:flex-col md:p-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2.5 text-[14.5px] font-medium text-ms-text transition hover:bg-ms-accent/10 hover:text-ms-primary"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="px-2 py-2 md:border-t md:border-ms-border md:p-4">
          <Link
            href="/"
            className="block rounded-md px-3 py-2.5 text-[14.5px] font-medium text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
          >
            ← Voir le site
          </Link>
        </div>
        <form action={logoutAction} className="px-2 py-2 md:border-t md:border-ms-border md:p-4">
          <div className="hidden px-3 pb-2 md:block">
            <p className="truncate text-[13.5px] font-semibold text-ms-primary">{displayName(user)}</p>
            <p className="text-xs text-ms-text-muted">{ROLE_LABEL[user.role]}</p>
          </div>
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2.5 text-left text-[14.5px] font-medium text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
          >
            Déconnexion
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:ml-56 md:p-8">
        {maintenance && (
          <Link
            href="/admin/parametres#maintenance"
            className="mb-5 block rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-[14px] font-medium text-amber-800 hover:bg-amber-100"
          >
            Le site public affiche actuellement l’écran de maintenance.
          </Link>
        )}
        {children}
      </main>
    </div>
  );
}
