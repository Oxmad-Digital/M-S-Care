"use client";

import { useState } from "react";
import { UploadButton } from "./UploadButton";

type NoticeRow = { key: string; label: string; url: string };

const fieldClass =
  "h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent";

let nextKey = 0;
const newKey = () => `notice-${nextKey++}`;

export function NoticesField({
  notices,
}: {
  notices: { label: string; url: string }[];
}) {
  const [rows, setRows] = useState<NoticeRow[]>(() =>
    notices.map((n) => ({ key: newKey(), label: n.label, url: n.url })),
  );

  const updateRow = (key: string, patch: Partial<NoticeRow>) =>
    setRows((current) =>
      current.map((row) => (row.key === key ? { ...row, ...patch } : row)),
    );

  return (
    <fieldset className="grid gap-2.5">
      <legend className="mb-1.5 text-[13px] font-semibold text-ms-text">
        Autres notices (non liées à un dosage)
      </legend>

      {rows.length === 0 && (
        <p className="text-[14px] text-ms-text-muted">Aucune notice.</p>
      )}

      {rows.map((row) => (
        <div
          key={row.key}
          className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[180px_1fr_auto_auto]"
        >
          <input
            name="noticeLabel"
            type="text"
            required
            placeholder="Notice générale"
            aria-label="Libellé de la notice"
            value={row.label}
            onChange={(e) => updateRow(row.key, { label: e.target.value })}
            className={fieldClass}
          />
          <input
            name="noticeUrl"
            type="url"
            required
            placeholder="https://…/notice.pdf"
            aria-label="URL de la notice"
            value={row.url}
            onChange={(e) => updateRow(row.key, { url: e.target.value })}
            className={fieldClass}
          />
          <UploadButton
            kind="notices"
            accept="application/pdf"
            onUploaded={(url) => updateRow(row.key, { url })}
          />
          <button
            type="button"
            onClick={() =>
              setRows((current) => current.filter((r) => r.key !== row.key))
            }
            className="h-11 rounded-md border border-red-300 px-4 text-[14px] font-semibold text-red-700 transition hover:bg-red-50"
          >
            Supprimer
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          setRows((current) => [
            ...current,
            { key: newKey(), label: "Notice", url: "" },
          ])
        }
        className="h-10 w-fit rounded-full border border-ms-accent/40 px-5 text-[14px] font-semibold text-ms-primary transition hover:bg-ms-accent/10"
      >
        + Ajouter une notice
      </button>
    </fieldset>
  );
}
