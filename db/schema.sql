-- кварта · схема базы заявок
-- Держите в синхроне с CREATE_TABLE_SQL в src/lib/db.ts

CREATE DATABASE IF NOT EXISTS kvarta
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kvarta;

CREATE TABLE IF NOT EXISTS leads (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  phone VARCHAR(24) NOT NULL,
  interests VARCHAR(255) NOT NULL DEFAULT '',
  note TEXT NULL,
  -- разметка источника заявки
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
  -- рабочий статус: new | in_progress | done | rejected | spam
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
