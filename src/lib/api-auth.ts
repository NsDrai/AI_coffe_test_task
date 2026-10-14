import { timingSafeEqual } from "node:crypto";
import { jsonError } from "./http";

function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

function readToken(request: Request): string {
  const header = request.headers.get("authorization") ?? "";
  if (header.toLowerCase().startsWith("bearer ")) {
    return header.slice(7).trim();
  }
  return (request.headers.get("x-api-token") ?? "").trim();
}

/**
 * Доступ к заявкам для бота и менеджера: только с токеном из ADMIN_API_TOKEN.
 * Возвращает готовый ответ с ошибкой, если доступ закрыт.
 */
export function authorizeApiRequest(request: Request): { ok: true } | { ok: false; response: Response } {
  const expected = process.env.ADMIN_API_TOKEN?.trim();

  if (!expected) {
    return {
      ok: false,
      response: jsonError(
        "API закрыт: не задан ADMIN_API_TOKEN. Добавьте токен в .env.local и перезапустите сервер.",
        503,
      ),
    };
  }

  const provided = readToken(request);

  if (!provided || !safeEqual(provided, expected)) {
    return { ok: false, response: jsonError("Неверный или отсутствующий токен", 401) };
  }

  return { ok: true };
}
