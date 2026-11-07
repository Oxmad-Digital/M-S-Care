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

const actionClass =
  "inline-flex items-center gap-1.5 rounded-full border border-ms-accent/30 px-3.5 py-1.5 text-xs font-semibold text-ms-primary transition hover:bg-ms-accent/10 disabled:opacity-50";

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
  const [pending, startTransition] = useTransition();
  const long = message.message.length > LONG_MESSAGE;
  const replySubject = encodeURIComponent(`Re: ${message.subject} — M&S Care`);

  const toggleRead = () => startTransition(() => markMessageRead(message.id, !message.read));
  const remove = () => {
    setConfirming(false);
    startTransition(() => deleteMessage(message.id));
  };

  return (
    <article
      className={`relative rounded-lg border bg-white p-4 transition-opacity sm:p-5 ${
        message.read ? "border-ms-border" : "border-ms-accent/60 shadow-[inset_3px_0_0_var(--color-ms-accent)]"
      } ${pending ? "opacity-60" : ""}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
        <div className="flex min-w-0 items-center gap-2">
          {!message.read && (
            <span className="size-2 shrink-0 rounded-full bg-ms-accent" aria-label="Non lu" role="img" />
          )}
          <p className={`truncate text-[15px] text-ms-primary ${message.read ? "font-semibold" : "font-extrabold"}`}>
            {message.name}
          </p>
          <span className="shrink-0 rounded-full bg-ms-badge px-2.5 py-0.5 text-[11.5px] font-semibold text-ms-primary">
            {message.subject}
          </span>
        </div>
        <time dateTime={message.receivedIso} title={message.receivedFull} className="shrink-0 text-[12.5px] text-ms-text-muted">
          {message.receivedLabel}
        </time>
      </header>

      <p className="mt-1 flex flex-wrap gap-x-3 text-[13px] text-ms-text-muted">
        <a href={`mailto:${message.email}`} className="break-all hover:text-ms-primary hover:underline">
          {message.email}
        </a>
        {message.phone && (
          <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className="hover:text-ms-primary hover:underline">
            {message.phone}
          </a>
        )}
      </p>

      <p
        className={`mt-3 text-[14.5px] leading-[1.6] whitespace-pre-line text-ms-text ${
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

      <footer className="mt-4 flex flex-wrap items-center gap-2">
        <a
          href={`mailto:${message.email}?subject=${replySubject}`}
          className={`${actionClass} border-ms-accent bg-ms-accent text-white hover:bg-ms-primary`}
        >
          Répondre
        </a>
        {message.phone && (
          <a href={`tel:${message.phone.replace(/[^\d+]/g, "")}`} className={actionClass}>
            Appeler
          </a>
        )}
        {canEdit && (
          <button type="button" onClick={toggleRead} disabled={pending} className={actionClass}>
            {message.read ? "Marquer non lu" : "Marquer comme traité"}
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending}
            className="ml-auto rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
          >
            Supprimer
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
