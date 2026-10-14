"use server";

import { after } from "next/server";
import { headers } from "next/headers";

import { parseLeadSubmission, type LeadFormState } from "@/lib/leads";
import { createLead } from "@/lib/leads-repo";
import { applyRefererFallback } from "@/lib/lead-source";
import { notifyNewLead } from "@/lib/notify";
import { checkRateLimit } from "@/lib/rate-limit";
import { firstForwardedIp } from "@/lib/http";

const SUCCESS_MESSAGE =
  "Заявка у нас! Перезвоним в рабочее время: пн–пт 8:00–20:00, сб–вс 10:00–18:00.";

const RATE_LIMIT = { limit: 5, windowMs: 10 * 60 * 1000 };

/**
 * Приём заявки с лендинга. Всё, что приходит из браузера, проверяется заново:
 * клиентская валидация — только удобство, истина здесь.
 */
export async function submitLead(
  _prevState: LeadFormState,
  formData: FormData,
): Promise<LeadFormState> {
  // Ловушка для ботов: люди это поле не видят и не заполняют.
  const honeypot = formData.get("company");
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return { status: "success", message: SUCCESS_MESSAGE, submittedAt: new Date().toISOString() };
  }

  const headerList = await headers();
  const ip =
    firstForwardedIp(headerList.get("x-forwarded-for")) ??
    headerList.get("x-real-ip")?.slice(0, 64) ??
    null;

  const rate = checkRateLimit(`lead:${ip ?? "unknown"}`, RATE_LIMIT);
  if (!rate.allowed) {
    const minutes = Math.max(1, Math.ceil(rate.retryAfterSeconds / 60));
    return {
      status: "error",
      message: `Слишком много заявок подряд. Попробуйте ещё раз через ${minutes} мин. или позвоните нам.`,
      errors: { form: "Слишком много отправок с одного адреса" },
    };
  }

  const parsed = parseLeadSubmission(formData);
  if (!parsed.ok) return parsed.state;

  const input = applyRefererFallback(
    {
      ...parsed.input,
      ip,
      userAgent: headerList.get("user-agent")?.slice(0, 500) ?? null,
    },
    headerList.get("referer"),
  );

  try {
    const lead = await createLead(input);

    // Заявка уже сохранена — уведомление отправляем после ответа, чтобы не задерживать форму.
    after(async () => {
      await notifyNewLead(lead);
    });

    return { status: "success", message: SUCCESS_MESSAGE, submittedAt: new Date().toISOString() };
  } catch (error) {
    console.error("[lead] не удалось сохранить заявку в MySQL", error);
    return {
      status: "error",
      message:
        "Не получилось сохранить заявку. Позвоните нам или попробуйте ещё раз через пару минут.",
      errors: { form: "Ошибка записи в базу" },
    };
  }
}
