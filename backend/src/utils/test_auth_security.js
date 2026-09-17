import http from 'http';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

// Set environment variables BEFORE importing app and routes
process.env.ENABLE_RBAC_TEST = 'true';
process.env.NODE_ENV = 'test';
dotenv.config();

const PORT = 5099; // Dedicated test port
let server;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      'Content-Type': 'application/json',
      ...headers,
    };
    if (payload) {
      reqHeaders['Content-Length'] = Buffer.byteLength(payload);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ status: res.statusCode, data: parsed, raw: data });
          } catch {
            resolve({ status: res.statusCode, data: null, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🛡️ FARMDEX MILESTONE 2B SECURITY VERIFICATION SUITE');
  console.log('====================================================\n');

  // Dynamic import of app after environment variables are configured
  const { default: app } = await import('../app.js');

  // Start test server instance
  server = app.listen(PORT);

  // Clean up any test users prior to test execution
  const testEmails = [
    'admin_test@farmdex.com',
    'farmer_test@farmdex.com',
    'buyer_test@farmdex.com',
    'phone_test@farmdex.com',
    'weak_test@farmdex.com',
  ];
  await prisma.user.deleteMany({
    where: { email: { in: testEmails } },
  });

  const results = [];

  function record(name, pass, details = '') {
    results.push({ name, pass, details });
    const symbol = pass ? '✅ PASS' : '❌ FAIL';
    console.log(`${symbol} | ${name} ${details ? '-> ' + details : ''}`);
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Rejection of ADMIN Public Registration
    // ----------------------------------------------------
    const adminRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Admin Attacker',
      email: 'admin_test@farmdex.com',
      password: 'Password123!',
      role: 'ADMIN',
    });
    record(
      '1. ADMIN Self-Registration Rejection',
      adminRes.status === 400 && adminRes.data?.success === false,
      `Status: ${adminRes.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Valid Farmer Registration & Profile Creation
    // ----------------------------------------------------
    const farmerRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Ramesh Farmer',
      email: 'farmer_test@farmdex.com',
      password: 'FarmerPassword123',
      phone: '+91 98765 43210',
      role: 'FARMER',
      farmName: 'Green Valley Organic Farm',
    });
    const farmerToken = farmerRes.data?.data?.token;
    const farmerUser = farmerRes.data?.data?.user;
    record(
      '2. Valid Farmer Registration',
      farmerRes.status === 201 && Boolean(farmerToken) && farmerUser?.role === 'FARMER',
      `Status: ${farmerRes.status}, Profile Created: ${Boolean(farmerUser?.farmerProfile)}`
    );

    // ----------------------------------------------------
    // TEST 3: Valid Buyer Registration & Profile Creation
    // ----------------------------------------------------
    const buyerRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Suresh Buyer',
      email: 'buyer_test@farmdex.com',
      password: 'BuyerPassword123',
      phone: '+91 91234 56789',
      role: 'BUYER',
      businessName: 'Agri Traders Wholesale',
    });
    const buyerToken = buyerRes.data?.data?.token;
    const buyerUser = buyerRes.data?.data?.user;
    record(
      '3. Valid Buyer Registration',
      buyerRes.status === 201 && Boolean(buyerToken) && buyerUser?.role === 'BUYER',
      `Status: ${buyerRes.status}, Profile Created: ${Boolean(buyerUser?.buyerProfile)}`
    );

    // ----------------------------------------------------
    // TEST 4: Duplicate Email Registration Rejection
    // ----------------------------------------------------
    const dupEmailRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Duplicate Email User',
      email: 'farmer_test@farmdex.com',
      password: 'AnotherPassword123',
      role: 'FARMER',
    });
    record(
      '4. Duplicate Email Rejection',
      dupEmailRes.status === 400 && dupEmailRes.data?.message.includes('already registered'),
      `Status: ${dupEmailRes.status}`
    );

    // ----------------------------------------------------
    // TEST 5: Duplicate Phone Registration Rejection
    // ----------------------------------------------------
    const dupPhoneRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Duplicate Phone User',
      email: 'phone_test@farmdex.com',
      password: 'AnotherPassword123',
      phone: '+91 98765 43210', // Same phone as farmer_test
      role: 'BUYER',
    });
    record(
      '5. Duplicate Phone Rejection',
      dupPhoneRes.status === 400 && dupPhoneRes.data?.message.includes('already registered'),
      `Status: ${dupPhoneRes.status}`
    );

    // ----------------------------------------------------
    // TEST 6: Phone Number Normalization
    // ----------------------------------------------------
    const dbFarmer = await prisma.user.findUnique({ where: { email: 'farmer_test@farmdex.com' } });
    record(
      '6. Phone Number Normalization',
      dbFarmer?.phone === '+919876543210',
      `Stored in DB as: '${dbFarmer?.phone}'`
    );

    // ----------------------------------------------------
    // TEST 7: Malformed Email & Weak Password Validation
    // ----------------------------------------------------
    const weakPassRes = await makeRequest('/api/auth/register', 'POST', {
      name: 'Weak User',
      email: 'weak_test@farmdex.com',
      password: '12345', // Weak password
      role: 'BUYER',
    });
    record(
      '7. Weak Password Rejection',
      weakPassRes.status === 400,
      `Status: ${weakPassRes.status}, Error: '${weakPassRes.data?.message}'`
    );

    // ----------------------------------------------------
    // TEST 8: Account Enumeration Protection (Consistent Error)
    // ----------------------------------------------------
    const nonExistLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'nonexistent@farmdex.com',
      password: 'Password123',
    });
    const wrongPassLogin = await makeRequest('/api/auth/login', 'POST', {
      email: 'farmer_test@farmdex.com',
      password: 'WrongPassword999',
    });
    const enumProtection =
      nonExistLogin.status === 401 &&
      wrongPassLogin.status === 401 &&
      nonExistLogin.data?.message === wrongPassLogin.data?.message;
    record(
      '8. Account Enumeration Protection',
      enumProtection,
      `Unified Message: '${nonExistLogin.data?.message}'`
    );

    // ----------------------------------------------------
    // TEST 9: Protected Endpoint & Valid JWT Fetch (/api/auth/me)
    // ----------------------------------------------------
    const meRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${farmerToken}`,
    });
    record(
      '9. Protected Endpoint GET /api/auth/me',
      meRes.status === 200 && meRes.data?.data?.user?.email === 'farmer_test@farmdex.com',
      `Status: ${meRes.status}, Email: ${meRes.data?.data?.user?.email}`
    );

    // ----------------------------------------------------
    // TEST 10: Invalid & Expired JWT Rejection
    // ----------------------------------------------------
    const invalidJwtRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: 'Bearer invalid.jwt.string.here',
    });

    const secret = process.env.JWT_SECRET || 'farmdex_dev_jwt_secret_change_in_production';
    const expiredToken = jwt.sign({ sub: farmerUser.id, role: 'FARMER', email: farmerUser.email }, secret, {
      expiresIn: '-10s',
    });
    const expiredJwtRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${expiredToken}`,
    });

    record(
      '10. Invalid & Expired JWT Rejection',
      invalidJwtRes.status === 401 && expiredJwtRes.status === 401,
      `Invalid Status: ${invalidJwtRes.status}, Expired Status: ${expiredJwtRes.status}`
    );

    // ----------------------------------------------------
    // TEST 11: Real-Time Inactive User Rejection
    // ----------------------------------------------------
    // Temporarily set farmerUser to isActive = false
    await prisma.user.update({
      where: { id: farmerUser.id },
      data: { isActive: false },
    });

    const inactiveMeRes = await makeRequest('/api/auth/me', 'GET', null, {
      Authorization: `Bearer ${farmerToken}`,
    });
    record(
      '11. Real-Time Inactive User Rejection',
      inactiveMeRes.status === 401 && inactiveMeRes.data?.message.includes('deactivated'),
      `Status: ${inactiveMeRes.status}, Message: '${inactiveMeRes.data?.message}'`
    );

    // Restore active status
    await prisma.user.update({
      where: { id: farmerUser.id },
      data: { isActive: true },
    });

    // ----------------------------------------------------
    // TEST 12: Role-Based Access Control (RBAC) Test (BUYER -> Farmer-only 403)
    // ----------------------------------------------------
    const rbacRes = await makeRequest('/api/auth/test-farmer-only', 'GET', null, {
      Authorization: `Bearer ${buyerToken}`,
    });
    record(
      '12. RBAC BUYER -> Farmer-Only 403 Blocking',
      rbacRes.status === 403 && rbacRes.data?.message.includes('not authorized'),
      `Status: ${rbacRes.status}, Response: '${rbacRes.data?.message}'`
    );

    // ----------------------------------------------------
    // TEST 13: PasswordHash Omission Audit
    // ----------------------------------------------------
    const rawResponseBody = JSON.stringify(farmerRes.data) + JSON.stringify(meRes.data);
    const hasHashExposed = rawResponseBody.includes('passwordHash');
    record(
      '13. PasswordHash Omission Audit',
      !hasHashExposed,
      `passwordHash present in JSON response: ${hasHashExposed}`
    );

    // ----------------------------------------------------
    // TEST 14: Dedicated Auth Rate Limiting (10 requests limit)
    // ----------------------------------------------------
    let rateLimited = false;
    for (let i = 0; i < 12; i++) {
      const rateRes = await makeRequest('/api/auth/login', 'POST', {
        email: 'farmer_test@farmdex.com',
        password: 'FarmerPassword123',
      });
      if (rateRes.status === 429) {
        rateLimited = true;
        break;
      }
    }
    record(
      '14. Dedicated Auth Rate Limiting (429 on overflow)',
      rateLimited,
      `Rate limit HTTP 429 triggered: ${rateLimited}`
    );

    // Clean up test records
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
  } catch (err) {
    console.error('❌ Error during security test execution:', err);
  } finally {
    if (server) server.close();
    await prisma.$disconnect();

    const passCount = results.filter((r) => r.pass).length;
    console.log('\n====================================================');
    console.log(`📊 TEST SUITE SUMMARY: ${passCount} / ${results.length} PASSED`);
    console.log('====================================================\n');
    process.exit(passCount === results.length ? 0 : 1);
  }
}

runSecurityTestSuite();
