import type { NextRequest } from "next/server";

import { authorizeApiRequest } from "@/lib/api-auth";
import { json, jsonError } from "@/lib/http";
import { LEAD_STATUSES, isLeadStatus, type LeadStatus } from "@/lib/leads";
import { listLeads } from "@/lib/leads-repo";

/**
 * Заявки для бота и менеджера.
 *
 * GET /api/leads?status=new&limit=20&offset=0&order=asc
 * Заголовок: Authorization: Bearer <ADMIN_API_TOKEN>
 *
 * Параметры:
 *   status    — new | in_progress | done | rejected | spam (по умолчанию все)
 *   limit     — 1..100, по умолчанию 20
 *   offset    — пропустить N заявок, по умолчанию 0
 *   order     — desc (свежие сверху, по умолчанию) | asc
 *   after_id  — только заявки с id больше указанного (удобно опрашивать новые)
 *   since     — только заявки новее ISO-даты, например 2026-10-14T00:00:00.000Z
 */
export async function GET(request: NextRequest) {
  const auth = authorizeApiRequest(request);
  if (!auth.ok) return auth.response;

  const { searchParams } = request.nextUrl;

  const rawStatus = searchParams.get("status");
  let status: LeadStatus | undefined;

  if (rawStatus && rawStatus !== "all") {
    if (!isLeadStatus(rawStatus)) {
      return jsonError(`Неизвестный статус: ${rawStatus}`, 400, { allowed_statuses: LEAD_STATUSES });
    }
    status = rawStatus;
  }

  const rawLimit = Number(searchParams.get("limit") ?? 20);
  const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.trunc(rawLimit))) : 20;

  const rawOffset = Number(searchParams.get("offset") ?? 0);
  const offset = Number.isFinite(rawOffset) ? Math.max(0, Math.trunc(rawOffset)) : 0;

  const rawAfterId = searchParams.get("after_id");
  const afterId = rawAfterId === null ? undefined : Number(rawAfterId);
  if (afterId !== undefined && !Number.isInteger(afterId)) {
    return jsonError("after_id должен быть числом", 400);
  }

  const rawSince = searchParams.get("since");
  const since = rawSince ? new Date(rawSince) : undefined;
  if (since && Number.isNaN(since.getTime())) {
    return jsonError("since должен быть датой в формате ISO", 400);
  }

  const order = searchParams.get("order") === "asc" ? "asc" : "desc";

  try {
    const { leads, total, counts } = await listLeads({ status, limit, offset, afterId, since, order });

    return json({
      ok: true,
      total,
      count: leads.length,
      limit,
      offset,
      statuses: LEAD_STATUSES,
      counts,
      leads,
    });
  } catch (error) {
    console.error("[api/leads] не удалось прочитать заявки", error);
    return jsonError("Не удалось прочитать заявки из MySQL", 500);
  }
}
