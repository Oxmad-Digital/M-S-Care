"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Tiroir de navigation (mobile et tablette) : le contenu (liens, compte) est rendu côté serveur et passé en enfant.
export function MobileNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  // Fermeture automatique après une navigation.
  const [seenPathname, setSeenPathname] = useState(pathname);
  if (pathname !== seenPathname) {
    setSeenPathname(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const toggle = toggleRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    // Le tiroir n'existe que sous `lg` : on le referme si l'écran s'élargit.
    const desktop = window.matchMedia("(min-width: 64rem)");
    const onDesktop = () => desktop.matches && setOpen(false);

    document.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", onDesktop);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", onDesktop);
      toggle?.focus();
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-ms-border bg-white px-4 py-2.5">
        <div>
          <p className="text-lg leading-tight font-extrabold text-ms-primary">M&amp;S Care</p>
          <p className="text-xs text-ms-text-muted">Administration</p>
        </div>
        <button
          ref={toggleRef}
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          aria-controls="admin-mobile-nav"
          className="-mr-2 rounded-md p-2 text-ms-primary transition hover:bg-ms-accent/10"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-6">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        </button>
      </header>

      <div
        aria-hidden="true"
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-ms-primary/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
      <div
        id="admin-mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label="Menu d’administration"
        inert={!open}
        // Un clic sur un lien referme aussi le tiroir quand il mène à la page courante.
        onClick={(event) => {
          if ((event.target as HTMLElement).closest("a")) setOpen(false);
        }}
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col overflow-y-auto bg-white shadow-xl transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Fermer le menu"
          className="absolute top-5 right-3 rounded-md p-2 text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="size-5">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
