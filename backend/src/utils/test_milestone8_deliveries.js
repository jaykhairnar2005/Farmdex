import crypto from 'crypto';
import prisma from '../config/db.js';
import { provisionAdmin } from './seed_admin.js';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';

async function makeRequest(path, method, body = null, headers = {}) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const res = await fetch(url, options);
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = { rawText: text };
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, error: err.message };
  }
}

async function runTests() {
  console.log('\n===========================================================');
  console.log('🚚 FARMDEX MILESTONE 8: DELIVERY TRACKING TEST SUITE');
  console.log('===========================================================\n');

  let passed = 0;
  let failed = 0;

  function record(title, condition, detail = '') {
    if (condition) {
      console.log(`✅ PASS | ${title} ${detail ? `-> ${detail}` : ''}`);
      passed++;
    } else {
      console.error(`❌ FAIL | ${title} ${detail ? `-> ${detail}` : ''}`);
      failed++;
    }
  }

  const timestamp = Date.now();
  const farmer1Email = `m8_farmer1_${timestamp}@farmdex.test`;
  const farmer2Email = `m8_farmer2_${timestamp}@farmdex.test`;
  const buyer1Email = `m8_buyer1_${timestamp}@farmdex.test`;
  const buyer2Email = `m8_buyer2_${timestamp}@farmdex.test`;
  const password = 'Password@123';

  let farmer1Token, farmer2Token, buyer1Token, buyer2Token, adminToken;
  let farmer1Headers, farmer2Headers, buyer1Headers, buyer2Headers, adminHeaders;

  try {
    // ----------------------------------------------------
    // TEST 1: Setup Test Actors & Initial Produce Order
    // ----------------------------------------------------
    const regFarmer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'M8 Test Farmer 1',
      email: farmer1Email,
      password,
      role: 'FARMER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    farmer1Token = regFarmer1.data?.data?.token;
    farmer1Headers = { Authorization: `Bearer ${farmer1Token}` };

    const regFarmer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'M8 Test Farmer 2',
      email: farmer2Email,
      password,
      role: 'FARMER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    farmer2Token = regFarmer2.data?.data?.token;
    farmer2Headers = { Authorization: `Bearer ${farmer2Token}` };

    const regBuyer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'M8 Test Buyer 1',
      email: buyer1Email,
      password,
      role: 'BUYER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    buyer1Token = regBuyer1.data?.data?.token;
    buyer1Headers = { Authorization: `Bearer ${buyer1Token}` };

    const regBuyer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'M8 Test Buyer 2',
      email: buyer2Email,
      password,
      role: 'BUYER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    buyer2Token = regBuyer2.data?.data?.token;
    buyer2Headers = { Authorization: `Bearer ${buyer2Token}` };

    // Provision Admin for delivery management & corrections
    const adminEmail = `m8_admin_${timestamp}@farmdex.test`;
    await provisionAdmin({
      email: adminEmail,
      password,
      name: 'M8 Delivery Operations Admin',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    const adminLoginRes = await makeRequest('/api/auth/login', 'POST', {
      email: adminEmail,
      password,
    });
    adminToken = adminLoginRes.data?.data?.token;
    adminHeaders = { Authorization: `Bearer ${adminToken}` };

    record(
      '1a. Setup test actors (2 Farmers, 2 Buyers, 1 Admin)',
      !!farmer1Token && !!farmer2Token && !!buyer1Token && !!buyer2Token && !!adminToken
    );

    // Get active category
    const catRes = await makeRequest('/api/categories', 'GET');
    const categoryId = catRes.data?.data?.[0]?.id;

    // Farmer 1 creates crop listing
    const listingRes = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Milestone 8 Delivery Test Wheat',
        categoryId,
        quantity: 100,
        unit: 'QUINTAL',
        pricePerUnit: 2200,
        location: 'Karnal, Haryana',
      },
      farmer1Headers
    );
    const listingId = listingRes.data?.data?.id;

    // Buyer 1 submits offer
    const offerRes = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 20,
        offeredPrice: 2100,
        message: 'M8 Delivery Order Offer',
      },
      buyer1Headers
    );
    const offerId = offerRes.data?.data?.id;

    // Farmer 1 accepts offer
    await makeRequest(`/api/offers/${offerId}/accept`, 'PATCH', null, farmer1Headers);

    // Buyer 1 creates Order 1 (unpaid initially)
    const orderRes = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId,
        shippingAddress: 'Godown 12, APMC Market Yard, New Delhi - 110001',
      },
      buyer1Headers
    );
    const orderId = orderRes.data?.data?.id;
    record('1b. Buyer 1 creates order from accepted offer', orderRes.status === 201 && !!orderId);

    // ----------------------------------------------------
    // TEST 2: Unpaid Order Dispatch Protection
    // ----------------------------------------------------
    // 2a. Attempting dispatch on unpaid order must be rejected with 400
    const unpaidDispatch = await makeRequest(
      `/api/deliveries/${orderId}/dispatch`,
      'POST',
      { trackingNumber: 'FDX-TRK-UNPAID-1' },
      farmer1Headers
    );
    record(
      '2a. Farmer attempt to dispatch unpaid order returns 400',
      unpaidDispatch.status === 400 &&
        unpaidDispatch.data?.message?.includes('Cannot dispatch unpaid order')
    );

    // 2b. Attempting status update on unpaid order must be rejected with 400
    const unpaidStatusUpdate = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'PREPARING' },
      farmer1Headers
    );
    record(
      '2b. Farmer attempt to update status on unpaid order returns 400',
      unpaidStatusUpdate.status === 400
    );

    // ----------------------------------------------------
    // TEST 3: Payment Settlement via Razorpay Test Mode
    // ----------------------------------------------------
    const createPayRes = await makeRequest('/api/payments/create-order', 'POST', { orderId }, buyer1Headers);
    const razorpayOrderId = createPayRes.data?.data?.razorpayOrderId;

    // Generate valid test mode HMAC signature
    const sigRes = await makeRequest(
      '/api/payments/test-mode-signature',
      'POST',
      { orderId, razorpayOrderId },
      buyer1Headers
    );
    const { razorpayPaymentId, razorpaySignature } = sigRes.data?.data;

    // Verify payment on server
    const verifyPayRes = await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId,
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
      },
      buyer1Headers
    );
    record(
      '3. Order 1 payment settled successfully (status SUCCESS)',
      verifyPayRes.status === 200 && verifyPayRes.data?.data?.status === 'CONFIRMED'
    );

    // ----------------------------------------------------
    // TEST 4: Authorization, Role & Ownership Checks
    // ----------------------------------------------------
    // 4a. Unauthenticated POST /api/deliveries/:orderId/dispatch
    const unauthDispatch = await makeRequest(`/api/deliveries/${orderId}/dispatch`, 'POST', {});
    record('4a. Unauthenticated dispatch returns 401', unauthDispatch.status === 401);

    // 4b. Buyer attempting to dispatch order returns 403
    const buyerDispatch = await makeRequest(
      `/api/deliveries/${orderId}/dispatch`,
      'POST',
      { trackingNumber: 'FDX-TRK-BUYER' },
      buyer1Headers
    );
    record('4b. Buyer role attempt to dispatch returns 403', buyerDispatch.status === 403);

    // 4c. Unauthorized Farmer 2 attempting to dispatch Farmer 1's order returns 403
    const farmer2Dispatch = await makeRequest(
      `/api/deliveries/${orderId}/dispatch`,
      'POST',
      { trackingNumber: 'FDX-TRK-FARMER2' },
      farmer2Headers
    );
    record('4c. Unauthorized Farmer 2 attempting to dispatch returns 403', farmer2Dispatch.status === 403);

    // ----------------------------------------------------
    // TEST 5: Valid Order Dispatch & Tracking Assignment
    // ----------------------------------------------------
    const customTracking = `FDX-TRK-${Date.now()}`;
    const estDate = new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString();

    const validDispatch = await makeRequest(
      `/api/deliveries/${orderId}/dispatch`,
      'POST',
      {
        trackingNumber: customTracking,
        estimatedDelivery: estDate,
        location: 'Karnal Central Agro Depot',
        note: 'Loaded on refrigerated container truck #HR-05-9988',
      },
      farmer1Headers
    );

    record(
      '5a. Farmer 1 successfully dispatches paid order (200)',
      validDispatch.status === 200 && validDispatch.data?.data?.status === 'DISPATCHED'
    );
    record(
      '5b. Tracking number and shippedAt properly stored',
      validDispatch.data?.data?.trackingNumber === customTracking &&
        !!validDispatch.data?.data?.shippedAt
    );

    // Verify parent order status is updated to SHIPPED
    const orderAfterDispatch = await prisma.order.findUnique({ where: { id: orderId } });
    record(
      '5c. Parent Order status updated to SHIPPED',
      orderAfterDispatch?.status === 'SHIPPED'
    );

    // ----------------------------------------------------
    // TEST 6: Delivery Lifecycle & Role-Based Permissions
    // ----------------------------------------------------
    // 6a. Invalid backward transition: Farmer attempting DISPATCHED -> PREPARING returns 400
    const invalidBackward = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'PREPARING' },
      farmer1Headers
    );
    record(
      '6a. Invalid backward transition (DISPATCHED -> PREPARING) returns 400',
      invalidBackward.status === 400 &&
        invalidBackward.data?.message?.includes('Invalid delivery status transition')
    );

    // 6b. Farmer attempt to update status to IN_TRANSIT is blocked with 403 (PREPARING/DISPATCHED only)
    const farmerInTransit = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      {
        status: 'IN_TRANSIT',
        location: 'Delhi-Haryana Border Tollway Checkpost',
        note: 'Farmer attempting in-transit update',
      },
      farmer1Headers
    );
    record(
      '6b. Farmer attempt to update status to IN_TRANSIT is blocked with 403',
      farmerInTransit.status === 403 &&
        farmerInTransit.data?.message?.includes('Farmers are only permitted to update status to PREPARING or DISPATCHED')
    );

    // 6c. Farmer attempt to update status to DELIVERED is blocked with 403
    const farmerDelivered = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'DELIVERED' },
      farmer1Headers
    );
    record(
      '6c. Farmer attempt to update status to DELIVERED is blocked with 403',
      farmerDelivered.status === 403
    );

    // 6d. Unauthorized Farmer 2 attempting to update Farmer 1 order returns 403
    const farmer2Update = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'PREPARING' },
      farmer2Headers
    );
    record(
      '6d. Unauthorized Farmer 2 attempting to update status returns 403',
      farmer2Update.status === 403 &&
        farmer2Update.data?.message?.includes('Farmers can only update delivery status for their own orders')
    );

    // 6e. Buyer 1 attempting to update delivery status returns 403 (Read-only access)
    const buyerStatusUpdate = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'DELIVERED' },
      buyer1Headers
    );
    record(
      '6e. Buyer attempting to update delivery status returns 403 (Read-only access)',
      buyerStatusUpdate.status === 403
    );

    // 6f. Admin successfully updates delivery status to IN_TRANSIT (200)
    const adminInTransit = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      {
        status: 'IN_TRANSIT',
        location: 'Delhi-Haryana Border Tollway Checkpost',
        note: 'Consignment cleared transit checkpoint',
      },
      adminHeaders
    );
    record(
      '6f. Admin successfully updates status to IN_TRANSIT (200)',
      adminInTransit.status === 200 && adminInTransit.data?.data?.status === 'IN_TRANSIT'
    );

    // 6g. Admin successfully updates delivery status to OUT_FOR_DELIVERY (200)
    const adminOutForDelivery = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      {
        status: 'OUT_FOR_DELIVERY',
        location: 'New Delhi South Hub',
        note: 'Out for final delivery on local transport',
      },
      adminHeaders
    );
    record(
      '6g. Admin successfully updates status to OUT_FOR_DELIVERY (200)',
      adminOutForDelivery.status === 200 && adminOutForDelivery.data?.data?.status === 'OUT_FOR_DELIVERY'
    );

    // 6h. Admin successfully updates delivery status to DELIVERED (200)
    const adminDelivered = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      {
        status: 'DELIVERED',
        location: 'Godown 12, APMC Yard',
        note: 'Consignment unloaded and handover confirmed',
      },
      adminHeaders
    );
    record(
      '6h. Admin successfully updates status to DELIVERED (200)',
      adminDelivered.status === 200 &&
        adminDelivered.data?.data?.status === 'DELIVERED' &&
        !!adminDelivered.data?.data?.deliveredAt
    );

    // 6i. Verify parent order status is updated to DELIVERED
    const orderAfterDelivered = await prisma.order.findUnique({ where: { id: orderId } });
    record('6i. Parent Order status updated to DELIVERED', orderAfterDelivered?.status === 'DELIVERED');

    // 6j. Admin can correct delivery status (e.g. from DELIVERED back to OUT_FOR_DELIVERY) (200)
    const adminCorrection = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      {
        status: 'OUT_FOR_DELIVERY',
        location: 'Redelivery dispatch hub',
        note: 'Admin corrected status: awaiting buyer signature confirmation',
      },
      adminHeaders
    );
    record(
      '6j. Admin can correct delivery status (200)',
      adminCorrection.status === 200 && adminCorrection.data?.data?.status === 'OUT_FOR_DELIVERY'
    );

    // 6k. Admin re-confirms DELIVERED status (200)
    const adminFinalDelivered = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'DELIVERED', note: 'Handover finally verified by admin' },
      adminHeaders
    );
    record(
      '6k. Admin re-confirms DELIVERED status (200)',
      adminFinalDelivered.status === 200 && adminFinalDelivered.data?.data?.status === 'DELIVERED'
    );

    // 6l. Idempotent DELIVERED status update succeeds (200)
    const idempotentDelivered = await makeRequest(
      `/api/deliveries/${orderId}/status`,
      'PATCH',
      { status: 'DELIVERED' },
      adminHeaders
    );
    record(
      '6l. Idempotent DELIVERED status update succeeds (200)',
      idempotentDelivered.status === 200 &&
        idempotentDelivered.data?.data?.status === 'DELIVERED'
    );

    // ----------------------------------------------------
    // TEST 7: Buyer Tracking & Tenant Isolation
    // ----------------------------------------------------
    // 7a. Unauthenticated GET /api/deliveries/:orderId
    const unauthTracking = await makeRequest(`/api/deliveries/${orderId}`, 'GET');
    record('7a. Unauthenticated GET /api/deliveries/:orderId returns 401', unauthTracking.status === 401);

    // 7b. Buyer 1 tracks own order delivery
    const buyer1Tracking = await makeRequest(`/api/deliveries/${orderId}`, 'GET', null, buyer1Headers);
    const timeline = buyer1Tracking.data?.data?.timeline;
    record(
      '7b. Buyer 1 retrieves tracking timeline for own order (200)',
      buyer1Tracking.status === 200 &&
        buyer1Tracking.data?.data?.delivery?.status === 'DELIVERED' &&
        timeline?.steps?.length === 6 &&
        timeline?.isCompleted === true
    );

    // 7c. Farmer 1 retrieves tracking for sold order
    const farmer1Tracking = await makeRequest(`/api/deliveries/${orderId}`, 'GET', null, farmer1Headers);
    record(
      '7c. Farmer 1 retrieves tracking for sold order (200)',
      farmer1Tracking.status === 200 &&
        farmer1Tracking.data?.data?.delivery?.status === 'DELIVERED'
    );

    // 7d. Unrelated Buyer 2 tracking Order 1 returns 404 (Isolation)
    const buyer2Tracking = await makeRequest(`/api/deliveries/${orderId}`, 'GET', null, buyer2Headers);
    record(
      '7d. Unrelated Buyer 2 tracking Order 1 returns 404 (Strict Tenant Isolation)',
      buyer2Tracking.status === 404
    );

    // 7e. Unrelated Farmer 2 tracking Order 1 returns 404 (Isolation)
    const farmer2TrackingOrder1 = await makeRequest(`/api/deliveries/${orderId}`, 'GET', null, farmer2Headers);
    record(
      '7e. Unrelated Farmer 2 tracking Order 1 returns 404 (Strict Tenant Isolation)',
      farmer2TrackingOrder1.status === 404
    );

    // ----------------------------------------------------
    // TEST 8: Auto-Generated Tracking Number Behavior
    // ----------------------------------------------------
    // Setup Order 2 (Paid)
    const offer2Res = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 10,
        offeredPrice: 2200,
        message: 'Order 2 for auto-tracking test',
      },
      buyer1Headers
    );
    const offer2Id = offer2Res.data?.data?.id;
    await makeRequest(`/api/offers/${offer2Id}/accept`, 'PATCH', null, farmer1Headers);

    const order2Res = await makeRequest(
      '/api/orders',
      'POST',
      { offerId: offer2Id, shippingAddress: 'Sector 14, Gurugram - 122001' },
      buyer1Headers
    );
    const order2Id = order2Res.data?.data?.id;

    // Settle payment for Order 2
    const p2Order = await makeRequest('/api/payments/create-order', 'POST', { orderId: order2Id }, buyer1Headers);
    const p2Sig = await makeRequest(
      '/api/payments/test-mode-signature',
      'POST',
      { orderId: order2Id, razorpayOrderId: p2Order.data?.data?.razorpayOrderId },
      buyer1Headers
    );
    await makeRequest(
      '/api/payments/verify',
      'POST',
      {
        orderId: order2Id,
        razorpayOrderId: p2Order.data?.data?.razorpayOrderId,
        razorpayPaymentId: p2Sig.data?.data?.razorpayPaymentId,
        razorpaySignature: p2Sig.data?.data?.razorpaySignature,
      },
      buyer1Headers
    );

    // Farmer dispatches without trackingNumber in payload
    const autoDispatch = await makeRequest(
      `/api/deliveries/${order2Id}/dispatch`,
      'POST',
      {},
      farmer1Headers
    );
    const autoTracking = autoDispatch.data?.data?.trackingNumber;
    record(
      '8. System auto-generates tracking number when omitted by farmer',
      autoDispatch.status === 200 &&
        typeof autoTracking === 'string' &&
        autoTracking.startsWith('FDX-TRK-'),
      `Generated: ${autoTracking}`
    );

    // ----------------------------------------------------
    // CLEANUP
    // ----------------------------------------------------
    const allUsers = await prisma.user.findMany({
      where: { email: { in: [farmer1Email, farmer2Email, buyer1Email, buyer2Email] } },
      select: { id: true },
    });
    const userIds = allUsers.map((u) => u.id);

    if (userIds.length > 0) {
      await prisma.$executeRawUnsafe(
        `DELETE FROM delivery_status_history WHERE order_id IN (SELECT id FROM orders WHERE buyer_id = ANY($1::text[]) OR farmer_id = ANY($1::text[]))`,
        userIds
      ).catch(() => {});
      await prisma.delivery.deleteMany({
        where: { order: { OR: [{ buyerId: { in: userIds } }, { farmerId: { in: userIds } }] } },
      });
      await prisma.payment.deleteMany({
        where: { order: { OR: [{ buyerId: { in: userIds } }, { farmerId: { in: userIds } }] } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { OR: [{ buyerId: { in: userIds } }, { farmerId: { in: userIds } }] } },
      });
      await prisma.order.deleteMany({
        where: { OR: [{ buyerId: { in: userIds } }, { farmerId: { in: userIds } }] },
      });
      await prisma.offer.deleteMany({
        where: { OR: [{ buyerId: { in: userIds } }, { listing: { farmerProfile: { userId: { in: userIds } } } }] },
      });
      await prisma.cropListing.deleteMany({
        where: { farmerProfile: { userId: { in: userIds } } },
      });
      await prisma.farmerProfile.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.buyerProfile.deleteMany({
        where: { userId: { in: userIds } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: userIds } },
      });
    }
  } catch (err) {
    console.error('Test Suite Fatal Error:', err);
  } finally {
    await prisma.$disconnect();
  }

  console.log('\n===========================================================');
  console.log(`📊 MILESTONE 8 DELIVERY TEST SUMMARY: ${passed} / ${passed + failed} PASSED`);
  if (failed > 0) {
    console.log(`❌ ${failed} TESTS FAILED`);
  }
  console.log('===========================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests();
