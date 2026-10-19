type Item = { label: string; value: number; hint?: string };

export function MagnitudeBarList({ items }: { items: Item[] }) {
  if (items.length === 0) {
    return <p className="text-[13.5px] text-ms-text-muted">Aucune donnée pour le moment.</p>;
  }

  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <ul className="flex flex-col gap-2.5">
      {items.map((item) => (
        <li
          key={item.label}
          className="grid grid-cols-[minmax(0,1fr)_72px_42px] items-center gap-2.5 rounded-md transition hover:bg-ms-accent/5"
          title={item.hint ?? item.label}
        >
          <span className="truncate text-[13px] text-ms-text">{item.label}</span>
          <span className="h-2 overflow-hidden rounded bg-ms-accent/10">
            <span
              className="block h-full rounded bg-ms-accent"
              style={{ width: `${Math.max(2, (item.value / max) * 100)}%` }}
            />
          </span>
          <span className="text-right text-[12px] font-semibold tabular-nums text-ms-ink">
            {item.value.toLocaleString("fr-FR")}
          </span>
        </li>
      ))}
    </ul>
  );
}
