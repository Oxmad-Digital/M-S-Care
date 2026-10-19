import Link from "next/link";
import { logoutAction } from "@/lib/actions/auth";

const NAV_LINKS = [
  { href: "/admin/produits", label: "Produits" },
  { href: "/admin/messages", label: "Messages" },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-ms-bg md:flex-row">
      <aside className="flex flex-wrap items-center border-b border-ms-border bg-white md:w-56 md:shrink-0 md:flex-col md:flex-nowrap md:items-stretch md:border-r md:border-b-0">
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
        <form action={logoutAction} className="px-2 py-2 md:border-t md:border-ms-border md:p-4">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2.5 text-left text-[14.5px] font-medium text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
          >
            Déconnexion
          </button>
        </form>
      </aside>
      <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
    </div>
  );
}
