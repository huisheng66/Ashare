-- 后台账号。单口令（ADMIN_PASSWORD_HASH）只能一个人用，多编辑者必须落到表里。
--
-- 口令仍然只存 scrypt 哈希，格式与 scripts/hash-password.mjs 一致（salt:hash，各 hex）。
-- role 只有两档：admin 全权，editor 只能写草稿与提交审核 —— 见 lib/users.ts 的权限矩阵。
CREATE TABLE IF NOT EXISTS users (
  username      VARCHAR(64)  NOT NULL,
  display_name  VARCHAR(100) NOT NULL,
  password_hash VARCHAR(200) NOT NULL,
  role          ENUM('admin','editor') NOT NULL DEFAULT 'editor',
  disabled      TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    DATETIME(3)  NOT NULL,
  last_login_at DATETIME(3)  NULL,
  PRIMARY KEY (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
