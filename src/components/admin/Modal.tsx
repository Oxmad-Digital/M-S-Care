"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Formulaire affiché par-dessus la liste des produits ; le fermer revient à la liste,
// en conservant ses filtres.
export function Modal({ title, children }: { title: string; children: React.ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const dialogRef = useRef<HTMLDialogElement>(null);

  const close = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("depuis");
    const search = params.toString();
    router.push(search ? `/admin/produits?${search}` : "/admin/produits");
  };

  useEffect(() => {
    if (!dialogRef.current?.open) dialogRef.current?.showModal();
  }, []);

  return (
    <dialog
      ref={dialogRef}
      aria-label={title}
      onClose={close}
      onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current.close();
      }}
      className="m-auto max-h-[90vh] w-[min(56rem,calc(100vw-2rem))] rounded-xl bg-white p-0 shadow-xl backdrop:bg-black/40"
    >
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-ms-border bg-white px-6 py-4">
        <h1 className="text-xl font-extrabold text-ms-primary">{title}</h1>
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Fermer"
          className="px-2 py-1 text-2xl leading-none text-ms-text-soft outline-none transition hover:text-ms-primary focus-visible:text-ms-primary"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-5">{children}</div>
    </dialog>
  );
}
