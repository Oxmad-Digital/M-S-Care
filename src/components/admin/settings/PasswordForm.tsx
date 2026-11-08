"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePassword } from "@/lib/actions/account";
import { MIN_PASSWORD_LENGTH } from "@/lib/action-state";
import { buttonClass, Feedback, Field, fieldClass } from "./ui";
import { PasswordInput } from "../PasswordInput";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePassword, {});
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="grid gap-4 @md:grid-cols-2">
      <div className="@md:col-span-2">
        <Field label="Mot de passe actuel">
          <PasswordInput name="currentPassword" required autoComplete="current-password" className={fieldClass} />
        </Field>
      </div>
      <Field label="Nouveau mot de passe">
        <PasswordInput
          name="newPassword"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={fieldClass}
        />
      </Field>
      <Field label="Confirmer le nouveau mot de passe">
        <PasswordInput
          name="confirmPassword"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          className={fieldClass}
        />
      </Field>
      <div className="flex flex-wrap items-center gap-4 @md:col-span-2">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Modification…" : "Changer le mot de passe"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
