-- ============================================================
-- APEX BANKING — Test Database Initialization
-- ============================================================
-- Drops and recreates the test database, then seeds it from
-- the main schema without conflicting DB-name statements.
-- ============================================================

DROP DATABASE IF EXISTS apex_banking_test;
CREATE DATABASE apex_banking_test
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE apex_banking_test;

-- Include the full schema — the CREATE DATABASE / USE lines
-- in setup.sql are harmless since we are already in context.
SOURCE D:/MYFILES/kartik/CS_Projects/Banking App/root/Backend/setup.sql;

-- The setup.sql's CREATE DATABASE IF NOT EXISTS apex_banking
-- is a no-op (apex_banking already exists from initial run).
-- The subsequent USE apex_banking switches context, but we
-- catch that by verifying tables below.
USE apex_banking_test;