-- ngram 停用词表（空表）。
--
-- 为什么必须换掉默认表：InnoDB 默认停用词表里有**单字母** 'a' 与 'i'，
-- 而 ngram 解析器会丢弃**包含**停用词的 token。实测（受控实验，见计划文档第七章）：
--   'gimp' -> 只留下 mp        （gi 含 i、im 含 i，都被丢弃）
--   'git'  -> 一个 token 都不剩 （gi 含 i，it 本身是停用词）
--   'code' -> 留下 co、od       （de 本身是停用词）
-- 后果：搜「Git」「Figma」「KiCad」这类含 a/i 的名称直接 0 条。
-- 中英混排的目录只能用空停用词表。
--
-- 光建表不够：还要把 innodb_ft_server_stopword_table 指向它（需要管理员权限，
-- 写进 my.cnf 并重启），再跑 npm run db:reindex 重建索引 —— 索引里的 token 是插入时
-- 按当时的停用词表生成的，改了配置必须重建。db:reindex 会在配置不对时拒绝执行。
CREATE TABLE IF NOT EXISTS ft_stopwords (
  value VARCHAR(30) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
