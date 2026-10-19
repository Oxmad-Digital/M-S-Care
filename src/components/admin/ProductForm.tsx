import type { Notice, Product, ProductVariant } from "@prisma/client";
import { ProductCategory } from "@prisma/client";
import { NoticesField } from "./NoticesField";
import { DosagesField } from "./DosagesField";
import { matchDosageNotices, normalizeDosage } from "@/lib/product-variants";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: ProductCategory.MEDICAMENT, label: "Medicaments" },
  { value: ProductCategory.OTC, label: "Medicaments (OTC)" },
  { value: ProductCategory.SUPPLEMENT, label: "Compléments alimentaire" },
];

const fieldClass =
  "h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent";

function TextField({
  name,
  label,
  defaultValue,
  required = true,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
}) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-semibold text-ms-text">{label}</span>
      <input
        name={name}
        type="text"
        required={required}
        defaultValue={defaultValue ?? ""}
        className={fieldClass}
      />
    </label>
  );
}

export function ProductForm({
  action,
  product,
  readOnly = false,
}: {
  action?: (formData: FormData) => void;
  product?: Product & { notices: Notice[]; variants: ProductVariant[] };
  readOnly?: boolean;
}) {
  const { byDosage, otherNotices } = matchDosageNotices(product ?? { dosages: [], notices: [] });
  const dosages = (product?.dosages ?? []).map((dosage, index) => ({
    dosage,
    // L'image du produit est celle du premier dosage.
    imageUrl:
      product?.variants.find((v) => normalizeDosage(v.dosage) === normalizeDosage(dosage))?.imageUrl ??
      (index === 0 ? product?.imageUrl ?? "" : ""),
    noticeUrl: byDosage.get(dosage)?.url ?? "",
  }));

  return (
    <form action={action}>
      {/* En lecture seule (rôle visiteur), le fieldset désactive tous les champs. */}
      <fieldset disabled={readOnly} className="grid min-w-0 gap-5 sm:grid-cols-2">
        <TextField name="name" label="Nom" defaultValue={product?.name} />

        <label className="grid gap-1.5">
          <span className="text-[13px] font-semibold text-ms-text">Catégorie</span>
          <select
            name="category"
            required
            defaultValue={product?.category ?? ProductCategory.MEDICAMENT}
            className={fieldClass}
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </label>

        <TextField name="principeActif" label="Principe actif" defaultValue={product?.principeActif} />
        <TextField name="classe" label="Classe" defaultValue={product?.classe} />
        <TextField name="forme" label="Forme" defaultValue={product?.forme} />
        <TextField name="conditionnement" label="Conditionnement" defaultValue={product?.conditionnement} />

        <label className="grid gap-1.5 sm:col-span-2">
          <span className="text-[13px] font-semibold text-ms-text">
            Indications
          </span>
          <textarea
            name="indications"
            rows={3}
            required
            defaultValue={product?.indications}
            className="rounded-md border border-ms-accent/24 px-3 py-2.5 text-[15px] outline-none focus:border-ms-accent"
          />
        </label>

        <TextField name="flavor" label="Goût / saveur (optionnel)" defaultValue={product?.flavor} required={false} />

        <label className="flex items-center gap-2.5 self-end sm:h-11">
          <input
            name="published"
            type="checkbox"
            defaultChecked={product?.published ?? true}
            className="h-4 w-4"
          />
          <span className="text-[14px] font-medium text-ms-text">
            Publié sur le site
          </span>
        </label>

        <div className="sm:col-span-2">
          <DosagesField dosages={dosages} imageUrl={product?.imageUrl} />
        </div>

        <div className="sm:col-span-2">
          <NoticesField notices={otherNotices} />
        </div>

        {!readOnly && (
          <button
            type="submit"
            className="mt-2 h-11 w-fit rounded-full bg-ms-accent px-8 text-[15px] font-semibold text-white transition hover:bg-ms-primary"
          >
            Enregistrer
          </button>
        )}
      </fieldset>
    </form>
  );
}
