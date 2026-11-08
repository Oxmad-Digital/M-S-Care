import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/current-user";
import { can } from "@/lib/permissions";
import { CONTACT_SUBJECTS } from "@/lib/contact";
import { MessageCard, type AdminMessage } from "@/components/admin/MessageCard";

export const dynamic = "force-dynamic";

const TIME_ZONE = "Indian/Antananarivo";

const VIEWS = [
  { key: "a-traiter", label: "À traiter", where: { read: false } },
  { key: "traites", label: "Traités", where: { read: true } },
  { key: "tous", label: "Tous", where: {} },
] as const satisfies readonly { key: string; label: string; where: Prisma.ContactMessageWhereInput }[];
type ViewKey = (typeof VIEWS)[number]["key"];

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const fullDate = new Intl.DateTimeFormat("fr-FR", { dateStyle: "full", timeStyle: "short", timeZone: TIME_ZONE });
const shortDate = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: TIME_ZONE });
const hour = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: TIME_ZONE });
const relative = new Intl.RelativeTimeFormat("fr-FR", { numeric: "auto" });
const dayKey = new Intl.DateTimeFormat("en-CA", { timeZone: TIME_ZONE });

// « il y a 12 min », « aujourd'hui, 11:17 », « hier, 21:13 », « il y a 3 jours », puis la date.
function receivedLabel(date: Date, now: Date) {
  const minutes = Math.round((now.getTime() - date.getTime()) / 60_000);
  if (minutes < 60) return minutes < 1 ? "à l’instant" : relative.format(-minutes, "minute");
  const days = Math.round(
    (Date.parse(dayKey.format(now)) - Date.parse(dayKey.format(date))) / 86_400_000,
  );
  if (days === 0) return `aujourd’hui, ${hour.format(date)}`;
  if (days === 1) return `hier, ${hour.format(date)}`;
  if (days < 7) return relative.format(-days, "day");
  return shortDate.format(date);
}

export default async function AdminMessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  const user = await requireUser();
  const params = await searchParams;
  const viewParam = first(params.vue);
  const view = VIEWS.find((v) => v.key === viewParam) ?? VIEWS[0];
  const subjectParam = first(params.objet);
  const subject = CONTACT_SUBJECTS.find((s) => s === subjectParam);

  const [messages, unread, total] = await Promise.all([
    prisma.contactMessage.findMany({
      where: { ...view.where, ...(subject ? { subject } : {}) },
      orderBy: { createdAt: "desc" },
    }),
    prisma.contactMessage.count({ where: { read: false } }),
    prisma.contactMessage.count(),
  ]);
  const counts: Record<ViewKey, number> = { "a-traiter": unread, traites: total - unread, tous: total };

  const href = (next: { vue?: ViewKey; objet?: string | null }) => {
    const query = new URLSearchParams();
    const vue = next.vue ?? view.key;
    const objet = next.objet === undefined ? subject : next.objet;
    if (vue !== VIEWS[0].key) query.set("vue", vue);
    if (objet) query.set("objet", objet);
    const qs = query.toString();
    return qs ? `/admin/messages?${qs}` : "/admin/messages";
  };

  const now = new Date();
  const rows: AdminMessage[] = messages.map((message) => ({
    id: message.id,
    name: `${message.firstName} ${message.lastName}`.trim(),
    email: message.email,
    phone: message.phone,
    subject: message.subject,
    message: message.message,
    read: message.read,
    receivedLabel: receivedLabel(message.createdAt, now),
    receivedFull: fullDate.format(message.createdAt),
    receivedIso: message.createdAt.toISOString(),
  }));

  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-[12.5px] sm:py-1 font-semibold transition ${
      active
        ? "border-ms-primary bg-ms-primary text-white"
        : "border-ms-accent/30 bg-white text-ms-text-soft hover:bg-ms-accent/10 hover:text-ms-primary"
    }`;

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-extrabold text-ms-primary">Messages de contact</h1>
      <p className="mt-1 text-[14px] text-ms-text-soft">
        {unread === 0
          ? "Tout est traité."
          : `${unread} message${unread > 1 ? "s" : ""} à traiter.`}
      </p>

      <nav aria-label="Statut" className="mt-6 flex border-b border-ms-border sm:gap-1">
        {VIEWS.map((v) => {
          const active = v.key === view.key;
          return (
            <Link
              key={v.key}
              href={href({ vue: v.key })}
              aria-current={active ? "page" : undefined}
              className={`-mb-px flex flex-1 items-center justify-center gap-2 whitespace-nowrap border-b-2 px-2 py-2.5 sm:flex-none sm:px-3 sm:py-2 text-[14px] font-semibold transition ${
                active
                  ? "border-ms-accent text-ms-primary"
                  : "border-transparent text-ms-text-soft hover:text-ms-primary"
              }`}
            >
              {v.label}
              <span
                className={`rounded-full px-1.5 py-px text-[11.5px] ${
                  active ? "bg-ms-accent text-white" : "bg-ms-badge text-ms-text-soft"
                }`}
              >
                {counts[v.key]}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Sur mobile, les objets défilent sur une ligne plutôt que d'empiler plusieurs rangées. */}
      <div
        className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0 [&::-webkit-scrollbar]:hidden"
        aria-label="Filtrer par objet"
        role="group"
      >
        <Link href={href({ objet: null })} className={chip(!subject)} aria-current={!subject ? "true" : undefined}>
          Tous les objets
        </Link>
        {CONTACT_SUBJECTS.map((s) => (
          <Link key={s} href={href({ objet: s })} className={chip(subject === s)} aria-current={subject === s ? "true" : undefined}>
            {s}
          </Link>
        ))}
      </div>

      {rows.length === 0 ? (
        <p className="mt-10 rounded-lg border border-dashed border-ms-border bg-white px-5 py-10 text-center text-ms-text-soft">
          {view.key === "a-traiter" && !subject
            ? "Aucun message en attente."
            : "Aucun message ne correspond à ce filtre."}
        </p>
      ) : (
        <div className="mt-5 flex flex-col gap-3">
          {rows.map((row) => (
            <MessageCard
              key={row.id}
              message={row}
              canEdit={can(user.role, "edit")}
              canDelete={can(user.role, "delete")}
            />
          ))}
        </div>
      )}
    </div>
  );
}
