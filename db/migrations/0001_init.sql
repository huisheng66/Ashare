-- 0001_init.sql —— Ashare 目录库首个迁移
--
-- 设计要点（详见 docs/MySQL 迁移计划.md 第 3 节）：
--  * items 只放「单值」字段。可筛选的多值字段（标签 / 场景 / 平台 / 替代品）拆到 item_* 子表
--    并各自建索引：几何增长后列表与搜索必须由 SQL 分页筛选完成，不能再全量进内存。
--  * 已否决「单表 + data JSON」方案：55 条时够用，涨到几万条时无法索引，其他服务也难消费。
--  * search_text 冗余 name / name_zh / aliases / tags / summary，供 FULLTEXT + ngram 使用。
--    MySQL 的 FULLTEXT 不能跨表，因此它由写入路径维护，另配 db:reindex 重建（计划 P5）。
--  * clicks 故意不对 items 建外键：条目删除后必须保留其历史点击。
--  * item_alternatives 故意不对 items.slug 建外键：替代品可以尚未收录。
--  * 所有时间列存 UTC（DATETIME(3)），展示层再按 Asia/Shanghai 格式化。

CREATE TABLE IF NOT EXISTS items (
  id               BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug             VARCHAR(100)  NOT NULL,
  name             VARCHAR(100)  NOT NULL,
  name_zh          VARCHAR(100)  NULL,
  aliases          JSON          NOT NULL,
  status           ENUM('draft','published') NOT NULL DEFAULT 'draft',
  kind             ENUM('app','script','opensource') NOT NULL,
  source           ENUM('official','opensource','discount') NOT NULL,
  price            VARCHAR(100)  NULL,
  summary          VARCHAR(500)  NOT NULL,
  body             MEDIUMTEXT    NOT NULL,
  tutorial         JSON          NOT NULL,
  who_for          VARCHAR(2000) NOT NULL,
  who_not          VARCHAR(2000) NOT NULL,
  discount_note    VARCHAR(1000) NULL,
  license          VARCHAR(100)  NULL,
  version          VARCHAR(50)   NULL,
  links_checked_at DATE          NULL,
  featured         TINYINT(1)    NOT NULL DEFAULT 0,
  sort_index       INT           NOT NULL DEFAULT 0,
  icon_letter      VARCHAR(8)    NOT NULL,
  icon_color       CHAR(7)       NULL,
  icon_simple      VARCHAR(100)  NULL,
  icon_image       VARCHAR(512)  NULL,
  guide_intro      VARCHAR(1000) NULL,
  guide_markdown   MEDIUMTEXT    NULL,
  search_text      TEXT          NOT NULL,
  row_version      INT UNSIGNED  NOT NULL DEFAULT 1,
  created_at       DATETIME(3)   NOT NULL,
  updated_at       DATETIME(3)   NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_items_slug (slug),
  KEY idx_items_status_sort (status, sort_index, id),
  KEY idx_items_updated (updated_at),
  KEY idx_items_checked (links_checked_at),
  KEY idx_items_source (source),
  KEY idx_items_kind (kind),
  KEY idx_items_featured (featured),
  FULLTEXT KEY ft_items_search (search_text) WITH PARSER ngram
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_tags (
  item_id    BIGINT UNSIGNED NOT NULL,
  tag        VARCHAR(100) NOT NULL,
  sort_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, tag),
  KEY idx_item_tags_tag (tag),
  CONSTRAINT fk_item_tags_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_scenes (
  item_id    BIGINT UNSIGNED NOT NULL,
  scene_id   VARCHAR(32) NOT NULL,
  sort_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, scene_id),
  KEY idx_item_scenes_scene (scene_id, item_id),
  CONSTRAINT fk_item_scenes_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_platforms (
  item_id    BIGINT UNSIGNED NOT NULL,
  platform   VARCHAR(16) NOT NULL,
  sort_index INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, platform),
  KEY idx_item_platforms_platform (platform, item_id),
  CONSTRAINT fk_item_platforms_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_alternatives (
  item_id          BIGINT UNSIGNED NOT NULL,
  alternative_slug VARCHAR(100) NOT NULL,
  sort_index       INT NOT NULL DEFAULT 0,
  PRIMARY KEY (item_id, alternative_slug),
  KEY idx_item_alternatives_slug (alternative_slug),
  CONSTRAINT fk_item_alternatives_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_links (
  item_id     BIGINT UNSIGNED NOT NULL,
  kind        ENUM('official','homepage','github','disk') NOT NULL,
  url         VARCHAR(2048) NOT NULL,
  disk_note   VARCHAR(1000) NULL,
  disk_sha256 CHAR(64)      NULL,
  disk_file   VARCHAR(255)  NULL,
  PRIMARY KEY (item_id, kind),
  KEY idx_item_links_github (kind, item_id),
  CONSTRAINT fk_item_links_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_previews (
  item_id    BIGINT UNSIGNED NOT NULL,
  sort_index TINYINT UNSIGNED NOT NULL,
  path       VARCHAR(512) NOT NULL,
  PRIMARY KEY (item_id, sort_index),
  CONSTRAINT fk_item_previews_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS item_guide_resources (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  item_id    BIGINT UNSIGNED NOT NULL,
  sort_index TINYINT UNSIGNED NOT NULL,
  kind       ENUM('markdown','pdf','html','image','link') NOT NULL,
  title      VARCHAR(500)  NOT NULL,
  url        VARCHAR(2048) NOT NULL,
  note       VARCHAR(1000) NULL,
  PRIMARY KEY (id),
  KEY idx_item_guide_resources_item (item_id, sort_index),
  CONSTRAINT fk_item_guide_resources_item FOREIGN KEY (item_id) REFERENCES items (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS feedback (
  id         VARCHAR(32) NOT NULL,
  at         DATETIME(3) NOT NULL,
  type       ENUM('correction','issue','other') NOT NULL,
  slug       VARCHAR(100) NULL,
  contact    VARCHAR(200) NULL,
  content    VARCHAR(2000) NOT NULL,
  is_read    TINYINT(1) NOT NULL DEFAULT 0,
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (id),
  UNIQUE KEY uk_feedback_seq (seq),
  KEY idx_feedback_at (at, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS submissions (
  id         VARCHAR(32) NOT NULL,
  at         DATETIME(3) NOT NULL,
  kind       ENUM('app','script','opensource') NOT NULL,
  name       VARCHAR(100) NOT NULL,
  url        VARCHAR(2048) NOT NULL,
  need       VARCHAR(1000) NOT NULL,
  seq        BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (id),
  UNIQUE KEY uk_submissions_seq (seq),
  KEY idx_submissions_at (at, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS ip_blocks (
  ip            VARCHAR(45) NOT NULL,
  blocked_until DATETIME(3) NOT NULL,
  PRIMARY KEY (ip),
  KEY idx_ip_blocks_until (blocked_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

CREATE TABLE IF NOT EXISTS clicks (
  id      BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug    VARCHAR(100) NOT NULL,
  channel VARCHAR(32)  NOT NULL,
  at      DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  KEY idx_clicks_at (at),
  KEY idx_clicks_slug_channel (slug, channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
