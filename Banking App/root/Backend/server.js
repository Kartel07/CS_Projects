'use strict';

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const db = require('./db');
const app = express();
const PORT = 5000;
const SALT_ROUNDS = 10;

// Enable CORS so your frontend files on port 5500 can talk to port 5000 safely
app.use(cors({ origin: '*' }));
app.use(express.json());

const BALANCING_MATRIX = {
  savings: { baseRate: 4.00, minBalance: 1000.00 },
  current: { baseRate: 0.00, minBalance: 5000.00 }
};

function generateSecureAccountNumber() {
  return 'APX' + Math.floor(10000000 + Math.random() * 90000000);
}

// ── REGISTRATION ENDPOINT ──
app.post('/api/register', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { personal, account } = req.body;
    await connection.beginTransaction();

    const permanentUserId = `APX-${uuidv4().split('-')[0].toUpperCase()}`;
    const passwordHash = await bcrypt.hash(account.password, SALT_ROUNDS);
    const accNum = generateSecureAccountNumber();

    await connection.execute(
      `INSERT INTO users (user_id, username, first_name, last_name, email, phone, kyc_type, kyc_number, dob, password_hash) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [permanentUserId, account.username.trim(), personal.first_name, personal.last_name, personal.email, personal.phone, personal.kyc_type, personal.kyc_number, personal.dob, passwordHash]
    );

    const rule = BALANCING_MATRIX[account.account_type.toLowerCase()] || BALANCING_MATRIX.savings;
    await connection.execute(
      `INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance) VALUES (?, ?, ?, ?, ?, ?)`,
      [accNum, permanentUserId, account.account_type.toLowerCase(), rule.minBalance, rule.baseRate, rule.minBalance]
    );

    await connection.commit();
    return res.status(201).json({ message: 'Registration completed successfully.' });
  } catch (err) {
    await connection.rollback();
    return res.status(500).json({ message: err.message });
  } finally {
    connection.release();
  }
});

// ── MFA LOGIN INITIALIZATION ENDPOINT ──
app.post('/api/login/initiate', async (req, res) => {
  try {
    const { login_handle, password } = req.body;
    const [rows] = await db.execute('SELECT user_id, username, phone, password_hash FROM users WHERE username = ? OR user_id = ? OR phone = ?', [login_handle, login_handle, login_handle]);
    
    if (rows.length === 0) return res.status(401).json({ message: 'Invalid profile credentials.' });
    const user = rows[0];

    if (!await bcrypt.compare(password, user.password_hash)) return res.status(401).json({ message: 'Invalid profile credentials.' });

    const codeOTP = String(Math.floor(100000 + Math.random() * 900000));
    const expiry = new Date(Date.now() + 5 * 60 * 1000);
    await db.execute('UPDATE users SET otp_code = ?, otp_expiry = ? WHERE user_id = ?', [codeOTP, expiry, user.user_id]);

    console.log(`\n📱 [SMS GATEWAY TELECOM SIMULATOR DISPATCH]`);
    console.log(`   TO SMARTPHONE NUMBER : +91 ${user.phone}`);
    console.log(`   MESSAGE BODY         : Your Apex Bank secure access OTP is [ ${codeOTP} ]. Valid for 5 mins.`);
    console.log(`   STATUS               : DELIVERED SUCCESS\n`);

    return res.status(200).json({ message: 'OTP Sent via SMS.', target_handle: user.username });
  } catch (err) { 
    return res.status(500).json({ message: 'SMS infrastructure routing initialization parameters fault.' }); 
  }
});

// ── MFA LOGIN VERIFICATION ENDPOINT ──
app.post('/api/login/verify', async (req, res) => {
  try {
    const { login_handle, otp_code } = req.body;
    const [rows] = await db.execute('SELECT user_id, username, first_name, email, role, otp_code, otp_expiry FROM users WHERE username = ?', [login_handle]);
    const user = rows[0];

    if (!user || user.otp_code !== String(otp_code).trim() || new Date() > new Date(user.otp_expiry)) {
      return res.status(401).json({ message: 'Invalid or Expired clearance challenge token access.' });
    }

    await db.execute('UPDATE users SET otp_code = NULL, otp_expiry = NULL WHERE user_id = ?', [user.user_id]);
    return res.status(200).json({ user: { user_id: user.user_id, username: user.username, role: user.role, first_name: user.first_name, email: user.email } });
  } catch (err) { 
    return res.status(500).json({ message: 'Internal parsing validation block loops error context.' }); 
  }
});

// ── DASHBOARD COMPILATION ENDPOINT ──
app.get('/api/dashboard/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const targetMonthParam = req.query.month;

    const [accounts] = await db.execute(
      'SELECT id, account_number, account_type, balance, interest_rate, min_balance, tenure_months, payout_option FROM accounts WHERE user_id = ?', 
      [userId]
    );
    const [userRow] = await db.execute('SELECT dob FROM users WHERE user_id = ?', [userId]);

    const [monthArchiveList] = await db.execute(
      `SELECT DISTINCT DATE_FORMAT(created_at, '%Y-%m') AS active_month FROM transactions WHERE user_id = ? ORDER BY active_month DESC`,
      [userId]
    );

    let trackingTargetMonth = targetMonthParam;
    if (!trackingTargetMonth) {
      const now = new Date();
      trackingTargetMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    }

    const startingBoundaryDate = `${trackingTargetMonth}-01 00:00:00`;
    const endingBoundaryDate = `${trackingTargetMonth}-31 23:59:59`;

    const [transactions] = await db.execute(
      `SELECT account_id, description, txn_type, amount, created_at FROM transactions WHERE user_id = ? AND created_at BETWEEN ? AND ? ORDER BY created_at DESC`,
      [userId, startingBoundaryDate, endingBoundaryDate]
    );

    return res.status(200).json({
      accounts,
      transactions,
      dob: userRow[0]?.dob,
      availableMonths: monthArchiveList.map(m => m.active_month),
      selectedMonth: trackingTargetMonth
    });
  } catch (err) {
    return res.status(500).json({ message: 'Ledger retrieval error context timeline pipeline.' });
  }
});

// ── MANUAL TRANSACTION DESK ENDPOINT ──
app.post('/api/transaction/execute', async (req, res) => {
  const connection = await db.getConnection();
  try {
    const { account_id, user_id, action_type, amount, description } = req.body;
    const parsedAmount = parseFloat(amount);

    await connection.beginTransaction();
    const [accRows] = await connection.execute('SELECT balance, min_balance FROM accounts WHERE id = ? AND user_id = ? FOR UPDATE', [account_id, user_id]);
    if (accRows.length === 0) { 
      await connection.rollback(); 
      return res.status(404).json({ message: 'Target clearing index account not found.' }); 
    }

    const targetAccount = accRows[0];
    let balanceState = parseFloat(targetAccount.balance);
    const statutoryMinimum = parseFloat(targetAccount.min_balance);

    if (action_type === 'deposit') {
      balanceState += parsedAmount;
    } else {
      if (balanceState - parsedAmount < statutoryMinimum) {
        await connection.rollback();
        return res.status(400).json({ message: `Transaction Denied: Minimum balance threshold of ₹${statutoryMinimum.toLocaleString('en-IN')} required.` });
      }
      balanceState -= parsedAmount;
    }

    await connection.execute('UPDATE accounts SET balance = ? WHERE id = ?', [balanceState, account_id]);
    await connection.execute(
      'INSERT INTO transactions (account_id, user_id, description, txn_type, amount) VALUES (?, ?, ?, ?, ?)',
      [account_id, user_id, description || `${action_type.toUpperCase()} request processed`, action_type === 'deposit' ? 'credit' : 'debit', parsedAmount]
    );

    await connection.commit();
    return res.status(200).json({ message: 'Ledger settlement balancing sync complete.', revisedBalance: balanceState });
  } catch (err) { 
    await connection.rollback(); 
    return res.status(500).json({ message: 'Fatal exception inside core ledger pipelines.' }); 
  } finally { 
    connection.release(); 
  }
});

// ── MODIFY USERNAME HANDLING ENDPOINT ──
app.patch('/api/users/update-username', async (req, res) => {
  try {
    const { user_id, new_username } = req.body;
    const cleanUsername = new_username?.trim();
    const [taken] = await db.execute('SELECT id FROM users WHERE username = ?', [cleanUsername]);
    if (taken.length > 0) return res.status(409).json({ message: 'Username choice is already taken.' });

    await db.execute('UPDATE users SET username = ? WHERE user_id = ?', [cleanUsername, user_id]);
    return res.status(200).json({ message: 'Username handle updated inside directory.', updatedUsername: cleanUsername });
  } catch (err) { 
    return res.status(500).json({ message: 'Internal server error editing handle identity.' }); 
  }
});

// ── DEPLOY FIXED DEPOSIT ASSET ENDPOINT ──
app.post('/api/fixed-deposit/create', async (req, res) => {
  try {
    const { user_id, amount, tenure_months, interest_rate, payout_option } = req.body;
    const fundingCapital = parseFloat(amount);
    if(!user_id || isNaN(fundingCapital) || fundingCapital < 10000) { 
      return res.status(400).json({ message: "Invalid parameters input fields." }); 
    }
    
    const accNum = generateSecureAccountNumber();
    const [result] = await db.execute(
      'INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance, tenure_months, payout_option) VALUES (?, ?, "fixed", ?, ?, ?, ?, ?)',
      [accNum, user_id, fundingCapital, interest_rate, fundingCapital, tenure_months, payout_option]
    );

    await db.execute(
      'INSERT INTO transactions (account_id, user_id, description, txn_type, amount) VALUES (?, ?, ?, "credit", ?)',
      [result.insertId, user_id, `Opened Fixed Deposit Certificate (Lock: ${tenure_months} Mo.)`, fundingCapital]
    );

    return res.status(201).json({ message: "Fixed Deposit deployed successfully!" });
  } catch (err) { 
    return res.status(500).json({ message: "Server deployment processing fault." }); 
  }
});

// ── EMPLOYEE MASTER LOOKUP ENDPOINT ──
app.get('/api/employee/users', async (req, res) => {
  try {
     const [clientProfiles] = await db.execute('SELECT user_id, username, first_name, last_name, email, phone, kyc_type, kyc_number FROM users WHERE role = "customer" ORDER BY created_at DESC');
     return res.status(200).json({ users: clientProfiles });
  } catch (err) { 
    return res.status(500).json({ message: 'Internal audit clearance extraction fault lines.' }); 
  }
});

// ── EMPLOYEE BACKOFFICE AUDIT ENDPOINT ──
app.get('/api/employee/user-ledger/:userId', async (req, res) => {
  try {
     const { userId } = req.params;
     const [accounts] = await db.execute('SELECT id, account_number, account_type, balance, interest_rate, min_balance FROM accounts WHERE user_id = ?', [userId]);
     const [transactions] = await db.execute('SELECT account_id, description, txn_type, amount, created_at FROM transactions WHERE user_id = ? ORDER BY created_at DESC', [userId]);
     return res.status(200).json({ accounts, transactions });
  } catch (err) { 
    return res.status(500).json({ message: 'Failed to crawl client ledger records.' }); 
  }
});

// ── OPEN ADDITIONAL SUB PRODUCT PORTFOLIOS ENDPOINT ──
app.post('/api/accounts/open', async (req, res) => {
  try {
    const { user_id, account_type, initial_deposit } = req.body;
    
    const SUB_PRODUCT_RULES = {
      savings: { baseRate: 4.00, minBalance: 1000.00 },
      current: { baseRate: 0.00, minBalance: 5000.00 }
    };

    const typeClean = account_type?.toLowerCase();
    const rule = SUB_PRODUCT_RULES[typeClean];
    
    if (!user_id || !rule) {
      return res.status(400).json({ message: 'Invalid parameter combinations or financial product tier choice.' });
    }

    const deposit = parseFloat(initial_deposit) || 0;
    if (deposit < rule.minBalance) {
      return res.status(400).json({ message: `Regulatory threshold requires a minimum deposit of ₹${rule.minBalance.toLocaleString('en-IN')} for this tier.` });
    }

    const [existing] = await db.execute('SELECT id FROM accounts WHERE user_id = ? AND account_type = ?', [user_id, typeClean]);
    if (existing.length > 0) {
      return res.status(409).json({ message: `An active ${account_type.toUpperCase()} portfolio line is already provisioned under your profile.` });
    }

    const secondaryAccountNumber = generateSecureAccountNumber();

    const [result] = await db.execute(
      'INSERT INTO accounts (account_number, user_id, account_type, balance, interest_rate, min_balance) VALUES (?, ?, ?, ?, ?, ?)',
      [secondaryAccountNumber, user_id, typeClean, deposit, rule.baseRate, rule.minBalance]
    );

    await db.execute(
      'INSERT INTO transactions (account_id, user_id, description, txn_type, amount) VALUES (?, ?, ?, "credit", ?)',
      [result.insertId, user_id, `Initial account line activation deposit — ${account_type.toUpperCase()}`, deposit]
    );

    return res.status(201).json({ message: 'Additional financial product portfolio line provisioned successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Internal infrastructure server failure opening account asset tracking lines.' });
  }
});

app.listen(PORT, () => {
  console.log(`==================================================================`);
  console.log(`📶 [CORE SYSTEMS INFRASTRUCTURE RUNNING]`);
  console.log(`🚀 APP ENGINE DEPLOYED SAFELY ON: http://127.0.0.1:${PORT}`);
  console.log(`==================================================================`);
});