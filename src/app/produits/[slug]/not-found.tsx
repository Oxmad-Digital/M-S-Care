import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-xs font-bold tracking-widest text-ms-accent uppercase">Erreur 404</p>
      <h1 className="text-3xl font-extrabold tracking-tight text-ms-primary">Produit introuvable</h1>
      <p className="mt-4 text-ms-text">Cette fiche n’existe pas ou n’est plus disponible.</p>
      <Link href="/#nosproduits" className="mt-8 inline-flex rounded-full bg-ms-accent px-6 py-3 font-semibold text-white transition hover:bg-ms-primary">
        Retour à la gamme
      </Link>
    </div>
  );
}
