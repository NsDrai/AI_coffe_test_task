/**
 * Накатывает db/schema.sql на MySQL.
 *
 *   npm run db:init
 *
 * Параметры подключения берутся из .env.local (те же переменные, что и у приложения).
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import mysql from "mysql2/promise";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const schemaFile = path.join(projectRoot, "db", "schema.sql");

function connectionOptions() {
  const url = process.env.DATABASE_URL?.trim() || process.env.MYSQL_URL?.trim();

  if (url) {
    const parsed = new URL(url);
    const database = decodeURIComponent(parsed.pathname.replace(/^\/+/, ""));
    return {
      host: parsed.hostname,
      port: parsed.port ? Number(parsed.port) : 3306,
      user: decodeURIComponent(parsed.username),
      password: decodeURIComponent(parsed.password),
      database: database || undefined,
      multipleStatements: true,
    };
  }

  return {
    host: process.env.MYSQL_HOST?.trim() || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER?.trim() || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE?.trim() || "kvarta",
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
    multipleStatements: true,
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
  const options = connectionOptions();
  const sql = await readFile(schemaFile, "utf8");
  const statements = splitStatements(sql);

  console.log(`Подключаюсь к MySQL: ${options.user}@${options.host}:${options.port}`);

  const connection = await mysql.createConnection(options);

  try {
    for (const statement of statements) {
      const preview = statement.replace(/\s+/g, " ").slice(0, 70);
      await connection.query(statement);
      console.log(`✓ ${preview}…`);
    }

    const [rows] = await connection.query("SHOW TABLES LIKE 'leads'");
    if (rows.length === 0) {
      throw new Error("Таблица leads не появилась — проверьте db/schema.sql");
    }

    console.log("\nГотово: база готова принимать заявки.");
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("\nНе удалось накатить схему:", error.message);
  console.error("Проверьте, что MySQL запущен и значения в .env.local верные.");
  process.exitCode = 1;
});
