"use client";

import { useRef, useState } from "react";
import { createUploadUrl } from "@/lib/actions/uploads";
import type { R2BucketKind } from "@/lib/r2";

export function UploadButton({
  kind,
  accept,
  onUploaded,
}: {
  kind: R2BucketKind;
  accept: string;
  onUploaded: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File) => {
    setUploading(true);
    setError(null);
    try {
      const target = await createUploadUrl(kind, file.name, file.type, file.size);
      if (!target.ok) {
        setError(target.error);
        return;
      }
      const res = await fetch(target.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        setError("L'envoi du fichier a échoué.");
        return;
      }
      onUploaded(target.publicUrl);
    } catch {
      setError("L'envoi du fichier a échoué.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="grid gap-1">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
      />
      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="h-11 whitespace-nowrap rounded-md border border-ms-accent/40 px-4 text-[14px] font-semibold text-ms-primary transition hover:bg-ms-accent/10 disabled:opacity-60"
      >
        {uploading ? "Envoi…" : "Téléverser"}
      </button>
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
