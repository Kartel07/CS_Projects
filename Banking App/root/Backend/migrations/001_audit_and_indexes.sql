-- ============================================================
-- APEX BANKING — Database Migration: Audit & Indexes
-- ============================================================
-- This file is idempotent — safe to run multiple times.
-- Adds the immutable audit_logs table, refresh token support,
-- and performance indexes if they don't already exist.
-- ============================================================

-- ── 1. Add refresh_token_hash column to users (if missing) ──
SET @dbname = DATABASE();
SET @col_exists = (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users'
  AND COLUMN_NAME = 'refresh_token_hash');
SET @col_sql = IF(@col_exists = 0,
  'ALTER TABLE users ADD COLUMN refresh_token_hash VARCHAR(255) DEFAULT NULL AFTER otp_expiry',
  'SELECT "refresh_token_hash already exists" AS status');
PREPARE stmt FROM @col_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- ── 2. Create immutable audit_logs table ──
CREATE TABLE IF NOT EXISTS audit_logs (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(50)   DEFAULT NULL,
  action      VARCHAR(50)   NOT NULL,
  details     TEXT          DEFAULT NULL,
  ip_address  VARCHAR(45)   DEFAULT NULL,
  user_agent  VARCHAR(512)  DEFAULT NULL,
  created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  INDEX idx_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── 3. Performance indexes for high-frequency lookups ──
-- Using information_schema to check index existence (MySQL-compatible approach)

-- Helper: create index if not exists
-- idx_users_username
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_username');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_users_username ON users(username)',
  'SELECT "idx_users_username already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_users_email
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_email');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_users_email ON users(email)',
  'SELECT "idx_users_email already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_users_phone
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_phone');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_users_phone ON users(phone)',
  'SELECT "idx_users_phone already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_users_role
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_role');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_users_role ON users(role)',
  'SELECT "idx_users_role already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_users_created
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_created');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_users_created ON users(created_at)',
  'SELECT "idx_users_created already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_accounts_user
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'accounts' AND INDEX_NAME = 'idx_accounts_user');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_accounts_user ON accounts(user_id)',
  'SELECT "idx_accounts_user already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_accounts_type
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'accounts' AND INDEX_NAME = 'idx_accounts_type');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_accounts_type ON accounts(account_type)',
  'SELECT "idx_accounts_type already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_accounts_balance
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'accounts' AND INDEX_NAME = 'idx_accounts_balance');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_accounts_balance ON accounts(balance)',
  'SELECT "idx_accounts_balance already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_txns_account
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_txns_account');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_txns_account ON transactions(account_id)',
  'SELECT "idx_txns_account already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_txns_user_date
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_txns_user_date');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_txns_user_date ON transactions(user_id, created_at)',
  'SELECT "idx_txns_user_date already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- idx_txns_covering
SET @idx_exists = (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = 'transactions' AND INDEX_NAME = 'idx_txns_covering');
SET @idx_sql = IF(@idx_exists = 0,
  'CREATE INDEX idx_txns_covering ON transactions(user_id, created_at, txn_type, amount)',
  'SELECT "idx_txns_covering already exists" AS status');
PREPARE stmt FROM @idx_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;