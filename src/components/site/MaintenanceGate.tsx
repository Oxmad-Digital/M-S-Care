import Image from "next/image";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { getSiteSettings } from "@/lib/site-settings";

// En maintenance, les visiteurs voient un écran d'attente ; les personnes connectées
// à l'admin continuent de voir le site, avec un bandeau, pour pouvoir le vérifier.
export async function MaintenanceGate({ children }: { children: React.ReactNode }) {
  const { maintenance, maintenanceMessage } = await getSiteSettings();
  if (!maintenance) return children;

  if (await auth()) {
    return (
      <>
        <Link
          href="/admin/parametres#maintenance"
          className="block bg-amber-100 px-5 py-2 text-center text-[13.5px] font-semibold text-amber-900 hover:bg-amber-200"
        >
          Mode maintenance actif — le site n’est visible que par l’équipe connectée.
        </Link>
        {children}
      </>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-ms-bg px-5 py-20">
      <div className="max-w-lg text-center">
        <Image src="/images/logo.png" alt="M&S Care" width={160} height={58} className="mx-auto mb-10 h-14 w-auto" priority />
        <h1 className="text-3xl font-extrabold text-ms-primary">Site en maintenance</h1>
        <p className="mt-4 text-[16px] leading-[1.7] whitespace-pre-line text-ms-text">
          {maintenanceMessage || "Nous améliorons notre site. Merci de revenir un peu plus tard."}
        </p>
      </div>
    </main>
  );
}
