"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BeanMark, CloseIcon, MenuIcon } from "@/components/icons";
import { NAV_LINKS, SITE } from "@/lib/site";

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream">
      <a
        href="#order"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-coffee focus:px-4 focus:py-2 focus:text-sm focus:text-cream"
      >
        Перейти к форме заявки
      </a>

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link href="#top" className="flex items-center gap-2.5" aria-label={`${SITE.brand} — на главную`}>
          <BeanMark className="h-9 w-9 text-coffee" />
          <span className="flex flex-col leading-none">
            <span className="text-lg font-extrabold tracking-tight text-ink">{SITE.brand}</span>
            <span className="mt-0.5 text-[11px] text-ink-soft">
              обжарка кофе · {SITE.city}
            </span>
          </span>
        </Link>

        <nav aria-label="Основная навигация" className="hidden items-center gap-0.5 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-soft transition-colors hover:bg-sand hover:text-ink"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={SITE.phoneLink}
            className="hidden rounded-full border border-line px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-coffee hover:text-coffee lg:inline-flex"
          >
            {SITE.phoneLabel}
          </a>
          <a
            href="#order"
            className="hidden rounded-full bg-coffee px-4 py-2 text-sm font-semibold text-cream transition-colors hover:bg-coffee-dark md:inline-flex"
          >
            Оставить заявку
          </a>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-expanded={open}
            aria-controls="mobile-navigation"
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-sand text-ink md:hidden"
          >
            {open ? <CloseIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/*
        Плашка мобильного меню: лежит под шапкой и выезжает из-под неё.
        Обёртка обрезает содержимое строго по нижней кромке шапки
        (top-full + overflow-hidden), поэтому в закрытом виде панель
        уезжает именно «за» шапку, а не раскрывается в потоке.
        inert убирает закрытые ссылки из фокуса и со скринридеров.
      */}
      <div
        id="mobile-navigation"
        inert={!open}
        className={`absolute inset-x-0 top-full overflow-hidden md:hidden ${
          open ? "" : "pointer-events-none"
        }`}
      >
        <nav
          aria-label="Навигация по разделам"
          className={`bg-cream py-3 shadow-[0_18px_40px_-24px_rgba(43,33,24,0.5)] border-b border-line transition-transform duration-300 ease-out ${
            open ? "translate-y-0" : "-translate-y-full"
          }`}
        >
          <div className="mx-auto w-full max-w-5xl px-4">
            <ul className="divide-y divide-line/70">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block py-3.5 text-base font-medium text-ink"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href={SITE.phoneLink}
                className="rounded-2xl border border-line bg-sand px-4 py-3 text-center text-sm font-semibold text-ink"
              >
                {SITE.phoneLabel}
              </a>
              <a
                href="#order"
                onClick={() => setOpen(false)}
                className="rounded-2xl bg-coffee px-4 py-3 text-center text-sm font-semibold text-cream"
              >
                Оставить заявку
              </a>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}
