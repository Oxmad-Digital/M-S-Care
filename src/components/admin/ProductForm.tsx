import type { Product } from "@prisma/client";
import { ProductCategory } from "@prisma/client";

const CATEGORY_OPTIONS: { value: ProductCategory; label: string }[] = [
  { value: ProductCategory.MEDICAMENT, label: "Medicaments" },
  { value: ProductCategory.OTC, label: "Medicaments (OTC)" },
  { value: ProductCategory.SUPPLEMENT, label: "Compléments alimentaire" },
];

const fieldClass =
  "h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent";

export function ProductForm({
  action,
  product,
}: {
  action: (formData: FormData) => void;
  product?: Product;
}) {
  return (
    <form action={action} className="grid max-w-2xl gap-5">
      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">Nom</span>
        <input
          name="name"
          type="text"
          required
          defaultValue={product?.name}
          className={fieldClass}
        />
      </label>

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

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          Principe actif
        </span>
        <input
          name="principeActif"
          type="text"
          required
          defaultValue={product?.principeActif}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          Dosages (séparés par des virgules)
        </span>
        <input
          name="dosages"
          type="text"
          required
          placeholder="5mg, 10mg"
          defaultValue={product?.dosages.join(", ")}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">Forme</span>
        <input
          name="forme"
          type="text"
          required
          defaultValue={product?.forme}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          Conditionnement
        </span>
        <input
          name="conditionnement"
          type="text"
          required
          defaultValue={product?.conditionnement}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">Classe</span>
        <input
          name="classe"
          type="text"
          required
          defaultValue={product?.classe}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
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

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          Goût / saveur (optionnel)
        </span>
        <input
          name="flavor"
          type="text"
          defaultValue={product?.flavor ?? ""}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          URL de l&rsquo;image
        </span>
        <input
          name="imageUrl"
          type="text"
          required
          placeholder="/images/products/mon-produit.png"
          defaultValue={product?.imageUrl}
          className={fieldClass}
        />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-semibold text-ms-text">
          URL de la notice
        </span>
        <input
          name="noticeUrl"
          type="text"
          required
          defaultValue={product?.noticeUrl}
          className={fieldClass}
        />
      </label>

      <label className="flex items-center gap-2.5">
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

      <button
        type="submit"
        className="mt-2 h-11 w-fit rounded-full bg-ms-accent px-8 text-[15px] font-semibold text-white transition hover:bg-ms-primary"
      >
        Enregistrer
      </button>
    </form>
  );
}
