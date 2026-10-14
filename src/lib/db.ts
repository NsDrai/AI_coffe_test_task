import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

/**
 * Таблица заявок. Держите это описание синхронным с `db/schema.sql`:
 * там та же схема + создание базы для ручного деплоя.
 */
const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  interests VARCHAR(255) NOT NULL DEFAULT '',
  note TEXT NULL,
  utm_source VARCHAR(190) NULL,
  utm_medium VARCHAR(190) NULL,
  utm_campaign VARCHAR(190) NULL,
  utm_content VARCHAR(190) NULL,
  utm_term VARCHAR(190) NULL,
  click_id VARCHAR(190) NULL,
  click_id_type VARCHAR(32) NULL,
  referrer VARCHAR(700) NULL,
  landing_page VARCHAR(700) NULL,
  page_url VARCHAR(700) NULL,
  user_agent VARCHAR(500) NULL,
  ip VARCHAR(64) NULL,
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  status_changed_at DATETIME NULL,
  status_changed_by VARCHAR(64) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_status_created (status, created_at),
  KEY idx_created (created_at),
  KEY idx_utm_source (utm_source(64)),
  KEY idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
`;

let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;

function poolOptionsFromUrl(rawUrl: string): PoolOptions {
  const url = new URL(rawUrl);
  const database = decodeURIComponent(url.pathname.replace(/^\/+/, ""));

  if (!database) {
    throw new Error("В DATABASE_URL не указано имя базы данных");
  }

  return {
    host: url.hostname,
    port: url.port ? Number(url.port) : 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database,
  };
}

function readPoolOptions(): PoolOptions {
  const base: PoolOptions = {
    waitForConnections: true,
    connectionLimit: Number(process.env.MYSQL_POOL_SIZE || 5),
    maxIdle: Number(process.env.MYSQL_POOL_SIZE || 5),
    idleTimeout: 60_000,
    queueLimit: 0,
    charset: "utf8mb4_unicode_ci",
    // Время в базе — UTC, в ответах API — ISO-строки.
    timezone: "Z",
    enableKeepAlive: true,
  };

  const url = process.env.DATABASE_URL?.trim() || process.env.MYSQL_URL?.trim();
  if (url) {
    return { ...base, ...poolOptionsFromUrl(url) };
  }

  return {
    ...base,
    host: process.env.MYSQL_HOST?.trim() || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || 3306),
    user: process.env.MYSQL_USER?.trim() || "root",
    password: process.env.MYSQL_PASSWORD ?? "",
    database: process.env.MYSQL_DATABASE?.trim() || "kvarta",
    ssl: process.env.MYSQL_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  };
}

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool(readPoolOptions());
    pool.on("connection", (connection) => {
      // Не зависим от таймзоны сервера MySQL.
      (connection as unknown as { query: (sql: string) => void }).query(
        "SET time_zone = '+00:00'",
      );
    });
  }

  return pool;
}

/**
 * Создаёт таблицу при первом обращении. Идемпотентно и удобно для разработки;
 * в продакшене схему можно накатить заранее из db/schema.sql.
 * Отключается переменной DB_AUTO_MIGRATE=false.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      if (process.env.DB_AUTO_MIGRATE === "false") return;
      await getPool().query(CREATE_TABLE_SQL);
    })().catch((error: unknown) => {
      schemaPromise = undefined;
      throw error;
    });
  }

  return schemaPromise;
}
