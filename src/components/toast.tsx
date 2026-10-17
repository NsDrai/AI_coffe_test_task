"use client";

import { useEffect } from "react";

import { AlertIcon, CheckIcon, CloseIcon } from "@/components/icons";

export type ToastTone = "error" | "success";

export type ToastData = {
  /** Меняется при каждом новом уведомлении — по нему перезапускаются таймер и анимация. */
  key: string;
  tone: ToastTone;
  title: string;
  details: string[];
};

const AUTO_DISMISS_MS = 7000;

/**
 * Всплывающее уведомление в углу экрана. Живёт вне потока документа,
 * поэтому его появление и исчезновение не сдвигает поля формы.
 */
export function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onClose, AUTO_DISMISS_MS);
    return () => window.clearTimeout(timer);
  }, [onClose]);

  const isError = toast.tone === "error";

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex justify-center sm:inset-x-auto sm:right-6 sm:bottom-6 sm:justify-end">
      <div
        role={isError ? "alert" : "status"}
        aria-live={isError ? "assertive" : "polite"}
        className="animate-toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border border-line bg-card p-4 shadow-[0_18px_40px_-18px_rgba(43,33,24,0.5)]"
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
            isError ? "bg-danger/10 text-danger" : "bg-success/10 text-success"
          }`}
        >
          {isError ? <AlertIcon className="h-4 w-4" /> : <CheckIcon className="h-4 w-4" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">{toast.title}</p>
          {toast.details.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-sm leading-relaxed text-ink-soft">
              {toast.details.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Закрыть уведомление"
          className="-mr-1 -mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-sand hover:text-ink"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
