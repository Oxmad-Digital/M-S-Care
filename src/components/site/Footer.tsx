import Image from "next/image";

const NAV_LINKS = [
  { href: "#apropos", label: "A propos" },
  { href: "#nosproduits", label: "Nos produits" },
  { href: "#contacts", label: "Contacts" },
  { href: "#", label: "Mentions légales" },
];

export function Footer() {
  return (
    <footer className="bg-ms-primary text-white">
      <div className="mx-auto max-w-[1280px] px-5 pt-14 pb-8 sm:px-8 sm:pt-23 lg:px-14">
        <div className="grid grid-cols-1 items-start gap-8 sm:grid-cols-3 sm:gap-16">
          <div>
            <Image
              src="/images/logo.png"
              alt="M&S Care"
              height={50}
              width={139}
              className="h-[50px] w-auto brightness-0 invert"
            />
            <p className="mt-[22px] max-w-[34ch] text-sm leading-[1.7] text-white/66">
              Linea Pharmaceuticals (Int) Ltd Suite B11, Harewood Park Dr.
              Lesur Street, Beau Bassin 71512, Republic of Mauritius
            </p>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
              Navigation
            </p>
            <div className="grid justify-items-start gap-[11px]">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-[15px] text-white/86 transition hover:text-[#8FD3BE]"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-[0.14em] text-white/50 uppercase">
              Distribué à Madagascar par
            </p>
            <a
              href="https://interpharma.mg"
              target="_blank"
              rel="noreferrer"
              className="border-b border-white/35 text-[15px] font-semibold text-white transition hover:text-[#8FD3BE]"
            >
              interpharma.mg
            </a>
          </div>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/16 pt-6 sm:mt-18">
          <p className="text-[13px] text-white/55">
            © 2026 M&amp;S Care. All rights reserved.
          </p>
          <p className="text-[13px] text-white/55">
            Réalisé par{" "}
            <a
              href="https://oxmad-digital.mg"
              target="_blank"
              rel="noreferrer"
              className="text-white/82 transition hover:text-[#8FD3BE]"
            >
              Oxmad Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
