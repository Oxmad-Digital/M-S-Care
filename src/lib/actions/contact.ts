"use server";

import { prisma } from "@/lib/prisma";

export type ContactFormState = {
  status: "idle" | "success" | "error";
  error?: string;
};

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

  return { status: "success" };
}
