"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CheckIcon, ChevronDownIcon } from "@/components/icons";
import { INTEREST_OPTIONS } from "@/lib/menu";

type InterestsSelectProps = {
  name: string;
  /** Ошибка от сервера, если она есть. */
  error?: string;
  describedBy?: string;
};

/**
 * Мультивыбор «что заинтересовало»: кнопка открывает список галочек,
 * изначально ничего не выбрано. Значения уходят скрытыми полями.
 */
export function InterestsSelect({ name, error, describedBy }: InterestsSelectProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const toggle = (value: string) => {
    setSelected((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  const labels = selected
    .map((value) => INTEREST_OPTIONS.find((option) => option.value === value)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <div className="relative" ref={containerRef}>
      {selected.map((value) => (
        <input key={value} type="hidden" name={name} value={value} />
      ))}

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-describedby={describedBy}
        className={`flex w-full items-center justify-between gap-3 rounded-2xl border bg-card px-4 py-3 text-left text-[15px] text-ink transition-colors hover:border-latte focus:border-coffee ${
          error ? "border-danger" : "border-line"
        }`}
      >
        <span className={selected.length === 0 ? "text-ink-soft" : "text-ink"}>
          {selected.length === 0
            ? "Ничего не выбрано"
            : `${labels.join(", ")}`}
        </span>
        <span className="flex shrink-0 items-center gap-2">
          {selected.length > 0 ? (
            <span className="rounded-full bg-coffee px-2 py-0.5 text-xs font-bold text-cream">
              {selected.length}
            </span>
          ) : null}
          <ChevronDownIcon
            className={`h-5 w-5 text-ink-soft transition-transform ${open ? "rotate-180" : ""}`}
          />
        </span>
      </button>

      <div
        id={panelId}
        hidden={!open}
        className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-line bg-card p-1.5 shadow-lg shadow-ink/5"
      >
        <ul className="space-y-0.5">
          {INTEREST_OPTIONS.map((option) => {
            const checked = selected.includes(option.value);
            return (
              <li key={option.value}>
                <label className="flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-ink transition-colors hover:bg-sand">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(option.value)}
                    className="peer sr-only"
                  />
                  <span
                    aria-hidden="true"
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                      checked ? "border-coffee bg-coffee text-cream" : "border-line bg-cream"
                    } peer-focus-visible:ring-2 peer-focus-visible:ring-coffee peer-focus-visible:ring-offset-1`}
                  >
                    {checked ? <CheckIcon className="h-3.5 w-3.5" /> : null}
                  </span>
                  <span>{option.label}</span>
                </label>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
