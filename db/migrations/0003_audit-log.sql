-- 操作审计。多编辑者场景下，「谁在什么时候改了哪一条、动了哪些字段」必须可查。
--
-- 刻意不存字段的前后值：正文可能几万字，存进去会让这张表迅速超过目录本身。
-- 记「改了哪些字段」足以定位问题，需要内容对比时还有 item_revisions（P7）与备份。
CREATE TABLE IF NOT EXISTS audit_log (
  id             BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  at             DATETIME(3) NOT NULL,
  actor          VARCHAR(100) NOT NULL,
  action         ENUM('create','update','delete','status') NOT NULL,
  slug           VARCHAR(100) NOT NULL,
  summary        VARCHAR(500) NOT NULL,
  fields         JSON NOT NULL,
  version_before INT UNSIGNED NULL,
  version_after  INT UNSIGNED NULL,
  PRIMARY KEY (id),
  KEY idx_audit_slug (slug, at),
  KEY idx_audit_at (at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
