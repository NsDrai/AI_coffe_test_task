import type { LeadInput } from "./leads";

const CLICK_ID_KEYS = ["yclid", "gclid", "fbclid"] as const;

function clean(value: string | null, max = 190): string | null {
  if (!value) return null;
  const trimmed = value.trim().slice(0, max);
  return trimmed ? trimmed : null;
}

export function parseUtmFromUrl(rawUrl: string): Partial<LeadInput> {
  const result: Partial<LeadInput> = {};

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return result;
  }

  const source = clean(url.searchParams.get("utm_source"));
  const medium = clean(url.searchParams.get("utm_medium"));
  const campaign = clean(url.searchParams.get("utm_campaign"));
  const content = clean(url.searchParams.get("utm_content"));
  const term = clean(url.searchParams.get("utm_term"));

  if (source) result.utmSource = source;
  if (medium) result.utmMedium = medium;
  if (campaign) result.utmCampaign = campaign;
  if (content) result.utmContent = content;
  if (term) result.utmTerm = term;

  for (const key of CLICK_ID_KEYS) {
    const value = clean(url.searchParams.get(key));
    if (value) {
      result.clickId = value;
      result.clickIdType = key;
      break;
    }
  }

  return result;
}

/**
 * Подстраховка на случай, если скрытые поля не доехали с клиента (например, отключён JS).
 * Referer у POST-запроса — это адрес нашей же страницы вместе с рекламными метками,
 * поэтому метки и страницу можно вытащить прямо из него.
 */
export function applyRefererFallback(input: LeadInput, refererHeader: string | null): LeadInput {
  if (!refererHeader) return input;

  const fromReferer = parseUtmFromUrl(refererHeader);
  const next: LeadInput = { ...input };

  next.utmSource = next.utmSource ?? fromReferer.utmSource ?? null;
  next.utmMedium = next.utmMedium ?? fromReferer.utmMedium ?? null;
  next.utmCampaign = next.utmCampaign ?? fromReferer.utmCampaign ?? null;
  next.utmContent = next.utmContent ?? fromReferer.utmContent ?? null;
  next.utmTerm = next.utmTerm ?? fromReferer.utmTerm ?? null;
  next.clickId = next.clickId ?? fromReferer.clickId ?? null;
  next.clickIdType = next.clickIdType ?? fromReferer.clickIdType ?? null;

  const pageUrl = clean(refererHeader, 700);
  if (!next.pageUrl && pageUrl) next.pageUrl = pageUrl;
  if (!next.landingPage && pageUrl) next.landingPage = pageUrl;

  return next;
}
