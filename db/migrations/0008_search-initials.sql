-- 首字母检索列（派生列，由 lib/catalog-rows.ts 的 searchInitialsOf 生成）。
--
-- 为什么从 search_pinyin 里再拆出一列：
--   search_pinyin 同时装着「首字母(tp)」「全拼(tupian)」「英文名去元音(khttp)」三类内容，
--   在 ngram 下**无法区分 tp 是首字母还是 khttp 里的一段**。实测搜 tp 返回 51 条、
--   第一名是 okhttp —— 用户想找「图片」，拿到的是 HTTP 客户端。
--
--   曾试过在 search_pinyin 里用 `#tp#` 包裹首字母做区分，实测无效：
--   `#` 被 ngram 当作分隔符吃掉，`+#tp#` 仍然命中含 khttp 的行。
--   唯一可靠的办法是独立成列 —— 实测独立列下 `+tp` 只命中首字母含 tp 的条目。
--
-- 与 search_pinyin 的分工：
--   search_pinyin   → 全拼 + 去元音折叠（tupian / tu pian / rstdsk），负责「漏打元音」
--   search_initials → 只放首字母连写（tp / yxgl），负责「只打首字母」
--   两者都只影响**能否召回**；排序里首字母命中排在全文相关度之前、全拼相关度之前，
--   因为「用户打了准确的首字母缩写」比「模糊的全拼匹配」信号更强。
--
-- 为什么是 TEXT NULL：同 0007 —— TEXT 不能有 DEFAULT，NOT NULL 会让探针 INSERT 失败。
--
-- 本迁移只加结构。回填由 npm run db:reindex 负责（顺序：回填 → OPTIMIZE 重建索引）。

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND COLUMN_NAME = 'search_initials') = 0,
  'ALTER TABLE items ADD COLUMN search_initials TEXT NULL AFTER search_pinyin',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'ft_items_initials') = 0,
  'ALTER TABLE items ADD FULLTEXT KEY ft_items_initials (search_initials) WITH PARSER ngram',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
