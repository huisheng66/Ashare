-- 拼音检索列（派生列，由 lib/catalog-rows.ts 的 searchPinyinOf 生成）。
--
-- 为什么单独一列而不是并进 search_text：
--   search_text 走 ngram(2-gram) 全文索引。把拼音串拼进去，它会与中英文 token 混在
--   同一个 BM25 空间里，把 MATCH 相关度稀释掉——「ollama」这类精确名命中会被一堆
--   拼音 2-gram 拉平。独立成列后，拼音只作「命中即返回」的召回通道，主排序 CASE 一行不用改。
--
-- 为什么是 TEXT NULL：
--   MySQL 的 TEXT 列不能有 DEFAULT 值。若写成 NOT NULL，测试里的探针 INSERT 与后台
--   保存路径会因为缺值直接失败。可空是这里的正确形态（NULL 值不进全文索引）。
--
-- 索引解析器与 ft_items_search 保持一致（ngram）。ngram_token_size=2 是服务器变量，
-- 不在迁移里；若该变量被改小，两个索引都要重建。
--
-- 本迁移只加结构。**回填 search_pinyin 由 npm run db:reindex 负责**：
-- 那里的顺序是「设停用词表 → 回填 → 重建索引」，因为索引里的 token 取决于插入时
-- 该列的内容，必须先有值再建索引。

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND COLUMN_NAME = 'search_pinyin') = 0,
  'ALTER TABLE items ADD COLUMN search_pinyin TEXT NULL AFTER search_text',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'ft_items_pinyin') = 0,
  'ALTER TABLE items ADD FULLTEXT KEY ft_items_pinyin (search_pinyin) WITH PARSER ngram',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
