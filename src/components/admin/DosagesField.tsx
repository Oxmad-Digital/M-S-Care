"use client";

import { useState } from "react";
import { ImageField } from "./ImageField";
import { UploadButton } from "./UploadButton";

type Row = { key: number; dosage: string; imageUrl: string; noticeUrl: string };

const fieldClass =
  "h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] font-normal outline-none focus:border-ms-accent";

// Une ligne par dosage : le dosage n'est saisi qu'ici, son image et sa notice y sont rattachées.
export function DosagesField({ dosages, imageUrl }: { dosages: Omit<Row, "key">[]; imageUrl?: string }) {
  const [rows, setRows] = useState<Row[]>(() => dosages.map((dosage, index) => ({ ...dosage, key: index })));
  const [nextKey, setNextKey] = useState(dosages.length);

  const updateRow = (key: number, patch: Partial<Row>) =>
    setRows((current) => current.map((row) => (row.key === key ? { ...row, ...patch } : row)));

  return (
    <fieldset className="grid gap-4 rounded-lg border border-ms-border p-4">
      <legend className="px-1 text-sm font-semibold text-ms-primary">Dosages</legend>
      <p className="text-sm text-ms-text-soft">
        Le premier dosage est affiché par défaut sur le site. Son image est obligatoire ; pour les
        suivants, l’image et la notice sont optionnelles (à défaut, l’image du premier dosage est affichée).
      </p>
      {rows.length === 0 && (
        <ImageField label="Image du produit (sans dosage)" imageUrl={imageUrl} />
      )}
      {rows.map((row, index) => (
        <div key={row.key} className="grid gap-3 border-b border-ms-border pb-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-[13px] font-semibold text-ms-text">
            Dosage
            <input
              name="dosage"
              value={row.dosage}
              onChange={(event) => updateRow(row.key, { dosage: event.target.value })}
              placeholder="10mg"
              required
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            onClick={() => setRows((current) => current.filter((item) => item.key !== row.key))}
            className="w-fit self-end text-sm font-semibold text-red-600 sm:h-11 sm:justify-self-end"
          >
            Supprimer ce dosage
          </button>
          <ImageField name="dosageImageUrl" label="Image de ce dosage" imageUrl={row.imageUrl} required={index === 0} />
          <div className="grid content-start gap-1.5">
            <span className="text-[13px] font-semibold text-ms-text">Notice de ce dosage</span>
            <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto]">
              <input
                name="dosageNoticeUrl"
                type="url"
                placeholder="https://…/notice.pdf"
                aria-label={`URL de la notice ${row.dosage}`}
                value={row.noticeUrl}
                onChange={(event) => updateRow(row.key, { noticeUrl: event.target.value })}
                className={fieldClass}
              />
              <UploadButton
                kind="notices"
                accept="application/pdf"
                onUploaded={(noticeUrl) => updateRow(row.key, { noticeUrl })}
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={() => {
          setRows((current) => [...current, { key: nextKey, dosage: "", imageUrl: current.length === 0 ? imageUrl ?? "" : "", noticeUrl: "" }]);
          setNextKey((current) => current + 1);
        }}
        className="w-fit rounded-full border border-ms-border px-4 py-2 text-sm font-semibold text-ms-primary"
      >
        Ajouter un dosage
      </button>
    </fieldset>
  );
}
