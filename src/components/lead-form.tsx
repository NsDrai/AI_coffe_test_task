"use client";

import { useActionState, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { submitLead } from "@/app/actions";
import { InterestsSelect } from "@/components/interests-select";
import { Toast, type ToastData } from "@/components/toast";
import { useAttribution } from "@/lib/attribution";
import type { Attribution } from "@/lib/attribution";
import type { LeadField, LeadFormState } from "@/lib/leads";
import { PHONE_HINT, PHONE_INPUT_PATTERN, formatPhoneInput } from "@/lib/phone";

const INITIAL_STATE: LeadFormState = { status: "idle" };

const FIELD_CLASS =
  "w-full rounded-2xl border border-line bg-card px-4 py-3 text-[15px] text-ink placeholder:text-ink-soft/70 transition-colors hover:border-latte focus:border-coffee focus:outline-none";

const LABEL_CLASS = "mb-1.5 block text-sm font-semibold text-ink";

const FIELD_ORDER: LeadField[] = ["name", "phone", "interests", "note"];

/** Звёздочка у обязательных полей. Скрыта от диктофонов: required уже есть у input. */
function RequiredMark() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-coffee">
      *
    </span>
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

/** Ответ сервера превращаем в одно всплывающее уведомление. */
function buildServerToast(state: LeadFormState): ToastData | null {
  if (state.status === "success") {
    return {
      key: `success:${state.submittedAt ?? "1"}`,
      tone: "success",
      title: "Заявка отправлена",
      details: state.message ? [state.message] : [],
    };
  }

  if (state.status !== "error") return null;

  const fieldDetails = FIELD_ORDER.map((field) => state.errors?.[field]).filter(
    (message): message is string => Boolean(message),
  );

  const isCommonError = Boolean(state.errors?.form) && fieldDetails.length === 0;
  const details = fieldDetails.length > 0 ? fieldDetails : state.message ? [state.message] : [];

  return {
    key: `error:${fieldDetails.join("|")}:${state.message ?? ""}`,
    tone: "error",
    title: isCommonError ? "Не получилось отправить" : "Проверьте форму",
    details,
  };
}

/** Что именно не так в форме по мнению браузера (required / pattern). */
function invalidMessages(form: HTMLFormElement): string[] {
  const messages: string[] = [];

  const name = form.elements.namedItem("name");
  if (name instanceof HTMLInputElement && !name.validity.valid) {
    messages.push(name.value.trim() ? "Имя слишком короткое" : "Укажите имя");
  }

  const phone = form.elements.namedItem("phone");
  if (phone instanceof HTMLInputElement && !phone.validity.valid) {
    messages.push(phone.value.trim() ? "Проверьте номер телефона — нужен белорусский" : "Укажите телефон");
  }

  return messages.length > 0 ? messages : ["Заполните обязательные поля"];
}

type FieldsProps = {
  state: LeadFormState;
  formAction: (payload: FormData) => void;
  pending: boolean;
};

function LeadFormFields({ state, formAction, pending }: FieldsProps) {
  const attribution = useAttribution();
  const [phone, setPhone] = useState("");
  const [clientToast, setClientToast] = useState<ToastData | null>(null);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const toastSeq = useRef(0);

  const ids = useId();
  const nameId = `${ids}-name`;
  const phoneId = `${ids}-phone`;
  const phoneHintId = `${ids}-phone-hint`;
  const interestsId = `${ids}-interests`;
  const noteId = `${ids}-note`;

  const server = useMemo(() => buildServerToast(state), [state]);

  // Браузер сам решает, что поле невалидно (required/pattern). Гасим его всплывающий
  // «пузырь» и показываем своё уведомление — разметка формы при этом не сдвигается.
  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const onInvalid = (event: Event) => {
      event.preventDefault();
      const details = invalidMessages(form);
      form.querySelector<HTMLElement>(":invalid")?.focus();
      toastSeq.current += 1;
      setClientToast({
        key: `invalid:${toastSeq.current}`,
        tone: "error",
        title: "Проверьте форму",
        details,
      });
    };

    form.addEventListener("invalid", onInvalid, true);
    return () => form.removeEventListener("invalid", onInvalid, true);
  }, []);

  const activeToast = clientToast ?? (server && server.key !== dismissedKey ? server : null);

  const closeToast = useCallback(() => {
    setClientToast(null);
    if (server) setDismissedKey(server.key);
  }, [server]);

  // Начали править поле — убираем уведомление об ошибке, оно больше не актуально.
  const dismissClientToast = useCallback(() => setClientToast(null), []);

  // Новая отправка — показываем свежий результат, даже если такой же уже закрывали.
  const prepareSubmit = useCallback(() => {
    setClientToast(null);
    setDismissedKey(null);
  }, []);

  const handlePhoneBlur = () => {
    if (phone.trim()) setPhone(formatPhoneInput(phone));
  };

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      {activeToast ? <Toast key={activeToast.key} toast={activeToast} onClose={closeToast} /> : null}

      {/* Ловушка для спам-ботов: поле скрыто от людей */}
      <div aria-hidden="true" className="hidden">
        <label htmlFor={`${ids}-company`}>Компания</label>
        <input id={`${ids}-company`} type="text" name="company" tabIndex={-1} autoComplete="off" />
      </div>

      <AttributionFields attribution={attribution} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor={nameId} className={LABEL_CLASS}>
            Имя <RequiredMark />
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
            onChange={dismissClientToast}
            className={FIELD_CLASS}
          />
        </div>

        <div>
          <label htmlFor={phoneId} className={LABEL_CLASS}>
            Телефон <RequiredMark />
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
              dismissClientToast();
            }}
            onBlur={handlePhoneBlur}
            aria-invalid={state.errors?.phone ? true : undefined}
            aria-describedby={phoneHintId}
            className={FIELD_CLASS}
          />
          <p id={phoneHintId} className="mt-1.5 text-xs text-ink-soft">
            Только для связи по заявке. Формат: {PHONE_HINT}
          </p>
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
          onChange={dismissClientToast}
          className={`${FIELD_CLASS} resize-y`}
        />
      </div>

      <div className="space-y-3">
        <button
          type="submit"
          disabled={pending}
          onClick={prepareSubmit}
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
