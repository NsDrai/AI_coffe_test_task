/**
 * Накатывает db/schema.sql на PostgreSQL.
 *
 *   npm run db:init
 *
 * Параметры подключения берутся из .env.local (те же переменные, что и у приложения).
 * Тот же скрипт можно запустить против продовой базы, подставив DATABASE_URL:
 *
 *   $env:DATABASE_URL="postgresql://..."; npm run db:init
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import pg from "pg";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaFile = path.join(projectRoot, "db", "schema.sql");

const LOCAL_HOSTS = new Set(["", "localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function wantsSsl(host) {
  const flag = process.env.POSTGRES_SSL?.trim().toLowerCase();
  if (flag) return !["false", "disable", "off", "0"].includes(flag);

  return !LOCAL_HOSTS.has(host.toLowerCase());
}

function clientOptions() {
  const url = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

  if (url) {
    const options = { connectionString: url };
    // Если sslmode задан в строке — не мешаем pg разбирать её самому.
    if (!/[?&]sslmode=/.test(url) && wantsSsl(new URL(url).hostname)) {
      options.ssl = { rejectUnauthorized: false };
    }
    return options;
  }

  const host = process.env.PGHOST?.trim() || "127.0.0.1";

  return {
    host,
    port: Number(process.env.PGPORT || 5432),
    user: process.env.PGUSER?.trim() || "postgres",
    password: process.env.PGPASSWORD ?? "",
    database: process.env.PGDATABASE?.trim() || "kvarta",
    ssl: wantsSsl(host) ? { rejectUnauthorized: false } : undefined,
  };
}

function splitStatements(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .split(";")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function main() {
  const options = clientOptions();
  const sql = await readFile(schemaFile, "utf8");
  const statements = splitStatements(sql);

  const label = options.connectionString
    ? new URL(options.connectionString).host
    : `${options.user}@${options.host}:${options.port}`;
  console.log(`Подключаюсь к PostgreSQL: ${label}`);

  const client = new pg.Client(options);
  await client.connect();

  try {
    for (const statement of statements) {
      const preview = statement.replace(/\s+/g, " ").slice(0, 70);
      await client.query(statement);
      console.log(`✓ ${preview}…`);
    }

    const { rows } = await client.query("SELECT to_regclass('public.leads') AS table_name");
    if (!rows[0]?.table_name) {
      throw new Error("Таблица leads не появилась — проверьте db/schema.sql");
    }

    console.log("\nГотово: база готова принимать заявки.");
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error("\nНе удалось накатить схему:", error.message);
  console.error("Проверьте, что PostgreSQL запущен и значения в .env.local верные.");
  process.exitCode = 1;
});
