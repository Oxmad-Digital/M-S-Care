import Link from "next/link";
import { redirect } from "next/navigation";
import { MobileNav } from "@/components/admin/MobileNav";
import { logoutAction } from "@/lib/actions/auth";
import { displayName, getCurrentUser } from "@/lib/current-user";
import { getSiteSettings } from "@/lib/site-settings";
import { prisma } from "@/lib/prisma";
import { ROLE_LABEL } from "@/lib/permissions";

const NAV_LINKS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/messages", label: "Messages" },
  { href: "/admin/stats", label: "Statistiques" },
  { href: "/admin/parametres", label: "Paramètres" },
];

const itemClass =
  "flex items-center gap-2 rounded-md px-3 py-2.5 text-[14.5px] font-medium transition hover:bg-ms-accent/10 hover:text-ms-primary";

// Contenu commun à la barre latérale (ordinateur) et au tiroir (mobile, tablette).
function SidebarContent({
  user,
  unread,
}: {
  user: NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
  unread: number;
}) {
  return (
    <>
      <div className="border-b border-ms-border px-6 py-6">
        <p className="text-lg font-extrabold text-ms-primary">M&amp;S Care</p>
        <p className="text-xs text-ms-text-muted">Administration</p>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-4">
        {NAV_LINKS.map((link) => (
          <Link key={link.href} href={link.href} className={`${itemClass} text-ms-text`}>
            {link.label}
            {link.href === "/admin/messages" && unread > 0 && (
              <span className="ml-auto rounded-full bg-ms-accent px-2 py-px text-[11.5px] font-bold text-white">
                {unread}
                <span className="sr-only"> non lu{unread > 1 ? "s" : ""}</span>
              </span>
            )}
          </Link>
        ))}
      </nav>
      <div className="border-t border-ms-border p-4">
        <Link href="/" className={`${itemClass} text-ms-text-soft`}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <path d="M2 12h20" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          Voir le site
        </Link>
      </div>
      <form action={logoutAction} className="border-t border-ms-border p-4">
        <div className="px-3 pb-2">
          <p className="truncate text-[13.5px] font-semibold text-ms-primary">{displayName(user)}</p>
          <p className="text-xs text-ms-text-muted">{ROLE_LABEL[user.role]}</p>
        </div>
        <button type="submit" className={`${itemClass} w-full text-left text-ms-text-soft`}>
          Déconnexion
        </button>
      </form>
    </>
  );
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Session encore valide mais compte retiré : retour à la connexion.
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  const [{ maintenance }, unread] = await Promise.all([
    getSiteSettings(),
    prisma.contactMessage.count({ where: { read: false } }),
  ]);

  return (
    <div className="flex min-h-screen flex-col bg-ms-bg lg:flex-row">
      <MobileNav>
        <SidebarContent user={user} unread={unread} />
      </MobileNav>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-56 flex-col overflow-y-auto border-r border-ms-border bg-white lg:flex">
        <SidebarContent user={user} unread={unread} />
      </aside>
      <main className="min-w-0 flex-1 p-4 sm:p-6 lg:ml-56 lg:p-8">
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
