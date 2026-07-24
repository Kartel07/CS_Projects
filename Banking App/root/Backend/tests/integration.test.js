'use strict';

// Set test environment first
process.env.NODE_ENV = 'test';

const request = require('supertest');
const db = require('../config/db');

let app;

// ── Test data with unique identifiers ──
const TEST_ID = Date.now();
const TEST_USER = {
  personal: {
    first_name: 'Test',
    last_name: 'User',
    email: `testuser${TEST_ID}@apexbanktest.com`,
    phone: `9${TEST_ID.toString().slice(-9)}`,
    dob: '1990-06-15',
    kyc_type: 'PAN',
    kyc_number: `ABCDE${TEST_ID.toString().slice(-4)}F`
  },
  account: {
    username: `test_customer_${TEST_ID}`,
    password: 'testPass123!',
    account_type: 'savings'
  }
};

const TEST_USER_ALT = {
  personal: {
    first_name: 'Second',
    last_name: 'Customer',
    email: `second${TEST_ID}@apexbanktest.com`,
    phone: `8${(TEST_ID + 1).toString().slice(-9)}`,
    dob: '1985-03-20',
    kyc_type: 'AADHAAR',
    kyc_number: `9${TEST_ID.toString().slice(-11)}`
  },
  account: {
    username: `second_customer_${TEST_ID}`,
    password: 'securePass456!',
    account_type: 'current'
  }
};

let testUserId;
let testAccountId;
let sessionCookies;

// ── Setup / Teardown ───────────────────────────────────────────

beforeAll(async () => {
  // Import app (server won't listen because NODE_ENV=test)
  app = require('../server');

  // Clean any leftover test data by specific identifiers
  for (const email of [TEST_USER.personal.email, TEST_USER_ALT.personal.email]) {
    const [rows] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    for (const row of rows) {
      await db.execute('DELETE FROM transactions WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM accounts WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM audit_logs WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM users WHERE user_id = ?', [row.user_id]);
    }
  }
  // Also clean by username
  for (const username of [TEST_USER.account.username, TEST_USER_ALT.account.username]) {
    await db.execute('DELETE FROM users WHERE username = ?', [username]);
  }
  // Clean by phone/KYC
  await db.execute('DELETE FROM users WHERE phone = ?', [TEST_USER.personal.phone]);
  await db.execute('DELETE FROM users WHERE kyc_number = ?', [TEST_USER.personal.kyc_number]);
});

afterAll(async () => {
  // Clean up test data by specific identifiers
  for (const email of [TEST_USER.personal.email, TEST_USER_ALT.personal.email]) {
    const [rows] = await db.execute('SELECT user_id FROM users WHERE email = ?', [email]);
    for (const row of rows) {
      await db.execute('DELETE FROM transactions WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM accounts WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM audit_logs WHERE user_id = ?', [row.user_id]);
      await db.execute('DELETE FROM users WHERE user_id = ?', [row.user_id]);
    }
  }

  // Close DB pool
  await db.end();
});

// ── Helpers ───────────────────────────────────────────────────

function extractCookies(res) {
  const cookies = res.headers['set-cookie'];
  if (!cookies) return [];
  return cookies.map(c => c.split(';')[0]);
}

// ── Test suite ─────────────────────────────────────────────────

