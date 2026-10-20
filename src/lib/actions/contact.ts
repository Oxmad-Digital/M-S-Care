"use server";

import { prisma } from "@/lib/prisma";
import { appUrl, sendEmail } from "@/lib/email";
import { contactAcknowledgmentEmail, contactNotificationEmail, type ContactDetails } from "@/lib/email-templates";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  error?: string;
};

// Notification à l'adresse de contact (CONTACT_EMAIL) ; « Répondre » écrit directement au visiteur.
// Sans adresse définie, rien n'est envoyé : le message reste consultable dans l'admin (Messages).
async function notifyTeam(contact: ContactDetails) {
  const to = process.env.CONTACT_EMAIL;
  if (!to) return;
  await sendEmail({
    to,
    reply: contact.email,
    ...contactNotificationEmail({ siteUrl: await appUrl(), contact, receivedAt: new Date() }),
  });
}

// Accusé de réception volontairement générique : le formulaire est public, on ne renvoie pas
// le texte saisi à une adresse que n'importe qui peut renseigner.
async function acknowledgeVisitor(email: string) {
  await sendEmail({
    to: email,
    reply: process.env.CONTACT_EMAIL,
    ...contactAcknowledgmentEmail({ siteUrl: await appUrl() }),
  });
}

export async function submitContactForm(
  _prevState: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!firstName || !lastName || !email || !subject || !message) {
    return { status: "error", error: "Merci de remplir tous les champs obligatoires." };
  }

  await prisma.contactMessage.create({
    data: {
      firstName,
      lastName,
      email,
      phone: phone || null,
      subject,
      message,
    },
  });

  // Le message est déjà enregistré : un échec d'envoi ne doit pas faire échouer le formulaire.
  const results = await Promise.allSettled([
    notifyTeam({ firstName, lastName, email, phone, subject, message }),
    acknowledgeVisitor(email),
  ]);
  for (const result of results) {
    if (result.status === "rejected") console.error(result.reason);
  }

  return { status: "success" };
}
