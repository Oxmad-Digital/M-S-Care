"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_LINKS = [
  { href: "/#nosproduits", id: "nosproduits", label: "Nos produits" },
  { href: "/#apropos", id: "apropos", label: "À propos" },
  { href: "/#engagement", id: "engagement", label: "Nos engagements" },
];

// Au-delà de ce défilement, le header passe en version compacte et opaque.
const SCROLL_THRESHOLD = 40;

type HeaderProps = {
  // Header transparent posé sur le hero tant que la page n'a pas défilé.
  overlay?: boolean;
};

export function Header({ overlay = false }: HeaderProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > SCROLL_THRESHOLD);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Suit la section qui traverse le milieu de l'écran pour surligner le lien correspondant.
  useEffect(() => {
    if (pathname !== "/") return;
    const sections = document.querySelectorAll<HTMLElement>("main section[id]");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

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

  const transparent = overlay && !scrolled && !menuOpen;
  const currentId = pathname.startsWith("/produits") ? "nosproduits" : activeSection;

  return (
    // L'enveloppe garde la hauteur pleine dans le flux (pas de saut de contenu quand la barre se compacte) ;
    // elle laisse passer les clics, seule la barre les capte.
    <header className="pointer-events-none sticky top-0 z-50 h-[var(--site-header-height)] shrink-0">
      <div
        className={`pointer-events-auto relative transition-[height,background-color,box-shadow,border-color] duration-300 motion-reduce:transition-none ${
          scrolled ? "h-[var(--site-header-height-compact)]" : "h-[var(--site-header-height)]"
        } ${
          transparent
            ? "border-b border-transparent bg-transparent"
            : `${menuOpen ? "bg-white" : "bg-white/95 backdrop-blur-lg"} ${
                scrolled
                  ? "border-b border-transparent shadow-[0_10px_30px_-18px_rgba(20,87,75,0.45)]"
                  : "border-b border-ms-border"
              }`
        }`}
      >
        {/* Dégradé discret pour garantir le contraste des liens blancs sur la photo du hero. */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-x-0 top-0 h-[150%] bg-gradient-to-b from-ms-primary-dark/55 to-transparent transition-opacity duration-300 ${
            transparent ? "opacity-100" : "opacity-0"
          }`}
        />
        <div className="relative mx-auto flex h-full max-w-[1920px] items-center gap-7 px-5 sm:px-8 lg:px-14 xl:px-20 2xl:px-24">
          <Link href="/#top" onClick={closeMenu} className="flex flex-none items-center">
            <Image
              src="/images/logo.png"
              alt="M&S Care — Acteur de la santé pour tous"
              height={44}
              width={122}
              className={`w-auto transition-[height,filter] duration-300 motion-reduce:transition-none ${
                scrolled ? "h-9" : "h-11"
              } ${transparent ? "brightness-0 invert" : ""}`}
              priority
            />
          </Link>
          <nav aria-label="Navigation principale" className="ml-auto hidden items-center justify-end gap-0.5 lg:flex">
            {NAV_LINKS.map((link) => {
              const active = currentId === link.id;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={active ? "location" : undefined}
                  className={`relative px-[14px] py-[9px] text-[15px] font-medium transition-colors after:absolute after:inset-x-[14px] after:bottom-[3px] after:h-[2px] after:origin-left after:rounded-full after:bg-current after:transition-transform after:duration-300 hover:after:scale-x-100 ${
                    active ? "after:scale-x-100" : "after:scale-x-0"
                  } ${
                    transparent
                      ? active
                        ? "text-white"
                        : "text-white/85 hover:text-white"
                      : active
                        ? "text-ms-primary"
                        : "text-ms-text hover:text-ms-primary"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/#contacts"
              className={`ml-4 rounded-full px-[22px] py-[12px] text-[14.5px] font-semibold transition-colors ${
                transparent
                  ? "bg-white text-ms-primary hover:bg-ms-mint"
                  : "bg-ms-accent text-white hover:bg-ms-primary"
              }`}
            >
              Nous contacter
            </Link>
          </nav>
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            aria-label={menuOpen ? "Fermer le menu" : "Ouvrir le menu"}
            className={`ml-auto flex h-11 w-11 items-center justify-center rounded-lg transition lg:hidden ${
              transparent ? "text-white hover:bg-white/10" : "text-ms-primary hover:bg-ms-accent/10"
            }`}
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
              {NAV_LINKS.map((link) => {
                const active = currentId === link.id;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={closeMenu}
                      aria-current={active ? "location" : undefined}
                      className={`block rounded-lg px-[14px] py-[13px] text-[16px] font-medium transition hover:bg-ms-accent/10 hover:text-ms-primary ${
                        active ? "bg-ms-accent/10 text-ms-primary" : "text-ms-text"
                      }`}
                    >
                      {link.label}
                    </Link>
                  </li>
                );
              })}
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
      </div>
    </header>
  );
}
