-- 列表页三种排序各自的索引。
--
-- 实测（npm run scale:check，5,000 条合成数据）：加索引之前，默认排序是
--   type=ALL  key=(无)  rows=5001
-- 也就是全表扫描 + filesort。原因很具体：0001 里的 idx_items_status_sort 只覆盖
-- WHERE(status)，**没有覆盖完整的 ORDER BY**（featured DESC, sort_index ASC, id ASC），
-- 所以优化器既没法用它排序，也就干脆扫表。
--
-- 索引必须与 ORDER BY 的列序、方向都一致；featured 是 DESC 而后面是 ASC，
-- 因此用 MySQL 8 的降序索引。LIMIT 60 之后，索引扫描命中前 60 行就能停。
--
-- 用信息模式做存在性判断，保持「迁移必须可重复执行」的约定。
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'idx_items_status_featured') = 0,
  'CREATE INDEX idx_items_status_featured ON items (status, featured DESC, sort_index ASC, id ASC)',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'idx_items_status_updated') = 0,
  'CREATE INDEX idx_items_status_updated ON items (status, updated_at DESC, id ASC)',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'idx_items_status_name') = 0,
  'CREATE INDEX idx_items_status_name ON items (status, name ASC, id ASC)',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;

-- idx_items_status_sort 被 idx_items_status_featured 完全覆盖（前缀相同且后者还能排序），
-- 留着只是给每次写入多付一份索引维护成本。
SET @stmt := IF(
  (SELECT COUNT(*) FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'items' AND INDEX_NAME = 'idx_items_status_sort') > 0,
  'DROP INDEX idx_items_status_sort ON items',
  'DO 0'
);
PREPARE s FROM @stmt; EXECUTE s; DEALLOCATE PREPARE s;
