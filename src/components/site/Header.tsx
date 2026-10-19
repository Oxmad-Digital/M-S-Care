"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/#nosproduits", label: "Nos produits" },
  { href: "/#apropos", label: "À propos" },
  { href: "/#engagement", label: "Nos engagements" },
];

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const close = () => setMenuOpen(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    // Referme le menu si l'écran repasse en largeur desktop.
    const desktop = window.matchMedia("(min-width: 1024px)");
    window.addEventListener("keydown", onKeyDown);
    desktop.addEventListener("change", close);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      desktop.removeEventListener("change", close);
    };
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 h-[var(--site-header-height)] shrink-0 border-b border-ms-border bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-full max-w-[1280px] items-center gap-7 px-5 sm:px-8 lg:px-14">
        <Link href="/#top" onClick={closeMenu} className="flex flex-none items-center">
          <Image
            src="/images/logo.png"
            alt="M&S Care — Acteur de la santé pour tous"
            height={44}
            width={122}
            className="h-11 w-auto"
            priority
          />
        </Link>
        <nav aria-label="Navigation principale" className="ml-auto hidden items-center justify-end gap-0.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-[14px] py-[9px] text-[15px] font-medium text-ms-text transition hover:bg-ms-accent/10 hover:text-ms-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/#contacts"
            className="ml-3 rounded-full bg-ms-accent px-[22px] py-[12px] text-[14.5px] font-semibold text-white transition hover:bg-ms-primary"
          >
            Nous contacter
          </Link>
          <Link
            href="/admin"
            aria-label="Espace administration"
            title="Espace administration"
            className="ml-1 flex h-10 w-10 flex-none items-center justify-center rounded-full text-ms-text transition hover:bg-ms-accent/10 hover:text-ms-primary"
          >
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-5 w-5 fill-none stroke-current"
              style={{ strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" }}
            >
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" />
            </svg>
          </Link>
        </nav>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-lg text-ms-primary transition hover:bg-ms-accent/10 lg:hidden"
        >
          <span aria-hidden="true" className="relative block h-[14px] w-[22px]">
            <span
              className={`absolute left-0 h-[2px] w-full rounded-full bg-current transition duration-200 ${
                menuOpen ? "top-[6px] rotate-45" : "top-0"
              }`}
            />
            <span
              className={`absolute top-[6px] left-0 h-[2px] w-full rounded-full bg-current transition duration-200 ${
                menuOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`absolute left-0 h-[2px] w-full rounded-full bg-current transition duration-200 ${
                menuOpen ? "top-[6px] -rotate-45" : "top-[12px]"
              }`}
            />
          </span>
        </button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-menu"
          aria-label="Menu principal"
          className="absolute inset-x-0 top-full max-h-[calc(100dvh-var(--site-header-height))] overflow-y-auto border-t border-ms-border bg-white px-5 pt-3 pb-6 shadow-[0_20px_40px_-30px_rgba(20,87,75,0.5)] sm:px-8 lg:hidden"
        >
          <ul className="grid gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={closeMenu}
                  className="block rounded-lg px-[14px] py-[13px] text-[16px] font-medium text-ms-text transition hover:bg-ms-accent/10 hover:text-ms-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href="/#contacts"
            onClick={closeMenu}
            className="mt-4 block rounded-full bg-ms-accent px-[22px] py-[14px] text-center text-[15px] font-semibold text-white transition hover:bg-ms-primary"
          >
            Nous contacter
          </Link>
        </nav>
      )}
    </header>
  );
}
