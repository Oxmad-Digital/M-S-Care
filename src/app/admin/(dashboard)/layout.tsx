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
    <div className="flex min-h-screen bg-ms-bg">
      <aside className="flex w-56 flex-col border-r border-ms-border bg-white">
        <div className="border-b border-ms-border px-6 py-6">
          <p className="text-lg font-extrabold text-ms-primary">M&amp;S Care</p>
          <p className="text-xs text-ms-text-muted">Administration</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
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
        <form action={logoutAction} className="border-t border-ms-border p-4">
          <button
            type="submit"
            className="w-full rounded-md px-3 py-2.5 text-left text-[14.5px] font-medium text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
          >
            Déconnexion
          </button>
        </form>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
