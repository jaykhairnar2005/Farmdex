import http from 'http';
import crypto from 'crypto';
import prisma from '../config/db.js';

const PORT = 5000;

function makeRequest(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const reqHeaders = {
      ...headers,
    };
    if (postData) {
      reqHeaders['Content-Type'] = 'application/json';
      reqHeaders['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: PORT,
        path,
        method,
        headers: reqHeaders,
        timeout: 15000,
      },
      (res) => {
        let rawData = '';
        res.on('data', (chunk) => (rawData += chunk));
        res.on('end', () => {
          let data = null;
          try {
            data = JSON.parse(rawData);
          } catch {
            data = rawData;
          }
          resolve({ status: res.statusCode, data });
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runPaymentsTestSuite() {
  console.log('===========================================================');
  console.log('💳 FARMDEX MILESTONE 7: RAZORPAY PAYMENTS TEST SUITE');
  console.log('===========================================================\n');

  const results = [];
  const record = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} | ${name} ${details ? '-> ' + details : ''}`);
  };

  const ts = Date.now();
  const farmerEmail = `m7_farmer_${ts}@farmdex.com`;
  const buyer1Email = `m7_buyer1_${ts}@farmdex.com`;
  const buyer2Email = `m7_buyer2_${ts}@farmdex.com`;
  const testPassword = 'Password123!';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'farmdexMockSecretKey456';
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || keySecret;

  try {
    // ----------------------------------------------------
    // SETUP: Register test actors, produce listing, offer & order
    // ----------------------------------------------------
    const regFarmer = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer PayTest',
      email: farmerEmail,
      password: testPassword,
      phone: `+9191${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'FARMER',
    });
    const farmerToken = regFarmer.data?.data?.token;

    const regBuyer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer PayOne',
      email: buyer1Email,
      password: testPassword,
      phone: `+9192${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'BUYER',
    });
    const buyer1Token = regBuyer1.data?.data?.token;

    const regBuyer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer PayTwo',
      email: buyer2Email,
      password: testPassword,
      phone: `+9193${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'BUYER',
    });
    const buyer2Token = regBuyer2.data?.data?.token;

    const farmerHeaders = { Authorization: `Bearer ${farmerToken}` };
    const buyer1Headers = { Authorization: `Bearer ${buyer1Token}` };
    const buyer2Headers = { Authorization: `Bearer ${buyer2Token}` };

    record('1a. Setup test actors (1 Farmer, 2 Buyers)', !!farmerToken && !!buyer1Token && !!buyer2Token);

    // Fetch category
    const catRes = await makeRequest('/api/categories', 'GET');
    const categoryId = catRes.data?.data?.[0]?.id;

    // Create listing (50 Quintal @ ₹2,000)
    const listingRes = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Milestone 7 Payment Test Basmati',
        categoryId,
        quantity: 50,
        unit: 'QUINTAL',
        pricePerUnit: 2000,
        location: 'Amritsar, Punjab',
      },
      farmerHeaders
    );
    const listingId = listingRes.data?.data?.id;

    // Buyer 1 submits offer (10 Quintal @ ₹1,900)
    const offerRes = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 10,
        offeredPrice: 1900,
        message: 'Milestone 7 Trade Offer',
      },
      buyer1Headers
    );
    const offerId = offerRes.data?.data?.id;

    // Farmer accepts offer
    await makeRequest(`/api/offers/${offerId}/accept`, 'PATCH', null, farmerHeaders);

    // Buyer 1 creates order (Total: ₹19,000)
    const orderRes = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId,
        shippingAddress: 'Plot 45, APMC Yard, Amritsar - 143001',
      },
      buyer1Headers
    );
    const orderId = orderRes.data?.data?.id;
    record('1b. Buyer 1 creates order from accepted offer', orderRes.status === 201 && !!orderId);

    // ----------------------------------------------------
    // TEST 2: Payment Order Creation & Validation
    // ----------------------------------------------------
    // 2a. Unauthenticated POST /api/payments/create-order
    const unauthPaymentOrder = await makeRequest('/api/payments/create-order', 'POST', { orderId });
    record('2a. Unauthenticated POST /api/payments/create-order returns 401', unauthPaymentOrder.status === 401);

    // 2b. Non-buyer (FARMER) attempt to create payment order
    const farmerPaymentOrder = await makeRequest(
      '/api/payments/create-order',
      'POST',
      { orderId },
      farmerHeaders
    );
    record('2b. Non-buyer role (FARMER) attempt returns 403', farmerPaymentOrder.status === 403);

    // 2c. Non-existent orderId
    const nonExistentPaymentOrder = await makeRequest(
      '/api/payments/create-order',
      'POST',
      { orderId: '00000000-0000-0000-0000-000000000000' },
      buyer1Headers
    );
    record('2c. Non-existent orderId returns 404', nonExistentPaymentOrder.status === 404);

    // 2d. Unauthorized Buyer 2 attempting to pay Buyer 1's order
    const unauthorizedPaymentOrder = await makeRequest(
      '/api/payments/create-order',
      'POST',
      { orderId },
      buyer2Headers
    );
    record(
      '2d. Unauthorized Buyer 2 attempting to pay Buyer 1 order returns 403',
      unauthorizedPaymentOrder.status === 403
    );

    // 2e. Valid Buyer 1 payment order creation
    const validPaymentOrder = await makeRequest(
      '/api/payments/create-order',
      'POST',
      { orderId },
      buyer1Headers
    );
    const razorpayOrderId = validPaymentOrder.data?.data?.razorpayOrderId;
    const amountInPaise = validPaymentOrder.data?.data?.amount;
    const expectedAmountPaise = 10 * 1900 * 100; // 19,000 * 100 = 1,900,000 paise

    record(
      '2e. Valid payment order creation returns 200 with Razorpay order details',
      validPaymentOrder.status === 200 &&
        !!razorpayOrderId &&
        amountInPaise === expectedAmountPaise &&
        validPaymentOrder.data?.data?.currency === 'INR',
      `Razorpay Order ID: ${razorpayOrderId}, Amount: ${amountInPaise} paise`
    );

    // Verify Payment record in DB is PENDING
    const paymentInDb = await prisma.payment.findUnique({ where: { orderId } });
    record(
      '2f. Payment record created in DB with status PENDING',
      paymentInDb?.status === 'PENDING' && Number(paymentInDb?.amount) === 19000
    );

    // ----------------------------------------------------
    // TEST 3: Cryptographic Signature Verification
    // ----------------------------------------------------
    const mockPaymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${mockPaymentId}`)
      .digest('hex');

    // 3a. Unauthenticated POST /api/payments/verify
    const unauthVerify = await makeRequest('/api/payments/verify', 'POST', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId: mockPaymentId,
      razorpaySignature: validSignature,
    });
    record('3a. Unauthenticated POST /api/payments/verify returns 401', unauthVerify.status === 401);

    // 3b. Unauthorized Buyer 2 verifying Buyer 1's payment
    const unauthorizedVerify = await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: validSignature,
      },
      buyer2Headers
    );
    record('3b. Unauthorized Buyer 2 attempt returns 403', unauthorizedVerify.status === 403);

    // 3c. Invalid cryptographic signature rejection
    const invalidSignatureVerify = await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: 'invalid_tampered_signature_1234567890abcdef',
      },
      buyer1Headers
    );
    record(
      '3c. Invalid signature is rejected with 400',
      invalidSignatureVerify.status === 400 &&
        invalidSignatureVerify.data?.message?.includes('Invalid payment signature')
    );

    // Check payment status was recorded as FAILED after invalid signature attempt
    const failedPaymentInDb = await prisma.payment.findUnique({ where: { orderId } });
    record('3d. Failed payment attempt recorded in DB as FAILED', failedPaymentInDb?.status === 'FAILED');

    // 3e. Valid cryptographic signature verification succeeds
    const successfulVerify = await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: validSignature,
      },
      buyer1Headers
    );
    record(
      '3e. Valid cryptographic signature verification succeeds with 200',
      successfulVerify.status === 200 && successfulVerify.data?.success === true
    );

    // Verify Payment status updated to SUCCESS with transactionId and paidAt
    const settledPayment = await prisma.payment.findUnique({ where: { orderId } });
    record(
      '3f. Payment record updated in DB to SUCCESS with transactionId and paidAt',
      settledPayment?.status === 'SUCCESS' &&
        settledPayment?.transactionId === mockPaymentId &&
        !!settledPayment?.paidAt
    );

    // ----------------------------------------------------
    // TEST 4: Duplicate Payment & Idempotency Protection
    // ----------------------------------------------------
    // 4a. Attempt to re-create payment order for already settled order
    const duplicateCreatePayment = await makeRequest(
      '/api/payments/create-order',
      'POST',
      { orderId },
      buyer1Headers
    );
    record(
      '4a. Duplicate payment order creation on settled order blocked (400)',
      duplicateCreatePayment.status === 400 &&
        duplicateCreatePayment.data?.message?.includes('already been paid')
    );

    // 4b. Idempotent verification replay returns 200 with already verified indication
    const replayVerify = await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId: mockPaymentId,
        razorpaySignature: validSignature,
      },
      buyer1Headers
    );
    record(
      '4b. Replay verification on already settled order handles idempotently (200)',
      replayVerify.status === 200 && replayVerify.data?.message?.includes('already verified')
    );

    // ----------------------------------------------------
    // TEST 5: Razorpay Webhook Processing & Idempotency
    // ----------------------------------------------------
    // Create second order for webhook verification testing
    const offer2Res = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 5,
        offeredPrice: 1950,
        message: 'Webhook test offer',
      },
      buyer2Headers
    );
    const offer2Id = offer2Res.data?.data?.id;
    await makeRequest(`/api/offers/${offer2Id}/accept`, 'PATCH', null, farmerHeaders);

    const order2Res = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer2Id,
        shippingAddress: 'Shop 7, Grain Market, Ludhiana',
      },
      buyer2Headers
    );
    const order2Id = order2Res.data?.data?.id;

    const webhookPaymentId = `pay_webhook_${Date.now()}`;
    const webhookPayload = {
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: webhookPaymentId,
            amount: 5 * 1950 * 100,
            currency: 'INR',
            status: 'captured',
            created_at: Math.floor(Date.now() / 1000),
            notes: {
              orderId: order2Id,
            },
          },
        },
      },
    };
    const webhookRawBody = JSON.stringify(webhookPayload);
    const validWebhookSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(webhookRawBody)
      .digest('hex');

    // 5a. Webhook without signature header returns 400
    const noSigWebhook = await makeRequest('/api/payments/webhook', 'POST', webhookPayload);
    record('5a. Webhook without x-razorpay-signature header returns 400', noSigWebhook.status === 400);

    // 5b. Webhook with invalid signature returns 400
    const invalidSigWebhook = await makeRequest('/api/payments/webhook', 'POST', webhookPayload, {
      'x-razorpay-signature': 'invalid_webhook_sig_hex',
    });
    record('5b. Webhook with invalid signature returns 400', invalidSigWebhook.status === 400);

    // 5c. Webhook with valid signature processes successfully (200)
    const validWebhook = await makeRequest('/api/payments/webhook', 'POST', webhookPayload, {
      'x-razorpay-signature': validWebhookSignature,
    });
    record(
      '5c. Webhook with valid signature successfully processes order payment (200)',
      validWebhook.status === 200 && validWebhook.data?.success === true
    );

    // Verify order 2 payment settled via webhook
    const order2Payment = await prisma.payment.findUnique({ where: { orderId: order2Id } });
    record(
      '5d. Order 2 payment marked SUCCESS via webhook capture',
      order2Payment?.status === 'SUCCESS' && order2Payment?.transactionId === webhookPaymentId
    );

    // 5e. Webhook retry / duplicate delivery handles idempotently
    const retryWebhook = await makeRequest('/api/payments/webhook', 'POST', webhookPayload, {
      'x-razorpay-signature': validWebhookSignature,
    });
    record(
      '5e. Webhook retry handles idempotently without error (200)',
      retryWebhook.status === 200 && retryWebhook.data?.idempotent === true
    );

    // ----------------------------------------------------
    // TEST 6: Payment Retrieval API & Tenant Isolation
    // ----------------------------------------------------
    // Buyer 1 retrieves payment record for Order 1
    const getPaymentBuyer1 = await makeRequest(
      `/api/payments/order/${orderId}`,
      'GET',
      null,
      buyer1Headers
    );
    record(
      '6a. Buyer retrieves payment record for own order (200)',
      getPaymentBuyer1.status === 200 && getPaymentBuyer1.data?.data?.status === 'SUCCESS'
    );

    // Farmer retrieves payment record for Order 1 (sold by farmer)
    const getPaymentFarmer = await makeRequest(
      `/api/payments/order/${orderId}`,
      'GET',
      null,
      farmerHeaders
    );
    record(
      '6b. Farmer retrieves payment record for sold order (200)',
      getPaymentFarmer.status === 200 && getPaymentFarmer.data?.data?.status === 'SUCCESS'
    );

    // Unrelated Buyer 2 accessing Order 1's payment is blocked (404 Tenant Isolation)
    const getPaymentBuyer2 = await makeRequest(
      `/api/payments/order/${orderId}`,
      'GET',
      null,
      buyer2Headers
    );
    record(
      '6c. Unrelated user accessing payment record returns 404 (Strict Tenant Isolation)',
      getPaymentBuyer2.status === 404
    );

    // ----------------------------------------------------
    // TEST 7: Test Mode Signature Generator
    // ----------------------------------------------------
    // 7a. Unauthenticated POST /api/payments/test-mode-signature
    const unauthTestSig = await makeRequest('/api/payments/test-mode-signature', 'POST', {
      orderId,
      razorpayOrderId,
    });
    record('7a. Unauthenticated POST /api/payments/test-mode-signature returns 401', unauthTestSig.status === 401);

    // 7b. Unauthorized Buyer 2 attempt
    const unauthBuyer2TestSig = await makeRequest(
      '/api/payments/test-mode-signature',
      'POST',
      { orderId, razorpayOrderId },
      buyer2Headers
    );
    record('7b. Unauthorized Buyer 2 attempt returns 403', unauthBuyer2TestSig.status === 403);

    // 7c. Valid Buyer 1 test mode signature generation
    const validTestSig = await makeRequest(
      '/api/payments/test-mode-signature',
      'POST',
      { orderId, razorpayOrderId },
      buyer1Headers
    );
    const generatedPaymentId = validTestSig.data?.data?.razorpayPaymentId;
    const generatedSig = validTestSig.data?.data?.razorpaySignature;
    const expectedSig = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpayOrderId}|${generatedPaymentId}`)
      .digest('hex');

    record(
      '7c. Valid Buyer 1 test mode signature generates authentic HMAC SHA-256 signature',
      validTestSig.status === 200 && !!generatedPaymentId && generatedSig === expectedSig
    );

    // ----------------------------------------------------
    // CLEANUP: Clean up test actors in cascade order
    // ----------------------------------------------------
    const testUsers = await prisma.user.findMany({
      where: { email: { in: [farmerEmail, buyer1Email, buyer2Email] } },
      select: { id: true },
    });
    const userIds = testUsers.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.payment.deleteMany({
        where: { order: { buyerId: { in: userIds } } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { buyerId: { in: userIds } } },
      });
      await prisma.order.deleteMany({
        where: { buyerId: { in: userIds } },
      });
      await prisma.offer.deleteMany({
        where: { buyerId: { in: userIds } },
      });
      await prisma.cropListing.deleteMany({
        where: { farmerProfile: { userId: { in: userIds } } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  } catch (err) {
    console.error('❌ Error during payments test execution:', err);
  } finally {
    await prisma.$disconnect();

    const passCount = results.filter((r) => r.passed).length;
    console.log('\n===========================================================');
    console.log(`📊 MILESTONE 7 PAYMENTS TEST SUMMARY: ${passCount} / ${results.length} PASSED`);
    console.log('===========================================================\n');
    process.exit(passCount === results.length ? 0 : 1);
  }
}

runPaymentsTestSuite();
