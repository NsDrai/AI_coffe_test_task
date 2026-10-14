import { formatPhone } from "./phone";
import { LEAD_STATUS_LABELS, type Lead } from "./leads";

const MINSK_TIME_ZONE = "Europe/Minsk";
const REQUEST_TIMEOUT_MS = 8_000;

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function minskTime(iso: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: MINSK_TIME_ZONE,
  }).format(new Date(iso));
}

function shorten(value: string, max = 120): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Строки «откуда пришёл клиент» — то, что первым делом смотрит менеджер. */
export function describeSource(lead: Lead): string[] {
  const lines: string[] = [];

  const channel = [lead.utmSource, lead.utmMedium].filter(Boolean).join(" / ");
  if (channel) lines.push(`Реклама: ${channel}`);
  if (lead.utmCampaign) lines.push(`Кампания: ${lead.utmCampaign}`);
  if (lead.utmContent) lines.push(`Объявление: ${lead.utmContent}`);
  if (lead.utmTerm) lines.push(`Ключ/аудитория: ${lead.utmTerm}`);
  if (lead.clickId) {
    lines.push(`Клик (${lead.clickIdType ?? "click"}): ${shorten(lead.clickId, 60)}`);
  }
  if (lead.referrer) lines.push(`Переход с: ${shorten(lead.referrer, 160)}`);
  if (lead.landingPage) lines.push(`Первый заход: ${shorten(lead.landingPage, 160)}`);
  if (lead.pageUrl) lines.push(`Страница заявки: ${shorten(lead.pageUrl, 160)}`);

  if (lines.length === 0) lines.push("Прямой заход, без рекламных меток");

  return lines;
}

export function buildTelegramMessage(lead: Lead): string {
  const lines: string[] = [
    `☕ <b>Новая заявка №${lead.id}</b>`,
    "",
    `👤 <b>Имя:</b> ${escapeHtml(lead.name)}`,
    `📞 <b>Телефон:</b> <a href="tel:${escapeHtml(lead.phone)}">${escapeHtml(formatPhone(lead.phone))}</a>`,
  ];

  if (lead.interests.length > 0) {
    lines.push(`🎯 <b>Интерес:</b> ${escapeHtml(lead.interests.join(", "))}`);
  }
  if (lead.note) {
    lines.push(`📝 <b>Примечание:</b> ${escapeHtml(lead.note)}`);
  }

  lines.push("", "<b>Откуда пришёл</b>");
  for (const line of describeSource(lead)) {
    lines.push(`• ${escapeHtml(line)}`);
  }

  lines.push(
    "",
    `🕒 <b>Когда:</b> ${minskTime(lead.createdAt)} (Минск)`,
    `📌 <b>Статус:</b> ${LEAD_STATUS_LABELS[lead.status]}`,
  );

  return lines.join("\n");
}

/** Сводка о заявке одним текстом — для логов и для бота. */
export function buildPlainTextSummary(lead: Lead): string {
  return [
    `Заявка №${lead.id}: ${lead.name}, ${formatPhone(lead.phone)}`,
    lead.interests.length > 0 ? `Интерес: ${lead.interests.join(", ")}` : null,
    ...describeSource(lead),
  ]
    .filter(Boolean)
    .join(" | ");
}

export type NotifyOutcome = {
  channel: "telegram" | "bot-webhook";
  ok: boolean;
  error?: string;
};

async function sendToTelegram(lead: Lead): Promise<NotifyOutcome> {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) {
    return { channel: "telegram", ok: false, error: "TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы" };
  }

  const payload: Record<string, unknown> = {
    chat_id: chatId,
    text: buildTelegramMessage(lead),
    parse_mode: "HTML",
    disable_web_page_preview: true,
  };

  const threadId = process.env.TELEGRAM_MESSAGE_THREAD_ID?.trim();
  if (threadId) payload.message_thread_id = Number(threadId);

  try {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      return { channel: "telegram", ok: false, error: `Telegram ответил ${response.status}: ${shorten(body, 300)}` };
    }

    return { channel: "telegram", ok: true };
  } catch (error) {
    return { channel: "telegram", ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/** Отдаёт заявку в бот отдельным проектом: он сам решает, как её показывать. */
async function sendToBotWebhook(lead: Lead): Promise<NotifyOutcome> {
  const url = process.env.BOT_WEBHOOK_URL?.trim();

  if (!url) {
    return { channel: "bot-webhook", ok: false, error: "BOT_WEBHOOK_URL не задан" };
  }

  const secret = process.env.BOT_WEBHOOK_SECRET?.trim();

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(secret ? { "x-bot-secret": secret } : {}),
      },
      body: JSON.stringify({ event: "lead.created", lead }),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return { channel: "bot-webhook", ok: false, error: `Вебхук ответил ${response.status}` };
    }

    return { channel: "bot-webhook", ok: true };
  } catch (error) {
    return { channel: "bot-webhook", ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Уведомляет о новой заявке по всем настроенным каналам.
 * Никогда не бросает исключение: заявка уже сохранена, потеря уведомления не должна ломать форму.
 */
export async function notifyNewLead(lead: Lead): Promise<NotifyOutcome[]> {
  const hasTelegram = Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim());
  const hasWebhook = Boolean(process.env.BOT_WEBHOOK_URL?.trim());

  if (!hasTelegram && !hasWebhook) {
    console.warn(
      `[notify] Заявка №${lead.id}: каналы уведомлений не настроены. ` +
        "Задайте TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID или BOT_WEBHOOK_URL.",
    );
    return [];
  }

  const tasks: Promise<NotifyOutcome>[] = [];
  if (hasTelegram) tasks.push(sendToTelegram(lead));
  if (hasWebhook) tasks.push(sendToBotWebhook(lead));

  const outcomes = await Promise.all(tasks);

  for (const outcome of outcomes) {
    if (outcome.ok) {
      console.info(`[notify] Заявка №${lead.id} отправлена: ${outcome.channel}`);
    } else {
      console.error(`[notify] Заявка №${lead.id}, канал ${outcome.channel}: ${outcome.error}`);
    }
  }

  return outcomes;
}
