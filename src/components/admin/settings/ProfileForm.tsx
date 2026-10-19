"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/account";
import { buttonClass, Feedback, Field, fieldClass } from "./ui";

export function ProfileForm({ firstName, lastName, email }: { firstName: string; lastName: string; email: string }) {
  const [state, action, pending] = useActionState(updateProfile, {});

  return (
    <form action={action} className="grid gap-4 @md:grid-cols-2">
      <Field label="Prénom">
        <input name="firstName" required defaultValue={firstName} autoComplete="given-name" className={fieldClass} />
      </Field>
      <Field label="Nom">
        <input name="lastName" required defaultValue={lastName} autoComplete="family-name" className={fieldClass} />
      </Field>
      <div className="@md:col-span-2">
        <Field label="Email">
          <input value={email} disabled className={fieldClass} />
        </Field>
      </div>
      <div className="flex flex-wrap items-center gap-4 @md:col-span-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
