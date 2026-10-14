"use client";

import { useSyncExternalStore } from "react";

/**
 * Разметка источника заявки: из какой рекламы, с какого объявления и с какой страницы
 * человек пришёл. Значения собираются в браузере и уезжают в скрытых полях формы.
 */
export type Attribution = StoredAttribution & {
  /** Адрес страницы, на которой заполнили форму. */
  pageUrl: string;
};

export type StoredAttribution = {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
  utmTerm: string;
  clickId: string;
  clickIdType: string;
  referrer: string;
  landingPage: string;
};

const STORED_DEFAULTS: StoredAttribution = {
  utmSource: "",
  utmMedium: "",
  utmCampaign: "",
  utmContent: "",
  utmTerm: "",
  clickId: "",
  clickIdType: "",
  referrer: "",
  landingPage: "",
};

export const EMPTY_ATTRIBUTION: Attribution = { ...STORED_DEFAULTS, pageUrl: "" };

const STORAGE_KEY = "kvarta_attribution_v1";
const MAX_LEN = 500;

const UTM_KEYS = [
  ["utm_source", "utmSource"],
  ["utm_medium", "utmMedium"],
  ["utm_campaign", "utmCampaign"],
  ["utm_content", "utmContent"],
  ["utm_term", "utmTerm"],
] as const;

const CLICK_IDS = [
  ["yclid", "yclid"],
  ["gclid", "gclid"],
  ["fbclid", "fbclid"],
] as const;

function clean(value: string | null | undefined, max = MAX_LEN): string {
  if (!value) return "";
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, max);
}

function readStored(): StoredAttribution | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Attribution>;
    const stored: StoredAttribution = { ...STORED_DEFAULTS, ...parsed };
    delete (stored as Partial<Attribution>).pageUrl;
    return stored;
  } catch {
    return null;
  }
}

function writeStored(value: StoredAttribution) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // Приватный режим и т.п. — просто не сохраняем разметку.
  }
}

/** Собирает разметку: метки из адреса, реферер и страницу первого захода. */
export function captureAttribution(): Attribution {
  const params = new URLSearchParams(window.location.search);
  const currentPage = clean(window.location.href);

  const fromUrl: StoredAttribution = { ...STORED_DEFAULTS };
  let hasUtm = false;

  for (const [queryKey, field] of UTM_KEYS) {
    const value = clean(params.get(queryKey));
    if (value) {
      fromUrl[field] = value;
      hasUtm = true;
    }
  }

  for (const [queryKey, field] of CLICK_IDS) {
    const value = clean(params.get(queryKey), 190);
    if (value && !fromUrl.clickId) {
      fromUrl.clickId = value;
      fromUrl.clickIdType = field;
      hasUtm = true;
    }
  }

  const stored = readStored();

  // Первый заход в сессии — фиксируем источник. Если человек вернулся по новой рекламной
  // ссылке, перезаписываем: важно то объявление, по которому он пришёл сейчас.
  if (!stored || hasUtm) {
    const next: StoredAttribution = hasUtm
      ? {
          ...fromUrl,
          referrer: clean(document.referrer) || stored?.referrer || "",
          landingPage: stored?.landingPage || currentPage,
        }
      : {
          ...STORED_DEFAULTS,
          referrer: clean(document.referrer),
          landingPage: currentPage,
        };

    writeStored(next);
    return { ...next, pageUrl: currentPage };
  }

  return { ...stored, pageUrl: currentPage };
}

/**
 * Значения читаются из внешнего хранилища (адрес страницы + sessionStorage),
 * поэтому используем useSyncExternalStore: так React сам обновит разметку после
 * гидратации и не будет расхождения с серверным HTML.
 */
let cachedSnapshot: Attribution | null = null;
let cachedKey = "";

function getClientSnapshot(): Attribution {
  const key = `${window.location.href}\u0000${document.referrer}`;

  if (!cachedSnapshot || cachedKey !== key) {
    cachedKey = key;
    cachedSnapshot = captureAttribution();
  }

  return cachedSnapshot;
}

function getServerSnapshot(): Attribution {
  return EMPTY_ATTRIBUTION;
}

function subscribe(onStoreChange: () => void): () => void {
  const handleHistoryChange = () => {
    // Адрес мог измениться (например, вернулись назад) — сбрасываем кэш снимка.
    cachedSnapshot = null;
    onStoreChange();
  };

  window.addEventListener("popstate", handleHistoryChange);
  window.addEventListener("pageshow", handleHistoryChange);

  return () => {
    window.removeEventListener("popstate", handleHistoryChange);
    window.removeEventListener("pageshow", handleHistoryChange);
  };
}

/**
 * Хук для формы. До гидратации отдаёт пустые значения (чтобы разметка совпала
 * с серверной), сразу после — настоящую разметку источника.
 */
export function useAttribution(): Attribution {
  return useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
}
