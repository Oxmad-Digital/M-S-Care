"use client";

import { useActionState, useState } from "react";
import { updateMaintenance } from "@/lib/actions/settings";
import { buttonClass, Feedback, Field } from "./ui";

export function MaintenanceForm({ maintenance, message }: { maintenance: boolean; message: string | null }) {
  const [state, action, pending] = useActionState(updateMaintenance, {});
  const [enabled, setEnabled] = useState(maintenance);

  return (
    <form action={action} className="grid gap-4">
      <label className="flex items-start gap-3">
        <input
          name="maintenance"
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-0.5 size-5 accent-ms-accent"
        />
        <span>
          <span className="block text-[15px] font-semibold text-ms-text">Afficher l’écran de maintenance</span>
          <span className="block text-[13.5px] text-ms-text-soft">
            Les visiteurs ne voient plus que l’écran de maintenance. Les personnes connectées à l’admin voient toujours le site.
          </span>
        </span>
      </label>
      <Field label="Message affiché (optionnel)">
        <textarea
          name="maintenanceMessage"
          rows={3}
          defaultValue={message ?? ""}
          placeholder="Nous améliorons notre site. Merci de revenir un peu plus tard."
          className="rounded-md border border-ms-accent/24 px-3 py-2.5 text-[15px] outline-none focus:border-ms-accent"
        />
      </Field>
      <div className="flex flex-wrap items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
