import { Pool, type PoolConfig } from "pg";

/**
 * Таблица заявок. Держите это описание синхронным с `db/schema.sql`:
 * там та же схема + комментарии для ручного деплоя.
 */
const CREATE_SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  interests VARCHAR(255) NOT NULL DEFAULT '',
  note TEXT,
  utm_source VARCHAR(190),
  utm_medium VARCHAR(190),
  utm_campaign VARCHAR(190),
  utm_content VARCHAR(190),
  utm_term VARCHAR(190),
  click_id VARCHAR(190),
  click_id_type VARCHAR(32),
  referrer VARCHAR(700),
  landing_page VARCHAR(700),
  page_url VARCHAR(700),
  user_agent VARCHAR(500),
  ip VARCHAR(64),
  status VARCHAR(24) NOT NULL DEFAULT 'new',
  status_changed_at TIMESTAMPTZ,
  status_changed_by VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_status_created ON leads (status, created_at);
CREATE INDEX IF NOT EXISTS idx_created ON leads (created_at);
CREATE INDEX IF NOT EXISTS idx_utm_source ON leads (utm_source);
CREATE INDEX IF NOT EXISTS idx_phone ON leads (phone);
`;

let pool: Pool | undefined;
let schemaPromise: Promise<void> | undefined;

/**
 * Локальной базе TLS не нужен, а облачные (Neon, Supabase, RDS) без него
 * обычно не пускают. Явно управляется переменной POSTGRES_SSL.
 */
const LOCAL_HOSTS = new Set(["", "localhost", "127.0.0.1", "::1", "0.0.0.0"]);

function wantsSsl(host: string): boolean {
  const flag = process.env.POSTGRES_SSL?.trim().toLowerCase();
  if (flag) return !["false", "disable", "off", "0"].includes(flag);

  return !LOCAL_HOSTS.has(host.toLowerCase());
}

function readPoolConfig(): PoolConfig {
  const url = process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();

  const host = url
    ? new URL(url).hostname
    : process.env.PGHOST?.trim() || "127.0.0.1";

  const config: PoolConfig = {
    max: Number(process.env.POSTGRES_POOL_SIZE || 3),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    // Важно для serverless: не держать процесс живым из-за открытых соединений.
    allowExitOnIdle: true,
    application_name: "kvarta-landing",
  };

  if (url) {
    // Параметры вроде sslmode=require из строки подключения разбирает сам pg.
    config.connectionString = url;
  } else {
    config.host = host;
    config.port = Number(process.env.PGPORT || 5432);
    config.user = process.env.PGUSER?.trim() || "postgres";
    config.password = process.env.PGPASSWORD ?? "";
    config.database = process.env.PGDATABASE?.trim() || "kvarta";
  }

  const sslModeInUrl = Boolean(url && /[?&]sslmode=/.test(url));
  if (!sslModeInUrl && wantsSsl(host)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return config;
}

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(readPoolConfig());
  }

  return pool;
}

/**
 * Создаёт таблицу и индексы при первом обращении. Идемпотентно и удобно
 * для разработки; в продакшене схему можно накатить заранее из db/schema.sql.
 * Отключается переменной DB_AUTO_MIGRATE=false.
 */
export function ensureSchema(): Promise<void> {
  if (!schemaPromise) {
    schemaPromise = (async () => {
      if (process.env.DB_AUTO_MIGRATE === "false") return;
      await getPool().query(CREATE_SCHEMA_SQL);
    })().catch((error: unknown) => {
      schemaPromise = undefined;
      throw error;
    });
  }

  return schemaPromise;
}
