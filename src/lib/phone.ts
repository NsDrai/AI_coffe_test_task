/**
 * Телефоны Беларуси: +375 (код) xxx-xx-xx.
 * Принимаем то, как люди обычно пишут номер: +375…, 375…, 80…, 0… или вообще без префикса.
 */
export const BY_PHONE_CODES = ["17", "25", "29", "33", "44"] as const;

const NORMALIZED_PATTERN = new RegExp(
  `^\\+375(${BY_PHONE_CODES.join("|")})\\d{7}$`,
);

/** Регулярка для HTML-атрибута pattern (валидация до отправки, работает без JS). */
export const PHONE_INPUT_PATTERN =
  "^(\\+?375|80?|0)[\\s\\-\\(\\)]?(17|25|29|33|44)[\\s\\-\\(\\)]?\\d{3}[\\s\\-]?\\d{2}[\\s\\-]?\\d{2}$";

export const PHONE_HINT = "+375 (29) 123-45-67";

/** Приводит любой ввод к виду +375XXXXXXXXX. Возвращает null, если номер не похож на белорусский. */
export function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  let local = "";

  if (digits.startsWith("375")) {
    local = digits.slice(3);
  } else if (digits.length >= 10 && digits.startsWith("80")) {
    local = digits.slice(2);
  } else if (digits.length >= 10 && digits.startsWith("0")) {
    local = digits.slice(1);
  } else if (digits.length <= 9) {
    // Номер написали без кода страны: 29 123-45-67
    local = digits;
  } else {
    return null;
  }

  if (local.length !== 9) return null;

  const normalized = `+375${local}`;
  return NORMALIZED_PATTERN.test(normalized) ? normalized : null;
}

export function isValidByPhone(raw: string): boolean {
  return normalizePhone(raw) !== null;
}

/** +375291234567 -> +375 (29) 123-45-67 */
export function formatPhone(normalized: string): string {
  const match = /^\+375(\d{2})(\d{3})(\d{2})(\d{2})$/.exec(normalized);
  if (!match) return normalized;
  const [, code, a, b, c] = match;
  return `+375 (${code}) ${a}-${b}-${c}`;
}

/** Наводит порядок в поле по мере ввода: оставляет только цифры и ведёт к формату +375 (XX) XXX-XX-XX. */
export function formatPhoneInput(raw: string): string {
  let digits = raw.replace(/\D/g, "");

  if (!digits) return "";

  if (digits.startsWith("80")) digits = `375${digits.slice(2)}`;
  else if (digits.startsWith("0")) digits = `375${digits.slice(1)}`;
  else if (!digits.startsWith("375")) digits = `375${digits}`;

  digits = digits.slice(0, 12);

  const rest = digits.slice(3);
  const code = rest.slice(0, 2);
  const part1 = rest.slice(2, 5);
  const part2 = rest.slice(5, 7);
  const part3 = rest.slice(7, 9);

  let out = "+375";
  if (code) out += ` (${code})`;
  if (part1) out += ` ${part1}`;
  if (part2) out += `-${part2}`;
  if (part3) out += `-${part3}`;
  return out;
}
