import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { ensureSchema, getPool } from "./db";
import { isLeadStatus, type Lead, type LeadInput, type LeadStatus, LEAD_STATUSES } from "./leads";

type LeadRow = RowDataPacket & {
  id: number | string;
  name: string;
  phone: string;
  interests: string | null;
  note: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  click_id: string | null;
  click_id_type: string | null;
  referrer: string | null;
  landing_page: string | null;
  page_url: string | null;
  user_agent: string | null;
  ip: string | null;
  status: string;
  status_changed_at: Date | null;
  status_changed_by: string | null;
  created_at: Date;
  updated_at: Date | null;
};

const COLUMNS = [
  "id",
  "name",
  "phone",
  "interests",
  "note",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "click_id",
  "click_id_type",
  "referrer",
  "landing_page",
  "page_url",
  "user_agent",
  "ip",
  "status",
  "status_changed_at",
  "status_changed_by",
  "created_at",
  "updated_at",
].join(", ");

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function splitInterests(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(", ")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mapRow(row: LeadRow): Lead {
  return {
    id: Number(row.id),
    name: row.name,
    phone: row.phone,
    interests: splitInterests(row.interests),
    note: row.note,
    utmSource: row.utm_source,
    utmMedium: row.utm_medium,
    utmCampaign: row.utm_campaign,
    utmContent: row.utm_content,
    utmTerm: row.utm_term,
    clickId: row.click_id,
    clickIdType: row.click_id_type,
    referrer: row.referrer,
    landingPage: row.landing_page,
    pageUrl: row.page_url,
    userAgent: row.user_agent,
    ip: row.ip,
    status: isLeadStatus(row.status) ? row.status : "new",
    statusChangedAt: toIso(row.status_changed_at),
    statusChangedBy: row.status_changed_by,
    createdAt: toIso(row.created_at) ?? new Date().toISOString(),
    updatedAt: toIso(row.updated_at),
  };
}

export async function createLead(input: LeadInput): Promise<Lead> {
  await ensureSchema();

  const [result] = await getPool().execute<ResultSetHeader>(
    `INSERT INTO leads
      (name, phone, interests, note, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       click_id, click_id_type, referrer, landing_page, page_url, user_agent, ip)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.name,
      input.phone,
      input.interests.join(", "),
      input.note,
      input.utmSource,
      input.utmMedium,
      input.utmCampaign,
      input.utmContent,
      input.utmTerm,
      input.clickId,
      input.clickIdType,
      input.referrer,
      input.landingPage,
      input.pageUrl,
      input.userAgent,
      input.ip,
    ],
  );

  const created = await getLeadById(result.insertId);
  if (!created) {
    throw new Error(`Заявка ${result.insertId} не нашлась сразу после вставки`);
  }

  return created;
}

export async function getLeadById(id: number): Promise<Lead | null> {
  await ensureSchema();

  const [rows] = await getPool().query<LeadRow[]>(
    `SELECT ${COLUMNS} FROM leads WHERE id = ? LIMIT 1`,
    [id],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}

export type ListLeadsParams = {
  status?: LeadStatus;
  limit: number;
  offset: number;
  /** Только заявки с id больше указанного — удобно для опроса из бота. */
  afterId?: number;
  /** Только заявки, созданные позже указанного момента (ISO-строка). */
  since?: Date;
  order: "asc" | "desc";
};

export type ListLeadsResult = {
  leads: Lead[];
  total: number;
  counts: Record<LeadStatus, number>;
};

export async function listLeads(params: ListLeadsParams): Promise<ListLeadsResult> {
  await ensureSchema();

  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.status) {
    conditions.push("status = ?");
    values.push(params.status);
  }
  if (params.afterId !== undefined) {
    conditions.push("id > ?");
    values.push(params.afterId);
  }
  if (params.since) {
    conditions.push("created_at > ?");
    values.push(params.since);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const direction = params.order === "asc" ? "ASC" : "DESC";

  const pool = getPool();

  const [rows] = await pool.query<LeadRow[]>(
    `SELECT ${COLUMNS} FROM leads ${where} ORDER BY id ${direction} LIMIT ? OFFSET ?`,
    [...values, params.limit, params.offset],
  );

  const [totalRows] = await pool.query<(RowDataPacket & { total: number | string })[]>(
    `SELECT COUNT(*) AS total FROM leads ${where}`,
    values,
  );

  // Разбивка по статусам считается по всем заявкам — удобно для сводки в боте.
  const [countRows] = await pool.query<(RowDataPacket & { status: string; total: number | string })[]>(
    "SELECT status, COUNT(*) AS total FROM leads GROUP BY status",
  );

  const counts = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<
    LeadStatus,
    number
  >;

  for (const row of countRows) {
    if (isLeadStatus(row.status)) counts[row.status] = Number(row.total);
  }

  return { leads: rows.map(mapRow), total: Number(totalRows[0]?.total ?? 0), counts };
}

export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  changedBy?: string | null,
): Promise<Lead | null> {
  await ensureSchema();

  const [result] = await getPool().execute<ResultSetHeader>(
    `UPDATE leads
        SET status = ?, status_changed_at = UTC_TIMESTAMP(), status_changed_by = ?
      WHERE id = ?`,
    [status, changedBy ?? null, id],
  );

  if (result.affectedRows === 0) return null;

  return getLeadById(id);
}
