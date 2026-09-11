import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#apropos", label: "A propos" },
  { href: "#nosproduits", label: "Nos produits" },
  { href: "#contacts", label: "Contacts" },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-ms-border bg-white/95 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-[1280px] items-center gap-7 px-5 sm:px-8 lg:px-14">
        <Link href="#top" className="flex flex-none items-center">
          <Image
            src="/images/logo.png"
            alt="M&S Care — Acteur de la santé pour tous"
            height={44}
            width={122}
            className="h-11 w-auto"
            priority
          />
        </Link>
        <nav className="ml-auto flex flex-wrap items-center justify-end gap-0.5">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-lg px-[14px] py-[9px] text-[15px] font-medium text-ms-text transition hover:bg-ms-accent/10 hover:text-ms-primary"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contacts"
            className="ml-3 rounded-full bg-ms-accent px-[22px] py-[12px] text-[14.5px] font-semibold text-white transition hover:bg-ms-primary"
          >
            Nous contacter
          </a>
        </nav>
      </div>
    </header>
  );
}
