"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import type { Role } from "@prisma/client";
import { inviteMember, removeUser, resendInvitation, revokeInvitation, updateUserRole } from "@/lib/actions/team";
import { ROLE_DESCRIPTION, ROLE_LABEL, ROLES } from "@/lib/permissions";
import type { ActionState } from "@/lib/action-state";
import { ConfirmDialog } from "../ConfirmDialog";
import { buttonClass, Feedback, Field, fieldClass } from "./ui";

export type TeamUser = { id: string; name: string; email: string; role: Role; isSelf: boolean };
export type PendingInvitation = { id: string; email: string; role: Role; expiresAt: string; expired: boolean };

const linkButton = "text-[13.5px] font-semibold text-ms-accent hover:text-ms-primary disabled:opacity-50";

function RoleSelect({ name, defaultValue, ...props }: { name?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select name={name} defaultValue={defaultValue} {...props} className={`${fieldClass} w-auto`}>
      {ROLES.map((role) => (
        <option key={role} value={role}>
          {ROLE_LABEL[role]}
        </option>
      ))}
    </select>
  );
}

export function TeamSection({ users, invitations }: { users: TeamUser[]; invitations: PendingInvitation[] }) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteMember, {});
  const [feedback, setFeedback] = useState<ActionState>({});
  const [toRemove, setToRemove] = useState<TeamUser | null>(null);
  const [pending, startTransition] = useTransition();
  const inviteFormRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (inviteState.ok) inviteFormRef.current?.reset();
  }, [inviteState]);

  const run = (action: () => Promise<ActionState>) => {
    setFeedback({});
    startTransition(async () => {
      try {
        setFeedback(await action());
      } catch {
        setFeedback({ error: "L’opération a échoué. Réessayez." });
      }
    });
  };

  return (
    <div className="grid gap-8">
      <form ref={inviteFormRef} action={inviteAction} className="grid content-start gap-4">
        <h3 className="text-[15px] font-bold text-ms-primary">Inviter une personne</h3>
        <div className="grid gap-4 @md:grid-cols-[1fr_auto]">
          <Field label="Email">
            <input name="email" type="email" required placeholder="prenom.nom@exemple.mg" className={fieldClass} />
          </Field>
          <Field label="Rôle">
            <RoleSelect name="role" defaultValue="MEMBER" />
          </Field>
        </div>
        <ul className="grid gap-1 text-[13px] text-ms-text-soft">
          {ROLES.map((role) => (
            <li key={role}>
              <strong className="text-ms-text">{ROLE_LABEL[role]}</strong> — {ROLE_DESCRIPTION[role]}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={invitePending} className={buttonClass}>
            {invitePending ? "Envoi…" : "Envoyer l’invitation"}
          </button>
          <Feedback state={inviteState} />
        </div>
      </form>

      <div className="grid content-start gap-8">
        <div>
          <h3 className="mb-3 text-[15px] font-bold text-ms-primary">Membres de l’équipe</h3>
          <Feedback state={feedback} />
          <ul className={`mt-2 divide-y divide-ms-border rounded-lg border border-ms-border ${pending ? "opacity-60" : ""}`}>
            {users.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ms-primary">
                    {user.name} {user.isSelf && <span className="font-normal text-ms-text-muted">(vous)</span>}
                  </p>
                  <p className="truncate text-[13px] text-ms-text-muted">{user.email}</p>
                </div>
                {user.isSelf ? (
                  <span className="rounded-full bg-ms-badge px-3 py-1 text-xs font-semibold text-ms-primary">
                    {ROLE_LABEL[user.role]}
                  </span>
                ) : (
                  <>
                    <RoleSelect
                      aria-label={`Rôle de ${user.name}`}
                      value={user.role}
                      disabled={pending}
                      onChange={(event) => run(() => updateUserRole(user.id, event.target.value as Role))}
                    />
                    <button type="button" disabled={pending} onClick={() => setToRemove(user)} className="text-[13.5px] font-semibold text-red-600 hover:text-red-700">
                      Retirer
                    </button>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        {invitations.length > 0 && (
          <div>
            <h3 className="mb-3 text-[15px] font-bold text-ms-primary">Invitations en attente</h3>
            <ul className="divide-y divide-ms-border rounded-lg border border-ms-border">
              {invitations.map((invitation) => (
                <li key={invitation.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ms-text">{invitation.email}</p>
                    <p className={`text-[13px] ${invitation.expired ? "text-amber-700" : "text-ms-text-muted"}`}>
                      {ROLE_LABEL[invitation.role]} ·{" "}
                      {invitation.expired
                        ? "Expirée"
                        : `Expire le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(invitation.expiresAt))}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => resendInvitation(invitation.id))}
                    className={linkButton}
                  >
                    Renvoyer
                  </button>
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => run(() => revokeInvitation(invitation.id))}
                    className="text-[13.5px] font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={toRemove !== null}
        title="Retirer ce membre ?"
        confirmLabel="Retirer l’accès"
        onCancel={() => setToRemove(null)}
        onConfirm={() => {
          if (!toRemove) return;
          const user = toRemove;
          setToRemove(null);
          run(() => removeUser(user.id));
        }}
      >
        {toRemove && (
          <p>
            <strong>{toRemove.name}</strong> ({toRemove.email}) n’aura plus accès à l’espace administration.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
