-- 内容级历史。audit_log 只记「改了哪些字段」与版本号，正文改成什么它答不了。
--
-- 形态：**首版存完整快照，之后只存字段级差异**，还原第 N 版 = 基线 + 重放前 N 次差异。
-- 为什么不每次都存全量：实测单条完整内容平均 8.2 KB（正文平均仅 1.2 KB，
-- 含子表才是大头），全量每次改都存会让表按「编辑次数 × 8 KB」增长；
-- 差异通常只有几百字节。首版必须完整，否则后面没有重放的起点。
--
-- 为什么不存 JSON Patch（RFC 6902）：那套要算 JSON Pointer 路径，
-- 而这里的字段是扁平的 ItemBundle，直接按列名记更短也更可读。
--
-- payload 的形状：
--   kind='snapshot' → payload 是完整 ItemBundle（含全部子表），仅首版与基线丢失时写
--   kind='delta'    → payload 是 { 列名: 新值 } 加 _children 里被子表整体替换的部分
--
-- 刻意不记 search_text（派生自 body/tutorial 等）、updated_at（写入时自动更新）、
-- row_version（并发计数）—— 把它们记进差异会产生「改了但看不出改了什么」的噪音记录。
CREATE TABLE IF NOT EXISTS item_revisions (
  id           BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug         VARCHAR(100) NOT NULL,
  row_version  INT UNSIGNED NOT NULL,
  kind         ENUM('snapshot','delta') NOT NULL,
  actor        VARCHAR(64)  NOT NULL,
  action       ENUM('create','update','delete','status') NOT NULL,
  summary      VARCHAR(300) NOT NULL DEFAULT '',
  fields       JSON         NOT NULL,
  payload      MEDIUMTEXT   NOT NULL,
  created_at   DATETIME(3)  NOT NULL,
  PRIMARY KEY (id),
  -- 还原某一版的主路径：按 slug 取全部版本、按 row_version 排序后重放。
  UNIQUE KEY uk_revisions_slug_version (slug, row_version),
  KEY idx_revisions_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- 条目删除后历史要留着：没有外键，靠 slug 关联。
-- 理由与 clicks 表一致 —— 删条目不等于「它从没存在过」，「这个 slug 什么时候下架的、
-- 下架前长什么样」是要能回答的问题。