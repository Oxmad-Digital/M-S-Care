import { headers } from "next/headers";

// Envoi transactionnel via Plunk (https://docs.useplunk.com).
export async function sendEmail({ to, subject, body }: { to: string; subject: string; body: string }) {
  const key = process.env.PLUNK_SECRET_KEY;
  if (!key) throw new Error("PLUNK_SECRET_KEY n’est pas configurée.");

  const response = await fetch("https://api.useplunk.com/v1/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body }),
  });
  if (!response.ok) {
    throw new Error(`Plunk a refusé l’envoi (${response.status}) : ${await response.text()}`);
  }
}

// URL publique du site, pour les liens envoyés par mail : APP_URL si définie, sinon l'hôte de la requête.
export async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const list = await headers();
  const host = list.get("x-forwarded-host") ?? list.get("host") ?? "localhost:3000";
  const proto = list.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
