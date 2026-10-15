-- ============================================================
-- APEX BANKING — Migration 002: Widen otp_code for SHA-256 hash
-- ============================================================
-- The otp_code column was VARCHAR(6) for plaintext OTPs.
-- Now stores "sha256:<hex>" (71 chars).
-- ============================================================

USE apex_banking;

ALTER TABLE users
  MODIFY COLUMN otp_code VARCHAR(80) DEFAULT NULL;
