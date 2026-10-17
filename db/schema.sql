-- кварта · схема базы заявок (PostgreSQL)
-- Держите в синхроне с CREATE_SCHEMA_SQL в src/lib/db.ts
--
-- Накатывается командой `npm run db:init` (см. scripts/init-db.mjs)
-- или автоматически при первой заявке, если DB_AUTO_MIGRATE не равно false.
--
-- Отдельная база заранее не создаётся: в Neon она уже есть, а локально её
-- создаёт docker-compose (POSTGRES_DB=kvarta).

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  interests VARCHAR(255) NOT NULL DEFAULT '',
  note TEXT,
  -- разметка источника заявки
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
  -- рабочий статус: new | in_progress | done | rejected | spam
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
