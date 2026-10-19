"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export type MenuItem =
  | { label: string; href: string; external?: boolean }
  | { label: string; onSelect: () => void; danger?: boolean };

const itemClass =
  "block w-full px-4 py-2 text-left text-[14px] font-medium transition hover:bg-ms-accent/10 focus-visible:bg-ms-accent/10 focus-visible:outline-none";

// Le menu est positionné en `fixed` pour ne pas être rogné par le défilement horizontal du tableau.
export function ActionsMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<React.CSSProperties | null>(null);

  const close = () => setPosition(null);

  const toggle = () => {
    if (position) return close();
    const rect = buttonRef.current!.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const opensUp = rect.bottom + 220 > window.innerHeight;
    setPosition(opensUp ? { right, bottom: window.innerHeight - rect.top + 4 } : { right, top: rect.bottom + 4 });
  };

  useEffect(() => {
    if (!position) return;
    menuRef.current?.querySelector<HTMLElement>("[role=menuitem]")?.focus();

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        close();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [position]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={Boolean(position)}
        onClick={toggle}
        className="rounded-md px-2 py-1 text-lg leading-none font-bold text-ms-text-soft transition hover:bg-ms-accent/10 hover:text-ms-primary"
      >
        ⋯
      </button>
      {position && (
        <div
          ref={menuRef}
          role="menu"
          style={position}
          className="fixed z-50 min-w-44 overflow-hidden rounded-lg border border-ms-border bg-white py-1 shadow-lg"
        >
          {items.map((item) =>
            "href" in item ? (
              <Link
                key={item.label}
                role="menuitem"
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener" : undefined}
                onClick={close}
                className={`${itemClass} text-ms-text`}
              >
                {item.label}
                {item.external && <span aria-hidden> ↗</span>}
              </Link>
            ) : (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  close();
                  item.onSelect();
                }}
                className={`${itemClass} ${item.danger ? "text-red-600" : "text-ms-text"}`}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      )}
    </>
  );
}
