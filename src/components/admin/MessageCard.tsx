"use client";

import { useState, useTransition } from "react";
import { deleteMessage, markMessageRead } from "@/lib/actions/messages";
import { ConfirmDialog } from "./ConfirmDialog";

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  read: boolean;
  receivedLabel: string;
  receivedFull: string;
  receivedIso: string;
};

// Au-delà, le message est replié sur trois lignes avec « Voir plus ».
const LONG_MESSAGE = 220;

// Actions en simples liens texte avec icône : plus légères qu'une rangée de boutons pleins.
const actionClass =
  "inline-flex items-center gap-1.5 rounded-md px-2 py-2 text-[13px] font-semibold text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary disabled:opacity-50 sm:py-1.5";

function Icon({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-4 shrink-0">
      <path d={d} />
    </svg>
  );
}

const ICONS = {
  copy: "M8 8h11a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2V8Zm-3 8H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1",
  phone: "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z",
  check: "M20 6 9 17l-5-5",
  undo: "M3 7v6h6M21 17a9 9 0 0 0-15-6.7L3 13",
  trash: "M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
};

export function MessageCard({
  message,
  canEdit,
  canDelete,
}: {
  message: AdminMessage;
  canEdit: boolean;
  canDelete: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();
  const long = message.message.length > LONG_MESSAGE;

  const toggleRead = () => startTransition(() => markMessageRead(message.id, !message.read));
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(message.email);
    } catch {
      const input = document.createElement("textarea");
      input.value = message.email;
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2_000);
  };
  const remove = () => {
    setConfirming(false);
    startTransition(() => deleteMessage(message.id));
  };

  return (
    <article
      className={`relative min-w-0 rounded-lg border bg-white p-4 transition-opacity sm:p-5 ${
        message.read ? "border-ms-border" : "border-ms-accent/40"
      } ${pending ? "opacity-60" : ""}`}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
          <span className="flex min-w-0 max-w-full items-center gap-2">
            {!message.read && (
              <span className="size-2 shrink-0 rounded-full bg-ms-accent" aria-label="Non lu" role="img" />
            )}
            <span className={`truncate text-[15px] text-ms-primary ${message.read ? "font-semibold" : "font-extrabold"}`}>
              {message.name}
            </span>
          </span>
          <span className="shrink-0 rounded-full bg-ms-badge px-2.5 py-0.5 text-[11.5px] font-semibold text-ms-primary">
            {message.subject}
          </span>
        </div>
        <time dateTime={message.receivedIso} title={message.receivedFull} className="shrink-0 pt-0.5 text-[12.5px] text-ms-text-muted">
          {message.receivedLabel}
        </time>
      </header>

      <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] text-ms-text-muted">
        <button
          type="button"
          onClick={copyEmail}
          title="Copier l’adresse email"
          className="break-all text-left hover:text-ms-primary hover:underline"
        >
          {message.email}
        </button>
        {message.phone && (
          <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ms-primary hover:underline">
            {message.phone}
          </a>
        )}
      </p>

      <p
        className={`mt-3 text-[14.5px] leading-[1.6] whitespace-pre-line text-ms-text [overflow-wrap:anywhere] ${
          long && !expanded ? "line-clamp-3" : ""
        }`}
      >
        {message.message}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-1 text-[13px] font-semibold text-ms-accent hover:text-ms-primary"
        >
          {expanded ? "Voir moins" : "Voir plus"}
        </button>
      )}

      <footer className="-mx-2 mt-3 flex flex-wrap items-center gap-x-1 border-t border-ms-border pt-2">
        <button type="button" onClick={copyEmail} className={`${actionClass} text-ms-accent`}>
          <Icon d={ICONS.copy} />
          <span aria-live="polite">{copied ? "Email copié" : "Copier l’email"}</span>
        </button>
        {message.phone && (
          <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className={actionClass}>
            <Icon d={ICONS.phone} />
            Appeler
          </a>
        )}
        {canEdit && (
          <button type="button" onClick={toggleRead} disabled={pending} className={actionClass}>
            <Icon d={message.read ? ICONS.undo : ICONS.check} />
            <span className="sm:hidden">{message.read ? "Non lu" : "Traité"}</span>
            <span className="hidden sm:inline">{message.read ? "Marquer non lu" : "Marquer comme traité"}</span>
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending}
            aria-label="Supprimer"
            title="Supprimer"
            className={`${actionClass} ml-auto hover:bg-red-50 hover:text-red-600`}
          >
            <Icon d={ICONS.trash} />
          </button>
        )}
      </footer>

      <ConfirmDialog
        open={confirming}
        title="Supprimer ce message ?"
        confirmLabel="Supprimer définitivement"
        onConfirm={remove}
        onCancel={() => setConfirming(false)}
      >
        <p>
          Le message de <strong>{message.name}</strong> sera effacé. Utile pour le spam ; un message légitime
          peut plutôt être marqué comme traité.
        </p>
      </ConfirmDialog>
    </article>
  );
}
