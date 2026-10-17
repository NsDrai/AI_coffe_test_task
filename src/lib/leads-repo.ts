import { ensureSchema, getPool } from "./db";
import { isLeadStatus, type Lead, type LeadInput, type LeadStatus, LEAD_STATUSES } from "./leads";

type LeadRow = {
  /** BIGINT pg отдаёт строкой, чтобы не терять точность. */
  id: string | number;
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
  status_changed_at: Date | string | null;
  status_changed_by: string | null;
  created_at: Date | string;
  updated_at: Date | string | null;
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

  const { rows } = await getPool().query<LeadRow>(
    `INSERT INTO leads
      (name, phone, interests, note, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
       click_id, click_id_type, referrer, landing_page, page_url, user_agent, ip)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING ${COLUMNS}`,
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

  const created = rows[0];
  if (!created) {
    throw new Error("PostgreSQL не вернул созданную заявку (INSERT ... RETURNING)");
  }

  return mapRow(created);
}

export async function getLeadById(id: number): Promise<Lead | null> {
  await ensureSchema();

  const { rows } = await getPool().query<LeadRow>(
    `SELECT ${COLUMNS} FROM leads WHERE id = $1 LIMIT 1`,
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
  /** Только заявки, созданные позже указанного момента. */
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
  const whereValues: unknown[] = [];

  if (params.status) {
    whereValues.push(params.status);
    conditions.push(`status = $${whereValues.length}`);
  }
  if (params.afterId !== undefined) {
    whereValues.push(params.afterId);
    conditions.push(`id > $${whereValues.length}`);
  }
  if (params.since) {
    whereValues.push(params.since);
    conditions.push(`created_at > $${whereValues.length}`);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const direction = params.order === "asc" ? "ASC" : "DESC";

  const pool = getPool();
  // Нумерация $n сквозная по всему запросу, поэтому LIMIT/OFFSET идут следующими.
  const limitPlaceholder = `$${whereValues.length + 1}`;
  const offsetPlaceholder = `$${whereValues.length + 2}`;

  const [listResult, totalResult, countResult] = await Promise.all([
    pool.query<LeadRow>(
      `SELECT ${COLUMNS} FROM leads ${where} ORDER BY id ${direction} LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}`,
      [...whereValues, params.limit, params.offset],
    ),
    // COUNT(*) — bigint; приводим к int, чтобы pg вернул число, а не строку.
    pool.query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM leads ${where}`, whereValues),
    // Разбивка по статусам считается по всем заявкам — удобно для сводки в боте.
    pool.query<{ status: string; total: number }>(
      "SELECT status, COUNT(*)::int AS total FROM leads GROUP BY status",
    ),
  ]);

  const counts = Object.fromEntries(LEAD_STATUSES.map((status) => [status, 0])) as Record<
    LeadStatus,
    number
  >;

  for (const row of countResult.rows) {
    if (isLeadStatus(row.status)) counts[row.status] = Number(row.total);
  }

  return {
    leads: listResult.rows.map(mapRow),
    total: Number(totalResult.rows[0]?.total ?? 0),
    counts,
  };
}

export async function updateLeadStatus(
  id: number,
  status: LeadStatus,
  changedBy?: string | null,
): Promise<Lead | null> {
  await ensureSchema();

  const { rows } = await getPool().query<LeadRow>(
    `UPDATE leads
        SET status = $1,
            status_changed_at = now(),
            status_changed_by = $2,
            updated_at = now()
      WHERE id = $3
      RETURNING ${COLUMNS}`,
    [status, changedBy ?? null, id],
  );

  return rows[0] ? mapRow(rows[0]) : null;
}
