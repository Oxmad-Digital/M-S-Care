"use client";

import { useId, useState } from "react";
import { UploadButton } from "./UploadButton";

const fieldClass =
  "h-11 rounded-md border border-ms-accent/24 px-3 text-[15px] outline-none focus:border-ms-accent";

export function ImageField({ imageUrl, name = "imageUrl", label = "Image", required = true }: { imageUrl?: string; name?: string; label?: string; required?: boolean }) {
  const [url, setUrl] = useState(imageUrl ?? "");
  const id = useId();

  return (
    <div className="grid content-start gap-1.5">
      <label htmlFor={id} className="text-[13px] font-semibold text-ms-text">
        {label}
      </label>
      <div className="grid grid-cols-1 items-start gap-2 sm:grid-cols-[1fr_auto]">
        <input
          id={id}
          name={name}
          type="text"
          required={required}
          placeholder="https://…/mon-produit.png"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={fieldClass}
        />
        <UploadButton
          kind="images"
          accept="image/png,image/jpeg,image/webp,image/avif"
          onUploaded={setUrl}
        />
      </div>
      {url && (
        // eslint-disable-next-line @next/next/no-img-element -- simple aperçu admin
        <img
          src={url}
          alt="Aperçu de l'image du produit"
          className="mt-1 h-28 w-28 rounded-md border border-ms-border object-contain"
        />
      )}
    </div>
  );
}
