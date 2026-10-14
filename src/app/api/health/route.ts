import { json } from "@/lib/http";
import { getPool } from "@/lib/db";

/** Проверка, что сайт поднялся и база отвечает. Удобно для мониторинга и бота. */
export async function GET() {
  const startedAt = Date.now();

  try {
    await getPool().query("SELECT 1");
    return json({
      ok: true,
      database: "up",
      latencyMs: Date.now() - startedAt,
      time: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[api/health] база недоступна", error);
    return json(
      {
        ok: false,
        database: "down",
        error: error instanceof Error ? error.message : "unknown error",
        time: new Date().toISOString(),
      },
      503,
    );
  }
}
