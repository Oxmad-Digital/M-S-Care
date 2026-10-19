import Link from "next/link";
import { findValidInvitation } from "@/lib/invitations";
import { acceptInvitation } from "@/lib/actions/invitation";
import { ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";
import { AcceptInvitationForm } from "@/components/admin/AcceptInvitationForm";

export const dynamic = "force-dynamic";

export default async function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const invitation = await findValidInvitation(token);

  return (
    <div className="flex min-h-screen items-center justify-center bg-ms-bg px-5 py-10">
      <div className="w-full max-w-md rounded-lg border border-ms-border bg-white p-8 shadow-sm">
        <h1 className="mb-1 text-2xl font-extrabold text-ms-primary">M&amp;S Care</h1>
        {invitation ? (
          <>
            <p className="mb-1 text-sm text-ms-text-soft">
              Vous avez reçu une invitation pour rejoindre l’espace administration en tant que{" "}
              <strong className="text-ms-text">{ROLE_LABEL[invitation.role]}</strong>.
            </p>
            <p className="mb-6 text-[13px] text-ms-text-muted">{ROLE_DESCRIPTION[invitation.role]}</p>
            <AcceptInvitationForm email={invitation.email} action={acceptInvitation.bind(null, token)} />
          </>
        ) : (
          <>
            <p className="mt-4 text-[15px] text-ms-text">
              Ce lien d’invitation n’est plus valide : il a expiré, a déjà été utilisé ou a été annulé.
            </p>
            <p className="mt-2 text-[14px] text-ms-text-soft">Demandez une nouvelle invitation à un administrateur.</p>
            <Link href="/admin/login" className="mt-6 inline-block text-[14px] font-semibold text-ms-accent hover:text-ms-primary">
              Aller à la connexion
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
