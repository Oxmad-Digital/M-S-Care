import Image from "next/image";
import Link from "next/link";

// Pages hors session (connexion, invitation) : logo en haut à gauche pour revenir au site.
export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-ms-bg">
      <header className="px-5 py-5 sm:px-8">
        <Link href="/" className="inline-flex" aria-label="Retour au site M&S Care">
          <Image src="/images/logo.png" alt="M&S Care" height={44} width={122} className="h-10 w-auto" priority />
        </Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-5 pt-4 pb-16">{children}</main>
    </div>
  );
}
