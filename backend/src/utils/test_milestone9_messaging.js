import crypto from 'crypto';
import { io } from 'socket.io-client';
import prisma from '../config/db.js';
import { provisionAdmin } from './seed_admin.js';

const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.SOCKET_URL || 'http://localhost:5000';

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

function connectSocket(token) {
  return new Promise((resolve, reject) => {
    const socket = io(SOCKET_URL, {
      auth: token ? { token } : {},
      transports: ['websocket'],
      reconnection: false,
      timeout: 5000,
    });

    socket.on('connect', () => {
      resolve({ success: true, socket });
    });

    socket.on('connect_error', (err) => {
      resolve({ success: false, error: err.message, socket });
    });
  });
}

async function runTests() {
  console.log('\n===========================================================');
  console.log('💬 FARMDEX MILESTONE 9: MESSAGING & NOTIFICATIONS TEST SUITE');
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
  const farmer1Email = `m9_farmer1_${timestamp}@farmdex.test`;
  const farmer2Email = `m9_farmer2_${timestamp}@farmdex.test`;
  const buyer1Email = `m9_buyer1_${timestamp}@farmdex.test`;
  const password = 'Password@123';

  let farmer1Token, farmer1User;
  let farmer2Token, farmer2User;
  let buyer1Token, buyer1User;
  let adminToken;
  let listingId, offerId, orderId;
  let conversationId;
  let farmer1Socket, buyer1Socket;

  try {
    // -------------------------------------------------------------
    // PHASE 1: User Registration, Profiles, & Produce Listing
    // -------------------------------------------------------------
    console.log('--- Phase 1: Setup Participants & Produce Listing ---');

    // Register Farmer 1
    const regF1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Ramesh Farmer',
      email: farmer1Email,
      password,
      role: 'FARMER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    record('Register Farmer 1', regF1.status === 201, `Status: ${regF1.status}`);
    farmer1Token = regF1.data?.data?.token;
    farmer1User = regF1.data?.data?.user;

    // Register Farmer 2 (Third-party intruder for isolation tests)
    const regF2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Suresh Intruder Farmer',
      email: farmer2Email,
      password,
      role: 'FARMER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    record('Register Farmer 2 (Third-party)', regF2.status === 201);
    farmer2Token = regF2.data?.data?.token;
    farmer2User = regF2.data?.data?.user;

    // Register Buyer 1
    const regB1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Priya Organic Buyer',
      email: buyer1Email,
      password,
      role: 'BUYER',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    record('Register Buyer 1', regB1.status === 201);
    buyer1Token = regB1.data?.data?.token;
    buyer1User = regB1.data?.data?.user;

    // Update FarmerProfile & Farm for Farmer 1
    const fProfileRes = await makeRequest('/api/profiles/farmer', 'PUT', {
      farmName: 'Ramesh Organic Acres',
      district: 'Nashik',
      state: 'Maharashtra',
    }, { Authorization: `Bearer ${farmer1Token}` });
    record('Update Farmer 1 Profile', [200, 201].includes(fProfileRes.status));

    const farmRes = await makeRequest('/api/farms', 'POST', {
      name: 'Nashik Orchard',
      size: 25.5,
      district: 'Nashik',
      state: 'Maharashtra',
      pincode: '422001',
    }, { Authorization: `Bearer ${farmer1Token}` });
    record('Create Farm for Farmer 1', farmRes.status === 201);
    const farmId = farmRes.data?.data?.id;

    // Get Categories
    const catRes = await makeRequest('/api/categories', 'GET');
    const categoryId = catRes.data?.data?.[0]?.id;

    // Create Active Crop Listing via /api/crop-listings
    const listingRes = await makeRequest('/api/crop-listings', 'POST', {
      farmId,
      categoryId,
      cropName: `M9 Alphonso Mangoes ${timestamp}`,
      description: 'Hand-picked premium organic mangoes',
      quantity: 500,
      unit: 'KG',
      quality: 'GRADE_A',
      pricePerUnit: 120,
      location: 'Nashik, Maharashtra',
      isOrganic: true,
    }, { Authorization: `Bearer ${farmer1Token}` });
    record('Create Produce Listing', listingRes.status === 201);
    listingId = listingRes.data?.data?.id;

    // -------------------------------------------------------------
    // PHASE 2: Socket.IO Authentication & Handshake Security
    // -------------------------------------------------------------
    console.log('\n--- Phase 2: Socket.IO Authentication & Handshake Security ---');

    // 1. Connection without token -> Rejected
    const noTokenConn = await connectSocket(null);
    record(
      'Socket connection rejected when token is missing',
      noTokenConn.success === false &&
        (noTokenConn.error?.toLowerCase().includes('token missing') ||
          noTokenConn.error?.toLowerCase().includes('missing token')),
      `Error: ${noTokenConn.error}`
    );
    if (noTokenConn.socket) noTokenConn.socket.disconnect();

    // 2. Connection with invalid/forged JWT -> Rejected
    const invalidTokenConn = await connectSocket('invalid.jwt.token.string');
    record(
      'Socket connection rejected with invalid/forged token',
      invalidTokenConn.success === false &&
        (invalidTokenConn.error?.includes('Invalid') || invalidTokenConn.error?.includes('expired')),
      `Error: ${invalidTokenConn.error}`
    );
    if (invalidTokenConn.socket) invalidTokenConn.socket.disconnect();

    // 3. Connection with valid Buyer 1 JWT -> Success
    const buyer1Conn = await connectSocket(buyer1Token);
    record('Buyer 1 connects successfully to Socket.IO with valid JWT', buyer1Conn.success === true);
    buyer1Socket = buyer1Conn.socket;

    // 4. Connection with valid Farmer 1 JWT -> Success
    const farmer1Conn = await connectSocket(farmer1Token);
    record('Farmer 1 connects successfully to Socket.IO with valid JWT', farmer1Conn.success === true);
    farmer1Socket = farmer1Conn.socket;

    // -------------------------------------------------------------
    // PHASE 3: Conversation Lifecycle & Participant Validation
    // -------------------------------------------------------------
    console.log('\n--- Phase 3: Conversation Lifecycle & Participant Validation ---');

    // 1. Starting conversation with oneself -> Rejected (400)
    const selfConvRes = await makeRequest('/api/conversations', 'POST', {
      recipientId: buyer1User.id,
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Starting conversation with oneself returns 400 Bad Request', selfConvRes.status === 400);

    // 2. Starting conversation with nonexistent user -> Rejected (404)
    const nonExistentConvRes = await makeRequest('/api/conversations', 'POST', {
      recipientId: crypto.randomUUID(),
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Starting conversation with nonexistent user returns 404', nonExistentConvRes.status === 404);

    // 3. Buyer 1 starts conversation with Farmer 1 -> Success (200 / 201)
    const startConvRes = await makeRequest('/api/conversations', 'POST', {
      recipientId: farmer1User.id,
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Buyer 1 starts direct conversation with Farmer 1', [200, 201].includes(startConvRes.status));
    conversationId = startConvRes.data?.data?.id;

    // 4. Idempotent check: starting conversation again returns existing conversation
    const reStartConvRes = await makeRequest('/api/conversations', 'POST', {
      recipientId: farmer1User.id,
    }, { Authorization: `Bearer ${buyer1Token}` });
    record(
      'Starting conversation again returns existing conversation (Idempotent)',
      [200, 201].includes(reStartConvRes.status) && reStartConvRes.data?.data?.id === conversationId
    );

    // 5. Fetch user conversations
    const buyerConvList = await makeRequest('/api/conversations', 'GET', null, {
      Authorization: `Bearer ${buyer1Token}`,
    });
    record(
      'Buyer 1 fetches conversations list with participant metadata',
      buyerConvList.status === 200 &&
        buyerConvList.data?.data?.some((c) => c.id === conversationId)
    );

    // -------------------------------------------------------------
    // PHASE 4: Real-Time Messaging & Room Delivery
    // -------------------------------------------------------------
    console.log('\n--- Phase 4: Real-Time Messaging & Socket Room Delivery ---');

    // Join conversation rooms on sockets
    farmer1Socket.emit('conversation:join', { conversationId });
    buyer1Socket.emit('conversation:join', { conversationId });

    // Wait a brief tick for room joining
    await new Promise((r) => setTimeout(r, 200));

    // Setup Socket listener on Farmer 1 for message:new
    let farmerReceivedMessagePromise = new Promise((resolve) => {
      farmer1Socket.once('message:new', (msg) => {
        resolve(msg);
      });
    });

    // Setup Socket listener on Farmer 1 for user-private room notification
    let farmerReceivedNotificationPromise = new Promise((resolve) => {
      farmer1Socket.once('notification:new', (notif) => {
        resolve(notif);
      });
    });

    // Buyer 1 sends message to Farmer 1
    const testMsgText = `Hello Farmer Ramesh, I am interested in purchasing 100 KG of your Alphonso Mangoes at ₹110/KG.`;
    const sendMsgRes = await makeRequest(`/api/conversations/${conversationId}/messages`, 'POST', {
      content: testMsgText,
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Buyer 1 sends message to Farmer 1', sendMsgRes.status === 201);
    const sentMessageId = sendMsgRes.data?.data?.id;

    // Wait for real-time socket events
    const [receivedMsg, receivedNotif] = await Promise.all([
      Promise.race([
        farmerReceivedMessagePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Socket message timeout')), 4000)),
      ]).catch((e) => null),
      Promise.race([
        farmerReceivedNotificationPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('Socket notification timeout')), 4000)),
      ]).catch((e) => null),
    ]);

    record(
      'Farmer 1 receives real-time message:new event over Socket.IO',
      receivedMsg !== null && receivedMsg.content === testMsgText,
      receivedMsg ? `Content: "${receivedMsg.content}"` : 'Timed out'
    );

    record(
      'Farmer 1 receives real-time notification:new (NEW_MESSAGE) over Socket.IO',
      receivedNotif !== null && receivedNotif.type === 'NEW_MESSAGE',
      receivedNotif ? `Type: ${receivedNotif.type}, Title: "${receivedNotif.title}"` : 'Timed out'
    );

    // Fetch messages in conversation
    const getMsgsRes = await makeRequest(`/api/conversations/${conversationId}/messages`, 'GET', null, {
      Authorization: `Bearer ${farmer1Token}`,
    });
    record(
      'Farmer 1 retrieves conversation message history',
      getMsgsRes.status === 200 &&
        getMsgsRes.data?.data?.messages?.some((m) => m.id === sentMessageId)
    );

    // -------------------------------------------------------------
    // PHASE 5: Strict Participant Isolation & Unauthorized Access Prevention
    // -------------------------------------------------------------
    console.log('\n--- Phase 5: Strict Participant Isolation & Unauthorized Access Prevention ---');

    // 1. Farmer 2 (unrelated user) attempts to fetch messages -> 403 Forbidden
    const unauthGetRes = await makeRequest(`/api/conversations/${conversationId}/messages`, 'GET', null, {
      Authorization: `Bearer ${farmer2Token}`,
    });
    record(
      'Non-participant cannot read private conversation messages (403 Forbidden)',
      unauthGetRes.status === 403,
      `Status: ${unauthGetRes.status}`
    );

    // 2. Farmer 2 attempts to send a message to the private conversation -> 403 Forbidden
    const unauthSendRes = await makeRequest(`/api/conversations/${conversationId}/messages`, 'POST', {
      content: 'I am an intruder trying to inject messages into your private deal!',
    }, { Authorization: `Bearer ${farmer2Token}` });
    record(
      'Non-participant cannot send messages to private conversation (403 Forbidden)',
      unauthSendRes.status === 403,
      `Status: ${unauthSendRes.status}`
    );

    // 3. Farmer 2 attempts to mark private conversation as read -> 403 Forbidden
    const unauthReadRes = await makeRequest(`/api/conversations/${conversationId}/read`, 'PATCH', null, {
      Authorization: `Bearer ${farmer2Token}`,
    });
    record(
      'Non-participant cannot mark conversation as read (403 Forbidden)',
      unauthReadRes.status === 403,
      `Status: ${unauthReadRes.status}`
    );

    // 4. Farmer 2 attempts to join conversation socket room -> Emits error
    const farmer2Conn = await connectSocket(farmer2Token);
    const farmer2Socket = farmer2Conn.socket;
    let socketJoinErrorPromise = new Promise((resolve) => {
      farmer2Socket.once('error', (err) => resolve(err));
    });
    farmer2Socket.emit('conversation:join', { conversationId });

    const socketJoinError = await Promise.race([
      socketJoinErrorPromise,
      new Promise((r) => setTimeout(() => r(null), 1500)),
    ]);
    record(
      'Non-participant socket connection rejected from joining private room',
      socketJoinError !== null &&
        (socketJoinError.message?.includes('participant') ||
          socketJoinError.message?.includes('Access denied') ||
          socketJoinError.message?.includes('Unauthorized')),
      `Socket Error: ${socketJoinError?.message || 'Handled'}`
    );
    farmer2Socket.disconnect();

    // -------------------------------------------------------------
    // PHASE 6: End-to-End Business Event Notifications
    // -------------------------------------------------------------
    console.log('\n--- Phase 6: End-to-End Business Event Notifications ---');

    // 1. Trade Offer: Buyer 1 submits offer -> Farmer 1 receives NEW_OFFER notification
    const offerRes = await makeRequest('/api/offers', 'POST', {
      listingId,
      offeredPrice: 110,
      quantity: 100,
      message: 'Can you deliver by Monday?',
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Buyer 1 submits trade offer', offerRes.status === 201);
    offerId = offerRes.data?.data?.id;

    // Verify Farmer 1 received NEW_OFFER in database
    await new Promise((r) => setTimeout(r, 300));
    const farmerNotifsRes1 = await makeRequest('/api/notifications', 'GET', null, {
      Authorization: `Bearer ${farmer1Token}`,
    });
    const newOfferNotif = farmerNotifsRes1.data?.data?.notifications?.find(
      (n) => n.type === 'NEW_OFFER'
    );
    record(
      'Farmer 1 receives NEW_OFFER notification',
      Boolean(newOfferNotif),
      newOfferNotif ? `"${newOfferNotif.title}"` : 'Not found'
    );

    // 2. Offer Counter: Farmer 1 counters offer -> Buyer 1 receives COUNTER_OFFER notification
    const counterRes = await makeRequest(`/api/offers/${offerId}/counter`, 'PATCH', {
      counterPrice: 115,
      message: 'I can do ₹115/KG for Grade A mangoes.',
    }, { Authorization: `Bearer ${farmer1Token}` });
    record('Farmer 1 submits counteroffer', counterRes.status === 200);

    await new Promise((r) => setTimeout(r, 300));
    const buyerNotifsRes1 = await makeRequest('/api/notifications', 'GET', null, {
      Authorization: `Bearer ${buyer1Token}`,
    });
    const counterNotif = buyerNotifsRes1.data?.data?.notifications?.find(
      (n) => n.type === 'COUNTER_OFFER'
    );
    record(
      'Buyer 1 receives COUNTER_OFFER notification',
      Boolean(counterNotif),
      counterNotif ? `"${counterNotif.title}"` : 'Not found'
    );

    // 3. Offer Acceptance: Buyer 1 accepts counteroffer -> Farmer 1 receives OFFER_ACCEPTED
    const acceptRes = await makeRequest(`/api/offers/${offerId}/accept`, 'PATCH', null, {
      Authorization: `Bearer ${buyer1Token}`,
    });
    record('Buyer 1 accepts counteroffer', acceptRes.status === 200);

    await new Promise((r) => setTimeout(r, 300));
    const farmerNotifsRes2 = await makeRequest('/api/notifications', 'GET', null, {
      Authorization: `Bearer ${farmer1Token}`,
    });
    const acceptedNotif = farmerNotifsRes2.data?.data?.notifications?.find(
      (n) => n.type === 'OFFER_ACCEPTED'
    );
    record(
      'Farmer 1 receives OFFER_ACCEPTED notification',
      Boolean(acceptedNotif),
      acceptedNotif ? `"${acceptedNotif.title}"` : 'Not found'
    );

    // 4. Order Confirmation: Buyer 1 creates order from accepted offer -> Both receive ORDER_CONFIRMED
    const orderRes = await makeRequest('/api/orders', 'POST', {
      offerId,
      shippingAddress: 'Plot 45, APMC Market Yard, Navi Mumbai, Maharashtra 400703',
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Buyer 1 creates order from accepted offer', orderRes.status === 201);
    orderId = orderRes.data?.data?.id;

    await new Promise((r) => setTimeout(r, 300));
    const [buyerNotifsRes2, farmerNotifsRes3] = await Promise.all([
      makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${buyer1Token}` }),
      makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${farmer1Token}` }),
    ]);

    const buyerOrderNotif = buyerNotifsRes2.data?.data?.notifications?.find(
      (n) => n.type === 'ORDER_CONFIRMED'
    );
    const farmerOrderNotif = farmerNotifsRes3.data?.data?.notifications?.find(
      (n) => n.type === 'ORDER_CONFIRMED'
    );
    record('Buyer 1 receives ORDER_CONFIRMED notification', Boolean(buyerOrderNotif));
    record('Farmer 1 receives ORDER_CONFIRMED notification', Boolean(farmerOrderNotif));

    // 5. Payment Settlement: Simulating payment verification
    // Generate valid test signature using Razorpay config test secret
    const razorpayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    const razorpayPaymentId = `pay_${crypto.randomBytes(8).toString('hex')}`;
    const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_mock_12345';
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(`${razorpayOrderId}|${razorpayPaymentId}`);
    const razorpaySignature = hmac.digest('hex');

    const paymentVerifyRes = await makeRequest('/api/payments/verify', 'POST', {
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    }, { Authorization: `Bearer ${buyer1Token}` });
    record('Simulate successful order payment verification', paymentVerifyRes.status === 200);

    await new Promise((r) => setTimeout(r, 300));
    const [buyerNotifsRes3, farmerNotifsRes4] = await Promise.all([
      makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${buyer1Token}` }),
      makeRequest('/api/notifications', 'GET', null, { Authorization: `Bearer ${farmer1Token}` }),
    ]);

    const buyerPaymentNotif = buyerNotifsRes3.data?.data?.notifications?.find(
      (n) => n.type === 'PAYMENT_SUCCESS'
    );
    const farmerPaymentNotif = farmerNotifsRes4.data?.data?.notifications?.find(
      (n) => n.type === 'PAYMENT_SUCCESS'
    );
    record('Buyer 1 receives PAYMENT_SUCCESS notification', Boolean(buyerPaymentNotif));
    record('Farmer 1 receives PAYMENT_SUCCESS notification', Boolean(farmerPaymentNotif));

    // 6. Delivery Tracking: Farmer dispatches order -> Buyer receives ORDER_SHIPPED
    const dispatchRes = await makeRequest(`/api/deliveries/${orderId}/dispatch`, 'POST', {
      trackingNumber: `FDX-TRK-${orderId.slice(0, 8).toUpperCase()}`,
      location: 'Nashik Dispatch Hub',
      note: 'Picked up by AgroExpress Logistics',
    }, { Authorization: `Bearer ${farmer1Token}` });
    record('Farmer 1 dispatches paid order', [200, 201].includes(dispatchRes.status));

    await new Promise((r) => setTimeout(r, 300));
    const buyerNotifsRes4 = await makeRequest('/api/notifications', 'GET', null, {
      Authorization: `Bearer ${buyer1Token}`,
    });
    const shippedNotif = buyerNotifsRes4.data?.data?.notifications?.find(
      (n) => n.type === 'ORDER_SHIPPED'
    );
    record('Buyer 1 receives ORDER_SHIPPED notification', Boolean(shippedNotif));

    // Admin provisions and completes delivery to DELIVERED
    const adminEmail = `m9_admin_${timestamp}@farmdex.test`;
    await provisionAdmin({
      email: adminEmail,
      password: 'AdminFarmDex2026!',
      name: 'M9 Delivery Admin',
      phone: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
    });
    const loginAdminRes = await makeRequest('/api/auth/login', 'POST', {
      email: adminEmail,
      password: 'AdminFarmDex2026!',
    });
    adminToken = loginAdminRes.data?.data?.token;

    const deliverRes = await makeRequest(`/api/deliveries/${orderId}/status`, 'PATCH', {
      status: 'DELIVERED',
      location: 'APMC Market Yard, Navi Mumbai',
      note: 'Delivered to buyer warehouse',
    }, { Authorization: `Bearer ${adminToken}` });
    record('Order status updated to DELIVERED', deliverRes.status === 200);

    await new Promise((r) => setTimeout(r, 300));
    const buyerNotifsRes5 = await makeRequest('/api/notifications', 'GET', null, {
      Authorization: `Bearer ${buyer1Token}`
    });
    const deliveredNotif = buyerNotifsRes5.data?.data?.notifications?.find(
      (n) => n.type === 'ORDER_DELIVERED'
    );
    record('Buyer 1 receives ORDER_DELIVERED notification', Boolean(deliveredNotif));

    // -------------------------------------------------------------
    // PHASE 7: Notification Isolation & Security
    // -------------------------------------------------------------
    console.log('\n--- Phase 7: Notification Isolation & Security ---');

    const targetNotifId = buyerOrderNotif?.id;

    // 1. Farmer 2 attempts to mark Buyer 1's notification as read -> 403 Forbidden
    if (targetNotifId) {
      const intruderReadRes = await makeRequest(`/api/notifications/${targetNotifId}/read`, 'PATCH', null, {
        Authorization: `Bearer ${farmer2Token}`,
      });
      record(
        'User cannot mark another user\'s notification as read (403 Forbidden)',
        intruderReadRes.status === 403,
        `Status: ${intruderReadRes.status}`
      );
    }

    // 2. Buyer 1 marks their own notification as read -> 200 Success
    if (targetNotifId) {
      const buyerReadRes = await makeRequest(`/api/notifications/${targetNotifId}/read`, 'PATCH', null, {
        Authorization: `Bearer ${buyer1Token}`,
      });
      record(
        'Buyer 1 successfully marks their own notification as read',
        buyerReadRes.status === 200 && buyerReadRes.data?.data?.isRead === true
      );
    }

    // 3. Buyer 1 marks all notifications as read -> 200 Success
    const markAllRes = await makeRequest('/api/notifications/read-all', 'PATCH', null, {
      Authorization: `Bearer ${buyer1Token}`,
    });
    record(
      'Buyer 1 marks all remaining notifications as read',
      markAllRes.status === 200 && markAllRes.data?.data?.unreadCount === 0
    );

  } catch (err) {
    console.error('Unexpected test execution error:', err);
    record('Unexpected test runner exception', false, err.message);
  } finally {
    if (farmer1Socket) farmer1Socket.disconnect();
    if (buyer1Socket) buyer1Socket.disconnect();

    console.log('\n===========================================================');
    console.log(`📊 MILESTONE 9 TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
    console.log('===========================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
