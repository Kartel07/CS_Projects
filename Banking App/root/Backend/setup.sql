CREATE DATABASE IF NOT EXISTS apex_banking;
USE apex_banking;

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS accounts;
DROP TABLE IF EXISTS users;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE users (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       VARCHAR(50)  NOT NULL UNIQUE,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  role          ENUM('customer', 'employee') DEFAULT 'customer',
  first_name    VARCHAR(50)  NOT NULL,
  last_name     VARCHAR(50)  NOT NULL,
  email         VARCHAR(100) NOT NULL UNIQUE,
  phone         VARCHAR(15)  NOT NULL,
  kyc_type      ENUM('PAN', 'AADHAAR') NOT NULL,
  kyc_number    VARCHAR(20)  NOT NULL UNIQUE,
  dob           DATE         NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  otp_code      VARCHAR(6)   DEFAULT NULL,
  otp_expiry    TIMESTAMP    NULL DEFAULT NULL,
  created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE accounts (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  account_number VARCHAR(20)  NOT NULL UNIQUE,
  user_id        VARCHAR(50)  NOT NULL,
  account_type   ENUM('savings', 'current', 'fixed') NOT NULL,
  balance        DECIMAL(15,4) DEFAULT 0.0000,
  interest_rate  DECIMAL(5,2)  NOT NULL,
  min_balance    DECIMAL(15,2) NOT NULL,
  tenure_months  INT          DEFAULT NULL,
  payout_option  VARCHAR(30)  DEFAULT NULL,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE transactions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  account_id  INT NOT NULL,
  user_id     VARCHAR(50)  NOT NULL,
  description VARCHAR(255) NOT NULL,
  txn_type    ENUM('credit','debit') NOT NULL,
  amount      DECIMAL(15,2) NOT NULL,
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO users (user_id, username, role, first_name, last_name, email, phone, kyc_type, kyc_number, dob, password_hash)
VALUES (
  'APX-EMPMASTER77',
  'admin_emp',
  'employee',
  'Corporate',
  'Auditor',
  'employee@apexbank.com',
  '9876543210',
  'PAN',
  'ABCDE1234F',
  '1990-01-01',
  '$2b$10$rK3mY2eY9K8KzZ7v7l4DxeK/HjZzHmWxGZ1C5G7gU9w3Gg7V7r7S.'
) ON DUPLICATE KEY UPDATE user_id=user_id;
ALTER TABLE transactions ADD INDEX idx_txn_date (user_id, created_at);