import { normalizePhone } from "./phone";
import { interestLabelsFromIds } from "./menu";

export const LEAD_STATUSES = ["new", "in_progress", "done", "rejected", "spam"] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Закрыта",
  rejected: "Отказ",
  spam: "Спам",
};

export function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && (LEAD_STATUSES as readonly string[]).includes(value);
}

export type LeadInput = {
  name: string;
  /** Всегда в нормализованном виде +375XXXXXXXXX */
  phone: string;
  /** Человекочитаемые названия позиций: «Эфиопия Иргачеффе, Подписка» */
  interests: string[];
  note: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  clickId: string | null;
  clickIdType: string | null;
  referrer: string | null;
  landingPage: string | null;
  pageUrl: string | null;
  userAgent: string | null;
  ip: string | null;
};

export type Lead = LeadInput & {
  id: number;
  status: LeadStatus;
  statusChangedAt: string | null;
  statusChangedBy: string | null;
  createdAt: string;
  updatedAt: string | null;
};

export type LeadField = "name" | "phone" | "interests" | "note" | "form";

export type LeadFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  errors?: Partial<Record<LeadField, string>>;
  /** Метка успешной отправки: по ней форма сбрасывается в исходный вид. */
  submittedAt?: string;
};

export const NAME_MAX = 120;
export const NOTE_MAX = 1000;

function text(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Для многострочных полей: переводы строк сохраняем, мусорные символы вырезаем. */
function multiline(formData: FormData, key: string, max: number): string {
  const value = formData.get(key);
  if (typeof value !== "string") return "";
  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function nullable(value: string, max: number): string | null {
  const cleaned = value.slice(0, max).trim();
  return cleaned ? cleaned : null;
}

export type ParseResult =
  | { ok: true; input: LeadInput }
  | { ok: false; state: LeadFormState };

/**
 * Проверка заявки из формы. Всё, что приходит из браузера, считается недоверенным:
 * поля обрезаются по длине, интересы — только из известного списка.
 */
export function parseLeadSubmission(formData: FormData): ParseResult {
  const errors: Partial<Record<LeadField, string>> = {};

  const name = text(formData, "name", NAME_MAX);
  if (!name) {
    errors.name = "Как к вам обращаться?";
  } else if (name.length < 2) {
    errors.name = "Имя слишком короткое";
  }

  const rawPhone = text(formData, "phone", 32);
  const phone = normalizePhone(rawPhone);
  if (!rawPhone) {
    errors.phone = "Укажите телефон, чтобы мы могли перезвонить";
  } else if (!phone) {
    errors.phone = "Похоже, номер не белорусский. Формат: +375 (29) 123-45-67";
  }

  const rawInterests = formData.getAll("interests").filter((v): v is string => typeof v === "string");
  const interests = interestLabelsFromIds(
    rawInterests.filter((id) => id.length <= 64).slice(0, 10),
  );

  const rawNote = multiline(formData, "note", NOTE_MAX * 2);
  let note: string | null = null;
  if (rawNote.length > NOTE_MAX) {
    errors.note = `Примечание получилось длинным — сократите до ${NOTE_MAX} символов`;
  } else {
    note = rawNote || null;
  }

  if (Object.keys(errors).length > 0) {
    return { ok: false, state: { status: "error", errors, message: "Проверьте, пожалуйста, поля ниже." } };
  }

  return {
    ok: true,
    input: {
      name,
      phone: phone as string,
      interests,
      note,
      utmSource: nullable(text(formData, "utm_source", 190), 190),
      utmMedium: nullable(text(formData, "utm_medium", 190), 190),
      utmCampaign: nullable(text(formData, "utm_campaign", 190), 190),
      utmContent: nullable(text(formData, "utm_content", 190), 190),
      utmTerm: nullable(text(formData, "utm_term", 190), 190),
      clickId: nullable(text(formData, "click_id", 190), 190),
      clickIdType: nullable(text(formData, "click_id_type", 32), 32),
      referrer: nullable(text(formData, "referrer", 700), 700),
      landingPage: nullable(text(formData, "landing_page", 700), 700),
      pageUrl: nullable(text(formData, "page_url", 700), 700),
      userAgent: null,
      ip: null,
    },
  };
}
