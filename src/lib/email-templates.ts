// Templates des emails transactionnels. HTML en tableaux et styles en ligne : c'est ce que
// Gmail, Outlook et Apple Mail affichent de façon fiable.

const COLOR = {
  bg: "#f2f8f4",
  card: "#ffffff",
  border: "#d6eae4",
  primary: "#14574b",
  accent: "#289280",
  ink: "#17342e",
  text: "#3d5a53",
  muted: "#526e65",
  badge: "#e4f1ea",
};
const FONT = "Montserrat,'Helvetica Neue',Helvetica,Arial,sans-serif";

export function escapeHtml(text: string) {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

type Email = { subject: string; body: string };

function layout({ siteUrl, preheader, content }: { siteUrl: string; preheader: string; content: string }) {
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>M&amp;S Care</title>
<link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;700&amp;display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:${COLOR.bg};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${COLOR.bg}">
  <tr>
    <td align="center" style="padding:40px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px">
        <tr>
          <td align="center" style="padding:0 0 28px">
            <a href="${siteUrl}" style="text-decoration:none">
              <img src="${siteUrl}/images/logo.png" width="150" height="54" alt="M&amp;S Care" style="display:block;border:0;width:150px;height:54px">
            </a>
          </td>
        </tr>
        <tr>
          <td style="background:${COLOR.card};border:1px solid ${COLOR.border};border-radius:16px;overflow:hidden">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr><td height="5" style="height:5px;line-height:5px;font-size:0;background:${COLOR.accent}">&nbsp;</td></tr>
              <tr>
                <td style="padding:40px 40px 36px;font-family:${FONT};color:${COLOR.text};font-size:15px;line-height:1.65">
                  ${content}
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:28px 24px 0;font-family:${FONT};font-size:12px;line-height:1.7;color:${COLOR.muted}">
            <strong style="color:${COLOR.primary}">M&amp;S Care</strong> · Linea Pharmaceuticals (Int) Ltd<br>
            Suite B11, Harewood Park Dr. Lesur Street, Beau Bassin 71512, Mauritius<br>
            <a href="${siteUrl}" style="color:${COLOR.accent};text-decoration:none;font-weight:600">${siteUrl.replace(/^https?:\/\/(www\.)?/, "")}</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function eyebrow(text: string) {
  return `<p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${COLOR.accent}">${text}</p>`;
}

function heading(text: string) {
  return `<h1 style="margin:0 0 18px;font-family:${FONT};font-size:24px;line-height:1.3;font-weight:700;color:${COLOR.primary}">${text}</h1>`;
}

function paragraph(html: string) {
  return `<p style="margin:0 0 16px">${html}</p>`;
}

// Bouton « bulletproof » : la couleur de fond est portée par la cellule pour Outlook.
function button(href: string, label: string) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0">
  <tr>
    <td align="center" bgcolor="${COLOR.accent}" style="border-radius:999px">
      <a href="${href}" style="display:inline-block;padding:14px 30px;font-family:${FONT};font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px">${label}</a>
    </td>
  </tr>
</table>`;
}

function note(html: string) {
  return `<p style="margin:0;padding-top:20px;border-top:1px solid ${COLOR.border};font-size:13px;line-height:1.6;color:${COLOR.muted}">${html}</p>`;
}

export function invitationEmail({
  siteUrl,
  inviterName,
  roleLabel,
  roleDescription,
  link,
  days,
}: {
  siteUrl: string;
  inviterName: string;
  roleLabel: string;
  roleDescription: string;
  link: string;
  days: number;
}): Email {
  return {
    subject: "Invitation à l’espace administration M&S Care",
    body: layout({
      siteUrl,
      preheader: `${escapeHtml(inviterName)} vous invite à rejoindre l’administration du site M&amp;S Care.`,
      content: `
        ${eyebrow("Invitation")}
        ${heading("Rejoignez l’espace d’administration")}
        ${paragraph(`<strong style="color:${COLOR.ink}">${escapeHtml(inviterName)}</strong> vous invite à rejoindre l’espace d’administration du site M&amp;S Care.`)}
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 0">
          <tr>
            <td style="background:${COLOR.bg};border-radius:12px;padding:18px 20px">
              <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLOR.muted}">Votre rôle</p>
              <p style="margin:0 0 6px;font-size:17px;font-weight:700;color:${COLOR.primary}">${escapeHtml(roleLabel)}</p>
              <p style="margin:0;font-size:14px;line-height:1.55;color:${COLOR.text}">${escapeHtml(roleDescription)}</p>
            </td>
          </tr>
        </table>
        ${button(link, "Accepter l’invitation")}
        ${note(`Ce lien est valable ${days} jours. Si le bouton ne fonctionne pas, copiez cette adresse dans votre navigateur :<br>
          <a href="${link}" style="color:${COLOR.accent};word-break:break-all">${link}</a><br><br>
          Vous n’attendiez pas cette invitation ? Vous pouvez ignorer cet email.`)}`,
    }),
  };
}

export type ContactDetails = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};

export function contactNotificationEmail({
  siteUrl,
  contact,
  receivedAt,
}: {
  siteUrl: string;
  contact: ContactDetails;
  receivedAt: Date;
}): Email {
  const name = escapeHtml(`${contact.firstName} ${contact.lastName}`);
  const email = escapeHtml(contact.email);
  const date = receivedAt.toLocaleString("fr-FR", {
    timeZone: "Indian/Antananarivo",
    dateStyle: "long",
    timeStyle: "short",
  });
  const row = (label: string, value: string) => `
    <tr>
      <td style="padding:10px 16px 10px 0;border-bottom:1px solid ${COLOR.border};font-size:13px;color:${COLOR.muted};white-space:nowrap;vertical-align:top">${label}</td>
      <td style="padding:10px 0;border-bottom:1px solid ${COLOR.border};font-size:14px;color:${COLOR.ink};font-weight:600">${value}</td>
    </tr>`;
  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${COLOR.accent};text-decoration:none">${text}</a>`;
  const replySubject = encodeURIComponent(`Re: ${contact.subject} — M&S Care`);

  return {
    subject: `Nouveau message : ${contact.subject} — ${contact.firstName} ${contact.lastName}`,
    body: layout({
      siteUrl,
      preheader: `${escapeHtml(contact.subject)} · ${escapeHtml(contact.message.slice(0, 120))}`,
      content: `
        ${eyebrow("Formulaire de contact")}
        ${heading(`Nouveau message de ${name}`)}
        <p style="margin:0 0 24px">
          <span style="display:inline-block;background:${COLOR.badge};color:${COLOR.primary};font-size:13px;font-weight:700;padding:5px 14px;border-radius:999px">${escapeHtml(contact.subject)}</span>
          <span style="font-size:13px;color:${COLOR.muted};padding-left:8px">${date}</span>
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${COLOR.border}">
          ${row("Nom", name)}
          ${row("Email", link(`mailto:${email}`, email))}
          ${contact.phone ? row("Téléphone", link(`tel:${escapeHtml(contact.phone.replace(/[^\d+]/g, ""))}`, escapeHtml(contact.phone))) : ""}
        </table>
        <p style="margin:28px 0 8px;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:${COLOR.muted}">Message</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td style="background:${COLOR.bg};border-left:3px solid ${COLOR.accent};border-radius:0 12px 12px 0;padding:18px 20px;font-size:15px;line-height:1.65;color:${COLOR.ink};white-space:pre-wrap">${escapeHtml(contact.message)}</td>
          </tr>
        </table>
        ${button(`mailto:${email}?subject=${replySubject}`, `Répondre à ${escapeHtml(contact.firstName)}`)}
        ${note(`Vous pouvez aussi répondre directement à cet email : la réponse partira à ${email}.<br>
          Retrouvez tous les messages dans ${link(`${siteUrl}/admin/messages`, "l’espace d’administration")}.`)}`,
    }),
  };
}

export function contactAcknowledgmentEmail({ siteUrl }: { siteUrl: string }): Email {
  return {
    subject: "Nous avons bien reçu votre message — M&S Care",
    body: layout({
      siteUrl,
      preheader: "Merci de nous avoir contactés, notre équipe revient vers vous rapidement.",
      content: `
        ${eyebrow("Message reçu")}
        ${heading("Merci pour votre message")}
        ${paragraph("Nous avons bien reçu votre demande. Notre équipe l’étudie et revient vers vous dans les meilleurs délais.")}
        ${paragraph("En attendant, n’hésitez pas à découvrir notre gamme de produits.")}
        ${button(`${siteUrl}/#nosproduits`, "Découvrir nos produits")}
        <p style="margin:0 0 28px;color:${COLOR.ink}">À très bientôt,<br><strong style="color:${COLOR.primary}">L’équipe M&amp;S Care</strong></p>
        ${note("Cet email vous a été envoyé automatiquement suite à votre message sur notre site.")}`,
    }),
  };
}
