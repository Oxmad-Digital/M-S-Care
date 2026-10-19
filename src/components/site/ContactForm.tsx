"use client";

import { useActionState } from "react";
import { m } from "motion/react";
import { submitContactForm, type ContactFormState } from "@/lib/actions/contact";

const initialState: ContactFormState = { status: "idle" };

const inputClass =
  "h-12 w-full rounded-md border border-ms-accent/24 bg-white px-[15px] text-[15px] text-ms-ink outline-none transition-[border-color,box-shadow] duration-300 focus:border-ms-accent focus:shadow-[0_0_0_4px_rgba(40,146,128,0.12)]";

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    submitContactForm,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="grid gap-[18px] rounded-2xl border border-ms-accent/18 bg-ms-bg p-6 sm:p-9"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12.5px] font-semibold text-ms-text">Prénom</span>
          <input name="firstName" type="text" placeholder="Prénom" required className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-[12.5px] font-semibold text-ms-text">Nom</span>
          <input name="lastName" type="text" placeholder="Nom" required className={inputClass} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <label className="grid gap-2">
          <span className="text-[12.5px] font-semibold text-ms-text">Email</span>
          <input name="email" type="email" placeholder="Email" required className={inputClass} />
        </label>
        <label className="grid gap-2">
          <span className="text-[12.5px] font-semibold text-ms-text">
            Numéro de téléphone
          </span>
          <input name="phone" type="tel" placeholder="Numéro de téléphone" className={inputClass} />
        </label>
      </div>
      <label className="grid gap-2">
        <span className="text-[12.5px] font-semibold text-ms-text">
          Objet de ma demande
        </span>
        <select name="subject" required defaultValue="" className={inputClass}>
          <option value="" disabled>
            Sélectionnez un objet
          </option>
          <option>Service commercial</option>
          <option>Service commande</option>
          <option>Service livraison</option>
          <option>Autre</option>
        </select>
      </label>
      <label className="grid gap-2">
        <span className="text-[12.5px] font-semibold text-ms-text">Message</span>
        <textarea
          name="message"
          rows={5}
          placeholder="Message"
          required
          className="resize-vertical rounded-md border border-ms-accent/24 bg-white px-[15px] py-[13px] text-[15px] leading-[1.6] text-ms-ink outline-none transition-[border-color,box-shadow] duration-300 focus:border-ms-accent focus:shadow-[0_0_0_4px_rgba(40,146,128,0.12)]"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="btn-fill mt-1 h-13 rounded-full bg-ms-accent text-[15.5px] font-semibold text-white transition-opacity disabled:opacity-60"
      >
        {pending ? "Envoi..." : "Envoyer"}
      </button>
      {state.status === "success" && (
        <m.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2.5 text-sm font-semibold text-ms-accent"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 flex-none fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <m.path d="M5 12.5 9.5 17 19 7" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, delay: 0.15 }} />
          </svg>
          Merci, votre message a bien été pris en compte.
        </m.p>
      )}
      {state.status === "error" && (
        <m.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="text-sm font-semibold text-red-600">
          {state.error}
        </m.p>
      )}
    </form>
  );
}
