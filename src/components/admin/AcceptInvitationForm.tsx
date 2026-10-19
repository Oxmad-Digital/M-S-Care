"use client";

import { useActionState } from "react";
import { MIN_PASSWORD_LENGTH, type ActionState } from "@/lib/action-state";
import { buttonClass, Feedback, Field, fieldClass } from "./settings/ui";

export function AcceptInvitationForm({
  email,
  action,
}: {
  email: string;
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className="grid gap-4">
      <Field label="Email">
        <input value={email} disabled className={fieldClass} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom">
          <input name="firstName" required autoComplete="given-name" className={fieldClass} />
        </Field>
        <Field label="Nom">
          <input name="lastName" required autoComplete="family-name" className={fieldClass} />
        </Field>
      </div>
      <Field label={`Mot de passe (${MIN_PASSWORD_LENGTH} caractères minimum)`}>
        <input name="password" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={fieldClass} />
      </Field>
      <Field label="Confirmer le mot de passe">
        <input name="confirmPassword" type="password" required minLength={MIN_PASSWORD_LENGTH} autoComplete="new-password" className={fieldClass} />
      </Field>
      <Feedback state={state} />
      <button type="submit" disabled={pending} className={`${buttonClass.replace("w-fit", "w-full")} mt-2`}>
        {pending ? "Création du compte…" : "Créer mon compte"}
      </button>
    </form>
  );
}
