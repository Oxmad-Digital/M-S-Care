import { prisma } from "@/lib/prisma";
import { readDatabase } from "@/lib/database-read";
import { displayName, requireUser } from "@/lib/current-user";
import { getSiteSettings } from "@/lib/site-settings";
import { can, ROLE_DESCRIPTION, ROLE_LABEL } from "@/lib/permissions";
import { Section } from "@/components/admin/settings/ui";
import { ProfileForm } from "@/components/admin/settings/ProfileForm";
import { PasswordForm } from "@/components/admin/settings/PasswordForm";
import { MaintenanceForm } from "@/components/admin/settings/MaintenanceForm";
import { TeamSection } from "@/components/admin/settings/TeamSection";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const user = await requireUser();
  const isAdmin = can(user.role, "manage");

  return (
    <div className="max-w-6xl">
      <h1 className="mb-8 text-2xl font-extrabold text-ms-primary">Paramètres</h1>
      <div className="grid gap-8">
        <Section
          title="Mon profil"
          description={`Rôle : ${ROLE_LABEL[user.role]} — ${ROLE_DESCRIPTION[user.role]}`}
        >
          <ProfileForm firstName={user.firstName} lastName={user.lastName} email={user.email} />
        </Section>

        <Section title="Mot de passe" description="Au moins 8 caractères. Le mot de passe actuel est demandé pour confirmer.">
          <PasswordForm />
        </Section>

        {isAdmin && <AdminSections currentUserId={user.id} />}
      </div>
    </div>
  );
}

async function AdminSections({ currentUserId }: { currentUserId: string }) {
  const [settings, users, invitations] = await Promise.all([
    getSiteSettings(),
    readDatabase(() =>
      prisma.user.findMany({
        orderBy: [{ firstName: "asc" }, { email: "asc" }],
        select: { id: true, email: true, firstName: true, lastName: true, role: true },
      }),
    ),
    readDatabase(() =>
      prisma.invitation.findMany({ where: { acceptedAt: null }, orderBy: { createdAt: "desc" } }),
    ),
  ]);
  const now = new Date();

  return (
    <>
      <Section
        id="maintenance"
        title="Maintenance du site"
        description="Masque temporairement le site public derrière un écran de maintenance."
      >
        <MaintenanceForm maintenance={settings.maintenance} message={settings.maintenanceMessage} />
      </Section>

      <Section title="Équipe" description="Invitez des collaborateurs par email et gérez leurs droits sur l’espace admin.">
        <TeamSection
          users={users.map((member) => ({
            id: member.id,
            name: displayName(member),
            email: member.email,
            role: member.role,
            isSelf: member.id === currentUserId,
          }))}
          invitations={invitations.map((invitation) => ({
            id: invitation.id,
            email: invitation.email,
            role: invitation.role,
            expiresAt: invitation.expiresAt.toISOString(),
            expired: invitation.expiresAt < now,
          }))}
        />
      </Section>
    </>
  );
}
