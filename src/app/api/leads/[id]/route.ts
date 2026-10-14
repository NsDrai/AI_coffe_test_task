import type { NextRequest } from "next/server";

import { authorizeApiRequest } from "@/lib/api-auth";
import { json, jsonError } from "@/lib/http";
import { LEAD_STATUSES, isLeadStatus } from "@/lib/leads";
import { getLeadById, updateLeadStatus } from "@/lib/leads-repo";

type RouteParams = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/** GET /api/leads/:id — одна заявка. Authorization: Bearer <ADMIN_API_TOKEN> */
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) return jsonError("Некорректный id заявки", 400);

  try {
    const lead = await getLeadById(id);
    if (!lead) return jsonError(`Заявка №${id} не найдена`, 404);
    return json({ ok: true, lead });
  } catch (error) {
    console.error(`[api/leads/${id}] не удалось прочитать заявку`, error);
    return jsonError("Не удалось прочитать заявку из MySQL", 500);
  }
}

/**
 * PATCH /api/leads/:id — смена статуса заявки из бота.
 *
 * Тело: { "status": "in_progress", "by": "@manager" }
 * Допустимые статусы: new, in_progress, done, rejected, spam
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) return auth.response;

  const id = parseId((await params).id);
  if (id === null) return jsonError("Некорректный id заявки", 400);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Ожидается JSON в теле запроса", 400);
  }

  if (typeof body !== "object" || body === null) {
    return jsonError("Ожидается объект JSON", 400);
  }

  const { status, by } = body as { status?: unknown; by?: unknown };

  if (!isLeadStatus(status)) {
    return jsonError("Неизвестный статус заявки", 400, {
      allowed_statuses: LEAD_STATUSES,
    });
  }

  const changedBy =
    typeof by === "string" && by.trim() ? by.trim().slice(0, 64) : null;

  try {
    const lead = await updateLeadStatus(id, status, changedBy);
    if (!lead) return jsonError(`Заявка №${id} не найдена`, 404);
    return json({ ok: true, lead });
  } catch (error) {
    console.error(`[api/leads/${id}] не удалось обновить статус`, error);
    return jsonError("Не удалось обновить статус в MySQL", 500);
  }
}
