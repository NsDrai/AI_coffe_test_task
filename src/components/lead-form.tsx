"use client";

import { useActionState, useId, useState } from "react";

import { submitLead } from "@/app/actions";
import { CheckIcon } from "@/components/icons";
import { InterestsSelect } from "@/components/interests-select";
import { useAttribution } from "@/lib/attribution";
import type { Attribution } from "@/lib/attribution";
import type { LeadFormState } from "@/lib/leads";
import { PHONE_HINT, PHONE_INPUT_PATTERN, formatPhoneInput, isValidByPhone } from "@/lib/phone";

const INITIAL_STATE: LeadFormState = { status: "idle" };

const FIELD_CLASS =
  "w-full rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors hover:border-latte focus:border-coffee focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-ink";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger">
      {message}
    </p>
  );
}

function AttributionFields({ attribution }: { attribution: Attribution }) {
  return (
    <>
      <input type="hidden" name="utm_source" value={attribution.utmSource} />
      <input type="hidden" name="utm_medium" value={attribution.utmMedium} />
      <input type="hidden" name="utm_campaign" value={attribution.utmCampaign} />
      <input type="hidden" name="utm_content" value={attribution.utmContent} />
      <input type="hidden" name="utm_term" value={attribution.utmTerm} />
      <input type="hidden" name="click_id" value={attribution.clickId} />
      <input type="hidden" name="click_id_type" value={attribution.clickIdType} />
      <input type="hidden" name="referrer" value={attribution.referrer} />
      <input type="hidden" name="landing_page" value={attribution.landingPage} />
      <input type="hidden" name="page_url" value={attribution.pageUrl} />
    </>
  );
}

type FieldsProps = {
  state: LeadFormState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

function LeadFormFields({ state, formAction, pending }: FieldsProps) {
  const attribution = useAttribution();
  const [phone, setPhone] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const ids = useId();
  const nameId = `${ids}-name`;
  const phoneId = `${ids}-phone`;
  const phoneHintId = `${ids}-phone-hint`;
  const interestsId = `${ids}-interests`;
  const noteId = `${ids}-note`;

  const serverPhoneError = state.errors?.phone;
  const shownPhoneError = serverPhoneError ?? phoneError;

  const handlePhoneBlur = () => {
    if (!phone.trim()) {
      setPhoneError(null);
      return;
    }

    setPhoneError(isValidByPhone(phone) ? null : "Проверьте номер: нужен белорусский");
    setPhone(formatPhoneInput(phone));
  };

  return (
    <form action={formAction} className="space-y-5">
      {/* Ловушка для спам-ботов: поле скрыто от людей */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={`${ids}-company`}>Компания</label>
        <input id={`${ids}-company`} type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <AttributionFields attribution={attribution} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className={LABEL_CLASS}>
            Имя
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            required
            maxLength={120}
            autoComplete="name"
            placeholder="Как вас зовут"
            aria-invalid={state.errors?.name ? true : undefined}
            className={FIELD_CLASS}
          />
          <FieldError message={state.errors?.name} />
        </div>

        <div>
          <label htmlFor={phoneId} className={LABEL_CLASS}>
            Телефон
          </label>
          <input
            id={phoneId}
            name="phone"
            type="tel"
            required
            inputMode="tel"
            autoComplete="tel"
            placeholder={PHONE_HINT}
            pattern={PHONE_INPUT_PATTERN}
            title={`Белорусский номер в формате ${PHONE_HINT}`}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              if (phoneError) setPhoneError(null);
            }}
            onBlur={handlePhoneBlur}
            aria-invalid={shownPhoneError ? true : undefined}
            aria-describedby={phoneHintId}
            className={FIELD_CLASS}
          />
          <p id={phoneHintId} className="mt-1.5 text-xs text-ink-soft">
            Только для связи по заявке. Формат: {PHONE_HINT}
          </p>
          <FieldError message={shownPhoneError ?? undefined} />
        </div>
      </div>

      <div>
        <label htmlFor={interestsId} className={LABEL_CLASS}>
          Что заинтересовало
        </label>
        <InterestsSelect name="interests" error={state.errors?.interests} />
        <p className="mt-1.5 text-xs text-ink-soft">
          Можно выбрать несколько позиций или не выбирать вовсе.
        </p>
        <FieldError message={state.errors?.interests} />
      </div>

      <div>
        <label htmlFor={noteId} className={LABEL_CLASS}>
          Примечание <span className="font-normal text-ink-soft">— необязательно</span>
        </label>
        <textarea
          id={noteId}
          name="note"
          rows={3}
          maxLength={1000}
          placeholder="Например: нужен помол под воронку и 2 пачки Колумбии"
          aria-invalid={state.errors?.note ? true : undefined}
          className={`${FIELD_CLASS} resize-y`}
        />
        <FieldError message={state.errors?.note} />
      </div>

      <div aria-live="polite" className="space-y-3">
        {state.status === "success" ? (
          <p className="flex items-start gap-3 rounded-2xl border border-success/30 bg-success/10 px-4 py-3.5 text-[15px] text-ink">
            <CheckIcon className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            {state.message}
          </p>
        ) : null}

        {state.status === "error" && state.message ? (
          <p
            role="alert"
            className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3.5 text-[15px] text-ink"
          >
            {state.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-coffee px-5 py-3.5 text-base font-bold text-cream transition-colors hover:bg-coffee-dark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:px-8"
        >
          {pending ? "Отправляем…" : "Отправить заявку"}
          {pending ? (
            <span
              aria-hidden="true"
              className="h-4 w-4 animate-spin rounded-full border-2 border-cream/40 border-t-cream"
            />
          ) : null}
        </button>

        <p className="text-xs leading-relaxed text-ink-soft">
          Отправляя форму, вы соглашаетесь на обработку персональных данных. Используем их только
          чтобы связаться по заявке.
        </p>
      </div>
    </form>
  );
}

export function LeadForm() {
  const [state, formAction, pending] = useActionState(submitLead, INITIAL_STATE);

  // После успешной отправки форма перерисовывается с чистого листа.
  return (
    <LeadFormFields
      key={state.submittedAt ?? "initial"}
      state={state}
      formAction={formAction}
      pending={pending}
    />
  );
}
