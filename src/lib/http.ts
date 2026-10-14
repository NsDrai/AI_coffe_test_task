export function json(data: unknown, status = 200): Response {
  return Response.json(data, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export function jsonError(message: string, status: number, extra?: Record<string, unknown>): Response {
  return json({ ok: false, error: message, ...extra }, status);
}

export function firstForwardedIp(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first ? first.slice(0, 64) : null;
}
