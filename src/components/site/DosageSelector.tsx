"use client";

export function DosageSelector({
  dosage,
  selectable,
  pressed,
  onSelect,
  compact = false,
}: {
  dosage: string;
  selectable: boolean;
  pressed: boolean;
  onSelect: () => void;
  compact?: boolean;
}) {
  const size = compact ? "px-3 py-1.5 text-xs" : "px-[15px] py-[9px] text-[13.5px]";
  const base = `rounded-md font-semibold ${size}`;

  if (!selectable) {
    return <span className={`${base} bg-ms-badge text-ms-primary`}>{dosage}</span>;
  }

  return (
    <button
      type="button"
      aria-label={`Afficher le dosage ${dosage}`}
      aria-pressed={pressed}
      onClick={onSelect}
      className={`${base} cursor-pointer ring-1 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ms-accent ${pressed
        ? "bg-ms-accent text-white ring-ms-accent"
        : "bg-ms-badge text-ms-primary ring-ms-accent/30 hover:ring-ms-accent"}`}
    >
      {dosage}
    </button>
  );
}