describe('Apex Banking API — Integration Tests', () => {

  // ═══════════════════════════════════════════════════════════
  // REGISTRATION
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/auth/register', () => {
    test('should register a new customer', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('successfully');
    });

    test('should reject duplicate username', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER)
        .expect(409);

      expect(res.body).toHaveProperty('message');
    });

    test('should reject invalid data (short password)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          personal: {
            ...TEST_USER.personal,
            email: `another${TEST_ID}@test.com`,
            kyc_number: `XYZPD${TEST_ID.toString().slice(-4)}K`
          },
          account: {
            ...TEST_USER.account,
            username: `another_user_${TEST_ID}`,
            password: 'short'
          }
        })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Validation failed.');
    });

    test('should register a second customer with current account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(TEST_USER_ALT)
        .expect(201);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('successfully');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // LOGIN FLOW
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/auth/login/*', () => {
    test('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/initiate')
        .send({ login_handle: TEST_USER.account.username, password: 'wrongpassword' })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });

    test('should reject empty login handle', async () => {
      const res = await request(app)
        .post('/api/auth/login/initiate')
        .send({ login_handle: '', password: 'testPass123!' })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Validation failed.');
    });

    test('should send OTP with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login/initiate')
        .send({ login_handle: TEST_USER.account.username, password: 'testPass123!' })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('target_handle', TEST_USER.account.username);
    });

    test('should verify OTP and return cookies', async () => {
      const [rows] = await db.execute(
        'SELECT otp_code FROM users WHERE username = ?',
        [TEST_USER.account.username]
      );
      expect(rows.length).toBe(1);
      const otp = rows[0].otp_code;
      expect(otp).toBeTruthy();

      const res = await request(app)
        .post('/api/auth/login/verify')
        .send({ login_handle: TEST_USER.account.username, otp_code: otp })
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user).toHaveProperty('username', TEST_USER.account.username);

      sessionCookies = extractCookies(res);
      expect(sessionCookies.length).toBeGreaterThan(0);

      testUserId = res.body.user.user_id;
    });

    test('should reject invalid OTP', async () => {
      const res = await request(app)
        .post('/api/auth/login/verify')
        .send({ login_handle: TEST_USER.account.username, otp_code: '000000' })
        .expect(401);

      expect(res.body).toHaveProperty('message');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // DASHBOARD
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/accounts/dashboard/:userId', () => {
    test('should fetch dashboard data with authenticated user', async () => {
      const res = await request(app)
        .get(`/api/accounts/dashboard/${testUserId}`)
        .set('Cookie', sessionCookies)
        .expect(200);

      expect(res.body).toHaveProperty('accounts');
      expect(res.body).toHaveProperty('transactions');
      expect(res.body.accounts.length).toBeGreaterThan(0);

      testAccountId = res.body.accounts[0].id;
    });

    test('should reject unauthenticated dashboard request', async () => {
      await request(app)
        .get(`/api/accounts/dashboard/${testUserId}`)
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TRANSACTIONS
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/transactions/execute', () => {
    test('should execute a deposit transaction', async () => {
      const res = await request(app)
        .post('/api/transactions/execute')
        .set('Cookie', sessionCookies)
        .send({
          account_id: testAccountId,
          user_id: testUserId,
          action_type: 'deposit',
          amount: 5000,
          description: 'Test deposit'
        })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('revisedBalance');
      expect(parseFloat(res.body.revisedBalance)).toBeGreaterThan(1000);
    });

    test('should execute a withdrawal transaction', async () => {
      const res = await request(app)
        .post('/api/transactions/execute')
        .set('Cookie', sessionCookies)
        .send({
          account_id: testAccountId,
          user_id: testUserId,
          action_type: 'withdraw',
          amount: 2000,
          description: 'Test withdrawal'
        })
        .expect(200);

      expect(res.body).toHaveProperty('revisedBalance');
    });

    test('should enforce minimum balance on withdrawal', async () => {
      const res = await request(app)
        .post('/api/transactions/execute')
        .set('Cookie', sessionCookies)
        .send({
          account_id: testAccountId,
          user_id: testUserId,
          action_type: 'withdraw',
          amount: 999999,
          description: 'Test excessive withdrawal'
        })
        .expect(400);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Minimum balance');
    });

    test('should reject unauthenticated transaction', async () => {
      await request(app)
        .post('/api/transactions/execute')
        .send({
          account_id: testAccountId,
          user_id: testUserId,
          action_type: 'deposit',
          amount: 100
        })
        .expect(401);
    });

    test('should reject invalid amount (negative)', async () => {
      const res = await request(app)
        .post('/api/transactions/execute')
        .set('Cookie', sessionCookies)
        .send({
          account_id: testAccountId,
          user_id: testUserId,
          action_type: 'deposit',
          amount: -500
        })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Validation failed.');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // ACCOUNT MANAGEMENT
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/accounts/open', () => {
    test('should open a new sub-account', async () => {
      const res = await request(app)
        .post('/api/accounts/open')
        .set('Cookie', sessionCookies)
        .send({
          user_id: testUserId,
          account_type: 'current',
          initial_deposit: 10000
        })
        .expect(201);

      expect(res.body).toHaveProperty('message');
    });

    test('should reject opening duplicate account type', async () => {
      await request(app)
        .post('/api/accounts/open')
        .set('Cookie', sessionCookies)
        .send({
          user_id: testUserId,
          account_type: 'savings',
          initial_deposit: 5000
        })
        .expect(409);
    });

    test('should reject invalid account type', async () => {
      const res = await request(app)
        .post('/api/accounts/open')
        .set('Cookie', sessionCookies)
        .send({
          user_id: testUserId,
          account_type: 'invalid',
          initial_deposit: 5000
        })
        .expect(400);

      expect(res.body).toHaveProperty('message', 'Validation failed.');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // USERNAME UPDATE
  // ═══════════════════════════════════════════════════════════

  describe('PATCH /api/accounts/username', () => {
    test('should update username', async () => {
      const newName = `updated_${TEST_ID}`;
      const res = await request(app)
        .patch('/api/accounts/username')
        .set('Cookie', sessionCookies)
        .send({ user_id: testUserId, new_username: newName })
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('updatedUsername', newName);

      // Restore
      await request(app)
        .patch('/api/accounts/username')
        .set('Cookie', sessionCookies)
        .send({ user_id: testUserId, new_username: TEST_USER.account.username });
    });

    test('should reject duplicate username', async () => {
      const res = await request(app)
        .patch('/api/accounts/username')
        .set('Cookie', sessionCookies)
        .send({ user_id: testUserId, new_username: TEST_USER_ALT.account.username })
        .expect(409);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // EMPLOYEE ENDPOINTS (role-based access)
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/employee/users', () => {
    test('should reject non-employee access', async () => {
      await request(app)
        .get('/api/employee/users')
        .set('Cookie', sessionCookies)
        .expect(403);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // HEALTH CHECK
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/health', () => {
    test('should return healthy status', async () => {
      const res = await request(app)
        .get('/api/health')
        .expect(200);

      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

});