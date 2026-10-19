"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { ProductCategory } from "@prisma/client";
import { CATEGORY_LABEL } from "@/lib/types";
import { deleteProducts, moveProduct, setProductsPublished } from "@/lib/actions/products";
import { ActionsMenu, type MenuItem } from "./ActionsMenu";
import { ConfirmDialog } from "./ConfirmDialog";

export type AdminProductRow = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  principeActif: string;
  dosages: string[];
  imageUrl: string;
  noticeCount: number;
  published: boolean;
  warnings: string[];
};

type Toast = { kind: "success" | "error"; text: string };

const FILTER_KEYS = ["q", "categorie", "statut"] as const;

const REDIRECT_MESSAGES: Record<string, string> = {
  cree: "Produit créé.",
  modifie: "Modifications enregistrées.",
};

const fieldClass =
  "h-10 rounded-md border border-ms-accent/24 bg-white px-3 text-[14px] outline-none focus:border-ms-accent";

function normalize(text: string) {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

function plural(count: number, word: string) {
  return `${count} ${word}${count > 1 ? "s" : ""}`;
}

// Les droits ne servent ici qu'à masquer les commandes : les actions serveur les revérifient.
export function ProductsTable({
  products,
  canEdit,
  canDelete,
}: {
  products: AdminProductRow[];
  canEdit: boolean;
  canDelete: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const category = searchParams.get("categorie") ?? "";
  const status = searchParams.get("statut") ?? "";

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<AdminProductRow[] | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [, startTransition] = useTransition();

  // Les filtres vivent dans l'URL sans aller-retour serveur : la liste est déjà chargée.
  const updateUrl = (changes: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    for (const [key, value] of Object.entries(changes)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    const search = params.toString();
    window.history.replaceState(null, "", search ? `${pathname}?${search}` : pathname);
  };

  const filterQuery = useMemo(() => {
    const params = new URLSearchParams();
    for (const key of FILTER_KEYS) {
      const value = searchParams.get(key);
      if (value) params.set(key, value);
    }
    return params;
  }, [searchParams]);

  const withFilters = (path: string, extra: Record<string, string> = {}) => {
    const params = new URLSearchParams(filterQuery);
    for (const [key, value] of Object.entries(extra)) params.set(key, value);
    const search = params.toString();
    return search ? `${path}?${search}` : path;
  };

  // Message transmis par la redirection après création ou modification.
  const redirectMessage = searchParams.get("ok");
  const [seenRedirectMessage, setSeenRedirectMessage] = useState<string | null>(null);
  if (redirectMessage !== seenRedirectMessage) {
    setSeenRedirectMessage(redirectMessage);
    if (redirectMessage && REDIRECT_MESSAGES[redirectMessage]) {
      setToast({ kind: "success", text: REDIRECT_MESSAGES[redirectMessage] });
    }
  }
  useEffect(() => {
    if (redirectMessage) updateUrl({ ok: null });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ne réagit qu'au paramètre `ok`
  }, [redirectMessage]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const visible = useMemo(() => {
    const terms = normalize(query.trim()).split(/\s+/).filter(Boolean);
    return products.filter((product) => {
      if (category && product.category !== category) return false;
      if (status === "publie" && !product.published) return false;
      if (status === "brouillon" && product.published) return false;
      const haystack = normalize([product.name, product.principeActif, ...product.dosages].join(" "));
      return terms.every((term) => haystack.includes(term));
    });
  }, [products, query, category, status]);

  const isFiltered = Boolean(query.trim() || category || status);
  const publishedCount = products.filter((product) => product.published).length;
  const visibleSelected = visible.filter((product) => selected.has(product.id));
  const allSelected = visible.length > 0 && visibleSelected.length === visible.length;

  const selectAllRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate = visibleSelected.length > 0 && !allSelected;
    }
  }, [visibleSelected.length, allSelected]);

  const run = (ids: string[], action: () => Promise<void>, success?: string) => {
    setPendingIds((current) => new Set([...current, ...ids]));
    startTransition(async () => {
      try {
        await action();
        if (success) setToast({ kind: "success", text: success });
      } catch {
        setToast({ kind: "error", text: "L’opération a échoué. Réessayez." });
      } finally {
        setPendingIds((current) => {
          const next = new Set(current);
          ids.forEach((id) => next.delete(id));
          return next;
        });
      }
    });
  };

  const publish = (rows: AdminProductRow[], published: boolean) => {
    const ids = rows.map((row) => row.id);
    const subject = rows.length === 1 ? `« ${rows[0].name} »` : plural(rows.length, "produit");
    run(ids, () => setProductsPublished(ids, published), `${subject} ${published ? "publié" : "dépublié"}${rows.length > 1 ? "s" : ""}.`);
    setSelected(new Set());
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    const ids = toDelete.map((row) => row.id);
    const subject = toDelete.length === 1 ? `« ${toDelete[0].name} » supprimé.` : `${plural(toDelete.length, "produit")} supprimés.`;
    setToDelete(null);
    setSelected((current) => new Set([...current].filter((id) => !ids.includes(id))));
    run(ids, () => deleteProducts(ids), subject);
  };

  const toggleSelected = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const resetFilters = () => {
    setQuery("");
    updateUrl({ q: null, categorie: null, statut: null });
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-ms-primary">Produits</h1>
          <p className="mt-1 text-[13px] text-ms-text-muted">
            {plural(products.length, "produit")} · {plural(publishedCount, "publié")} ·{" "}
            {plural(products.length - publishedCount, "brouillon")}
            {isFiltered && ` — ${plural(visible.length, "affiché")}`}
          </p>
        </div>
        {canEdit && (
          <Link
            href={withFilters("/admin/produits/nouveau")}
            className="rounded-full bg-ms-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ms-primary"
          >
            Nouveau produit
          </Link>
        )}
      </div>

      {products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-ms-border bg-white px-6 py-14 text-center">
          <p className="font-semibold text-ms-primary">Aucun produit pour le moment.</p>
          {canEdit && (
            <>
              <p className="mt-1 text-[14px] text-ms-text-soft">Créez le premier produit pour alimenter le catalogue.</p>
              <Link
                href="/admin/produits/nouveau"
                className="mt-5 inline-block rounded-full bg-ms-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-ms-primary"
              >
                Créer un produit
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                updateUrl({ q: event.target.value.trim() || null });
              }}
              placeholder="Rechercher un nom, un principe actif, un dosage…"
              aria-label="Rechercher un produit"
              className={`${fieldClass} w-full sm:w-80`}
            />
            <select
              value={category}
              onChange={(event) => updateUrl({ categorie: event.target.value || null })}
              aria-label="Filtrer par catégorie"
              className={fieldClass}
            >
              <option value="">Toutes les catégories</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <select
              value={status}
              onChange={(event) => updateUrl({ statut: event.target.value || null })}
              aria-label="Filtrer par statut"
              className={fieldClass}
            >
              <option value="">Tous les statuts</option>
              <option value="publie">Publiés</option>
              <option value="brouillon">Brouillons</option>
            </select>
            {isFiltered && (
              <button
                type="button"
                onClick={resetFilters}
                className="text-[14px] font-semibold text-ms-accent hover:text-ms-primary"
              >
                Réinitialiser
              </button>
            )}
          </div>

          {visibleSelected.length > 0 && (
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-ms-accent/40 bg-ms-badge px-4 py-2.5 text-[14px]">
              <span className="font-semibold text-ms-primary">
                {plural(visibleSelected.length, "produit")} sélectionné{visibleSelected.length > 1 ? "s" : ""}
              </span>
              <button type="button" onClick={() => publish(visibleSelected, true)} className="font-semibold text-ms-accent hover:text-ms-primary">
                Publier
              </button>
              <button type="button" onClick={() => publish(visibleSelected, false)} className="font-semibold text-ms-accent hover:text-ms-primary">
                Dépublier
              </button>
              {canDelete && (
                <button type="button" onClick={() => setToDelete(visibleSelected)} className="font-semibold text-red-600 hover:text-red-700">
                  Supprimer
                </button>
              )}
              <button type="button" onClick={() => setSelected(new Set())} className="ml-auto font-semibold text-ms-text-soft hover:text-ms-primary">
                Annuler
              </button>
            </div>
          )}

          {visible.length === 0 ? (
            <div className="rounded-lg border border-ms-border bg-white px-6 py-10 text-center">
              <p className="text-ms-text">Aucun produit ne correspond à ces filtres.</p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-3 text-[14px] font-semibold text-ms-accent hover:text-ms-primary"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-ms-border bg-white">
              <table className="w-full text-left text-[14px]">
                <thead>
                  <tr className="border-b border-ms-border text-[12px] font-bold tracking-wide text-ms-text-muted uppercase">
                    {canEdit && (
                      <>
                        <th className="w-10 py-3 pr-1 pl-4">
                          <input
                            ref={selectAllRef}
                            type="checkbox"
                            checked={allSelected}
                            onChange={() => setSelected(allSelected ? new Set() : new Set(visible.map((product) => product.id)))}
                            aria-label="Tout sélectionner"
                            className="size-4 accent-ms-accent"
                          />
                        </th>
                        <th className="w-12 px-1 py-3">
                          <span className="sr-only">Ordre</span>
                        </th>
                      </>
                    )}
                    <th className="px-3 py-3">Produit</th>
                    <th className="hidden px-3 py-3 md:table-cell">Catégorie</th>
                    <th className="hidden px-3 py-3 lg:table-cell">Dosages</th>
                    <th className="hidden px-3 py-3 text-center lg:table-cell">Notices</th>
                    <th className="px-3 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((product, index) => {
                    const pending = pendingIds.has(product.id);
                    const editHref = withFilters(`/admin/produits/${product.id}`);
                    const menuItems: MenuItem[] = [
                      ...(product.published
                        ? [{ label: "Voir sur le site", href: `/produits/${encodeURIComponent(product.slug)}`, external: true }]
                        : []),
                      ...(canEdit
                        ? [
                            { label: "Dupliquer", href: withFilters("/admin/produits/nouveau", { depuis: product.id }) },
                            { label: product.published ? "Dépublier" : "Publier", onSelect: () => publish([product], !product.published) },
                          ]
                        : []),
                      ...(canDelete ? [{ label: "Supprimer", onSelect: () => setToDelete([product]), danger: true }] : []),
                    ];
                    return (
                      <tr
                        key={product.id}
                        aria-busy={pending}
                        className={`border-b border-ms-border transition last:border-0 ${
                          pending ? "pointer-events-none opacity-50" : ""
                        } ${selected.has(product.id) ? "bg-ms-badge/60" : "hover:bg-ms-bg/60"}`}
                      >
                        {canEdit && (
                          <>
                            <td className="py-3 pr-1 pl-4">
                              <input
                                type="checkbox"
                                checked={selected.has(product.id)}
                                onChange={() => toggleSelected(product.id)}
                                aria-label={`Sélectionner ${product.name}`}
                                className="size-4 accent-ms-accent"
                              />
                            </td>
                            <td className="px-1 py-3">
                              <div
                                className="flex flex-col items-center"
                                title={isFiltered ? "Réinitialisez les filtres pour changer l’ordre" : undefined}
                              >
                                <button
                                  type="button"
                                  disabled={isFiltered || index === 0}
                                  onClick={() => run([product.id], () => moveProduct(product.id, "up"))}
                                  aria-label={`Monter ${product.name}`}
                                  className="rounded px-1.5 text-[11px] leading-4 text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary disabled:opacity-25 disabled:hover:bg-transparent"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  disabled={isFiltered || index === visible.length - 1}
                                  onClick={() => run([product.id], () => moveProduct(product.id, "down"))}
                                  aria-label={`Descendre ${product.name}`}
                                  className="rounded px-1.5 text-[11px] leading-4 text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary disabled:opacity-25 disabled:hover:bg-transparent"
                                >
                                  ▼
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element -- simple miniature admin */}
                            <img
                              src={product.imageUrl}
                              alt=""
                              loading="lazy"
                              className="size-11 shrink-0 rounded-md border border-ms-border bg-white object-contain"
                            />
                            <div className="min-w-0">
                              <Link href={editHref} className="font-semibold text-ms-primary hover:text-ms-accent">
                                {product.name}
                              </Link>
                              <p className="truncate text-[13px] text-ms-text-muted">{product.principeActif}</p>
                              {product.warnings.map((warning) => (
                                <p key={warning} className="mt-0.5 text-[12px] font-medium text-amber-700">
                                  ⚠ {warning}
                                </p>
                              ))}
                            </div>
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 text-ms-text md:table-cell">{CATEGORY_LABEL[product.category]}</td>
                        <td className="hidden px-3 py-3 lg:table-cell">
                          <div className="flex max-w-56 flex-wrap gap-1">
                            {product.dosages.length ? (
                              product.dosages.map((dosage) => (
                                <span key={dosage} className="rounded bg-ms-bg px-1.5 py-0.5 text-[12px] whitespace-nowrap text-ms-text">
                                  {dosage}
                                </span>
                              ))
                            ) : (
                              <span className="text-ms-text-muted">—</span>
                            )}
                          </div>
                        </td>
                        <td className="hidden px-3 py-3 text-center text-ms-text lg:table-cell">{product.noticeCount}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold whitespace-nowrap ${
                              product.published ? "bg-ms-badge text-ms-primary" : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {product.published ? "Publié" : "Brouillon"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={editHref} className="font-semibold text-ms-accent hover:text-ms-primary">
                              {canEdit ? "Modifier" : "Consulter"}
                            </Link>
                            {menuItems.length > 0 && (
                              <ActionsMenu label={`Autres actions pour ${product.name}`} items={menuItems} />
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete && toDelete.length > 1 ? `Supprimer ${plural(toDelete.length, "produit")} ?` : "Supprimer ce produit ?"}
        confirmLabel="Supprimer définitivement"
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      >
        {toDelete && (
          <>
            {toDelete.length === 1 ? (
              <p>
                <strong>{toDelete[0].name}</strong> sera retiré du catalogue avec ses notices et ses images de dosage.
              </p>
            ) : (
              <ul className="max-h-40 list-disc overflow-y-auto pl-5">
                {toDelete.map((row) => (
                  <li key={row.id}>{row.name}</li>
                ))}
              </ul>
            )}
            <p className="mt-2 font-semibold text-red-700">Cette action est irréversible.</p>
          </>
        )}
      </ConfirmDialog>

      {toast && (
        <div
          role="status"
          className={`fixed right-4 bottom-4 z-50 flex items-center gap-3 rounded-lg px-4 py-3 text-[14px] font-semibold text-white shadow-lg ${
            toast.kind === "success" ? "bg-ms-primary" : "bg-red-600"
          }`}
        >
          {toast.text}
          <button type="button" onClick={() => setToast(null)} aria-label="Fermer" className="text-lg leading-none opacity-80 hover:opacity-100">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
