import { prisma } from "@/lib/prisma";
import { markMessageRead } from "@/lib/actions/messages";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const messages = await prisma.contactMessage.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-extrabold text-ms-primary">
        Messages de contact
      </h1>

      {messages.length === 0 ? (
        <p className="text-ms-text-soft">Aucun message pour le moment.</p>
      ) : (
        <div className="grid gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`rounded-lg border bg-white p-5 ${
                message.read ? "border-ms-border" : "border-ms-accent"
              }`}
            >
              <div className="mb-2 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ms-primary">
                    {message.firstName} {message.lastName}{" "}
                    <span className="font-normal text-ms-text-soft">
                      — {message.subject}
                    </span>
                  </p>
                  <p className="text-[13px] text-ms-text-muted">
                    {message.email}
                    {message.phone ? ` · ${message.phone}` : ""} ·{" "}
                    {new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(message.createdAt)}
                  </p>
                </div>
                <form
                  action={async () => {
                    "use server";
                    await markMessageRead(message.id, !message.read);
                  }}
                >
                  <button
                    type="submit"
                    className="rounded-full border border-ms-accent/30 px-3.5 py-1.5 text-xs font-semibold text-ms-primary transition hover:bg-ms-accent/10"
                  >
                    {message.read ? "Marquer non lu" : "Marquer comme lu"}
                  </button>
                </form>
              </div>
              <p className="text-[14.5px] leading-[1.6] text-ms-text">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
