import type { ActionState } from "@/lib/action-state";

export const fieldClass =
  "h-11 w-full rounded-md border border-ms-accent/24 bg-white px-3 text-[15px] outline-none focus:border-ms-accent disabled:bg-ms-bg disabled:text-ms-text-muted";

export const buttonClass =
  "h-11 w-fit rounded-full bg-ms-accent px-6 text-[14.5px] font-semibold text-white transition hover:bg-ms-primary disabled:opacity-60";

export function Section({
  id,
  title,
  description,
  children,
}: {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  // Titre à gauche, carte à droite : toutes les cartes ont la même largeur et restent alignées.
  return (
    <section
      id={id}
      className="grid scroll-mt-6 gap-4 border-t border-ms-border pt-8 first:border-t-0 first:pt-0 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10"
    >
      <div>
        <h2 className="text-lg font-extrabold text-ms-primary">{title}</h2>
        {description && <p className="mt-1 text-[14px] leading-[1.6] text-ms-text-soft">{description}</p>}
      </div>
      <div className="@container rounded-lg border border-ms-border bg-white p-5 sm:p-6">{children}</div>
    </section>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-[13px] font-semibold text-ms-text">{label}</span>
      {children}
    </label>
  );
}

export function Feedback({ state }: { state: ActionState }) {
  if (state.error) return <p role="alert" className="text-[13.5px] font-semibold text-red-600">{state.error}</p>;
  if (state.message) return <p role="status" className="text-[13.5px] font-semibold text-ms-accent">{state.message}</p>;
  return null;
}
