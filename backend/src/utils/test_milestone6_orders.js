import http from 'http';
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

async function runOrdersTestSuite() {
  console.log('====================================================');
  console.log('📦 FARMDEX MILESTONE 6: ORDERS & CHECKOUT TEST SUITE');
  console.log('====================================================\n');

  const results = [];
  const record = (name, passed, details = '') => {
    results.push({ name, passed, details });
    console.log(`${passed ? '✅ PASS' : '❌ FAIL'} | ${name} ${details ? '-> ' + details : ''}`);
  };

  const ts = Date.now();
  const farmerEmail = `m6_farmer_${ts}@farmdex.com`;
  const buyer1Email = `m6_buyer1_${ts}@farmdex.com`;
  const buyer2Email = `m6_buyer2_${ts}@farmdex.com`;
  const testPassword = 'Password123!';

  try {
    // ----------------------------------------------------
    // SETUP: Register test actors
    // ----------------------------------------------------
    const regFarmer = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Dev',
      email: farmerEmail,
      password: testPassword,
      phone: `+9191${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'FARMER',
    });
    const farmerToken = regFarmer.data?.data?.token;

    const regBuyer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer One',
      email: buyer1Email,
      password: testPassword,
      phone: `+9192${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'BUYER',
    });
    const buyer1Token = regBuyer1.data?.data?.token;

    const regBuyer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer Two',
      email: buyer2Email,
      password: testPassword,
      phone: `+9193${Math.floor(10000000 + Math.random() * 90000000)}`,
      role: 'BUYER',
    });
    const buyer2Token = regBuyer2.data?.data?.token;

    const farmerHeaders = { Authorization: `Bearer ${farmerToken}` };
    const buyer1Headers = { Authorization: `Bearer ${buyer1Token}` };
    const buyer2Headers = { Authorization: `Bearer ${buyer2Token}` };

    record(
      '1a. Setup test actors (1 Farmer, 2 Buyers)',
      !!farmerToken && !!buyer1Token && !!buyer2Token
    );

    // Fetch category
    const catRes = await makeRequest('/api/categories', 'GET');
    const categoryId = catRes.data?.data?.[0]?.id;

    // Farmer creates produce listing with 100 kg stock @ ₹150/kg
    const listingRes = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Milestone 6 Organic Wheat',
        categoryId,
        quantity: 100,
        unit: 'KG',
        pricePerUnit: 150,
        location: 'Karnal, Haryana',
        isOrganic: true,
      },
      farmerHeaders
    );
    const listingId = listingRes.data?.data?.id;
    record('1b. Farmer creates produce listing (100 KG @ ₹150)', listingRes.status === 201 && !!listingId);

    // ----------------------------------------------------
    // TEST 2: Validation & Authorization Checks
    // ----------------------------------------------------
    // 2a. Unauthenticated POST /api/orders
    const unauthOrder = await makeRequest('/api/orders', 'POST', {
      offerId: '00000000-0000-0000-0000-000000000000',
      shippingAddress: '123 Market Road, Delhi',
    });
    record('2a. Unauthenticated POST /api/orders returns 401', unauthOrder.status === 401);

    // 2b. Non-buyer (FARMER) attempt to create order
    const farmerCreateOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: '00000000-0000-0000-0000-000000000000',
        shippingAddress: '123 Market Road, Delhi',
      },
      farmerHeaders
    );
    record('2b. Non-buyer role (FARMER) attempt returns 403', farmerCreateOrder.status === 403);

    // 2c. Non-existent offerId
    const nonExistentOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: '00000000-0000-0000-0000-000000000000',
        shippingAddress: '123 Market Road, Delhi',
      },
      buyer1Headers
    );
    record('2c. Non-existent offerId returns 404', nonExistentOrder.status === 404);

    // 2d. Missing/invalid shipping address
    const invalidAddressOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: '00000000-0000-0000-0000-000000000000',
        shippingAddress: '  ',
      },
      buyer1Headers
    );
    record('2d. Missing or short shipping address returns 400', invalidAddressOrder.status === 400);

    // ----------------------------------------------------
    // TEST 3: Offer State Eligibility (Only ACCEPTED allows checkout)
    // ----------------------------------------------------
    // Buyer 1 submits offer 1 (40 KG @ ₹130, status PENDING)
    const offer1Res = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 40,
        offeredPrice: 130,
        message: 'Offer 1 PENDING',
      },
      buyer1Headers
    );
    const offer1Id = offer1Res.data?.data?.id;

    // Attempt to checkout PENDING offer
    const orderPending = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer1Id,
        shippingAddress: 'Flat 402, Green Enclave, New Delhi - 110001',
      },
      buyer1Headers
    );
    record(
      '3a. Order on PENDING offer returns 400',
      orderPending.status === 400 && orderPending.data?.message?.includes('ACCEPTED')
    );

    // Farmer counters offer 1 (status becomes COUNTERED)
    await makeRequest(
      `/api/offers/${offer1Id}/counter`,
      'PATCH',
      {
        counterPrice: 140,
        message: 'Can do 140',
      },
      farmerHeaders
    );

    // Attempt to checkout COUNTERED offer
    const orderCountered = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer1Id,
        shippingAddress: 'Flat 402, Green Enclave, New Delhi - 110001',
      },
      buyer1Headers
    );
    record('3b. Order on COUNTERED offer returns 400', orderCountered.status === 400);

    // Buyer 1 accepts counteroffer (status becomes ACCEPTED: 40 KG @ ₹140)
    await makeRequest(`/api/offers/${offer1Id}/accept`, 'PATCH', null, buyer1Headers);

    // ----------------------------------------------------
    // TEST 4: Buyer Ownership Isolation
    // ----------------------------------------------------
    // Buyer 2 attempts to checkout Buyer 1's accepted offer
    const unauthorizedBuyerOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer1Id,
        shippingAddress: 'Different Address, Mumbai',
      },
      buyer2Headers
    );
    record(
      '4. Unauthorized Buyer 2 attempting to checkout Buyer 1 offer returns 403',
      unauthorizedBuyerOrder.status === 403
    );

    // ----------------------------------------------------
    // TEST 5: Successful Order Creation & Stock Reduction
    // ----------------------------------------------------
    const successfulOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer1Id,
        shippingAddress: 'Flat 402, Green Enclave, New Delhi - 110001',
      },
      buyer1Headers
    );
    const orderId = successfulOrder.data?.data?.id;
    const orderTotal = Number(successfulOrder.data?.data?.totalAmount);
    const expectedTotal = 40 * 140; // 5600

    record(
      '5a. Buyer 1 creates order from ACCEPTED offer (Status: 201)',
      successfulOrder.status === 201 && !!orderId && orderTotal === expectedTotal,
      `Order ID: ${orderId}, Total: ₹${orderTotal}`
    );

    record(
      '5b. Order items verified',
      successfulOrder.data?.data?.orderItems?.length === 1 &&
        Number(successfulOrder.data?.data?.orderItems[0]?.quantity) === 40 &&
        Number(successfulOrder.data?.data?.orderItems[0]?.pricePerUnit) === 140
    );

    // Verify listing inventory was reduced: 100 - 40 = 60 KG remaining
    const listingAfterOrder1 = await makeRequest(`/api/crop-listings/${listingId}`, 'GET');
    const remainingStock1 = Number(listingAfterOrder1.data?.data?.quantity);
    record(
      '5c. Crop listing inventory decremented safely (100 -> 60 KG)',
      remainingStock1 === 60 && listingAfterOrder1.data?.data?.status === 'ACTIVE',
      `Remaining Stock: ${remainingStock1} KG`
    );

    // ----------------------------------------------------
    // TEST 6: Duplicate Order Prevention
    // ----------------------------------------------------
    const duplicateOrder = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer1Id,
        shippingAddress: 'Flat 402, Green Enclave, New Delhi - 110001',
      },
      buyer1Headers
    );
    record(
      '6. Duplicate order creation on the same offer blocked (409 Conflict)',
      duplicateOrder.status === 409
    );

    // ----------------------------------------------------
    // TEST 7: Concurrent / Insufficient Stock Prevention & Stock Exhaustion
    // ----------------------------------------------------
    // Buyer 2 submits offer for 60 KG @ ₹145 on the listing (remaining stock is 60 KG)
    const offer2Res = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId,
        quantity: 60,
        offeredPrice: 145,
        message: 'Buying remaining 60 KG',
      },
      buyer2Headers
    );
    const offer2Id = offer2Res.data?.data?.id;
    // Farmer accepts offer 2
    await makeRequest(`/api/offers/${offer2Id}/accept`, 'PATCH', null, farmerHeaders);

    // Buyer 2 orders all remaining 60 KG
    const orderAllRemaining = await makeRequest(
      '/api/orders',
      'POST',
      {
        offerId: offer2Id,
        shippingAddress: 'Shop 12, APMC Market, Vashi, Navi Mumbai - 400703',
      },
      buyer2Headers
    );
    const order2Id = orderAllRemaining.data?.data?.id;
    record(
      '7a. Buyer 2 orders remaining 60 KG (Status: 201)',
      orderAllRemaining.status === 201 && !!order2Id
    );

    // Verify listing status transitioned to SOLD_OUT (Owner farmer view)
    const listingAfterOrder2 = await makeRequest(`/api/crop-listings/${listingId}`, 'GET', null, farmerHeaders);
    const remainingStock2 = Number(listingAfterOrder2.data?.data?.quantity);
    const statusAfterOrder2 = listingAfterOrder2.data?.data?.status;
    record(
      '7b. Listing quantity is 0 and status transitions to SOLD_OUT',
      remainingStock2 === 0 && statusAfterOrder2 === 'SOLD_OUT',
      `Stock: ${remainingStock2}, Status: ${statusAfterOrder2}`
    );

    // ----------------------------------------------------
    // TEST 8: Order History & Details APIs
    // ----------------------------------------------------
    // 8a. Buyer 1 order history
    const buyer1Orders = await makeRequest('/api/orders/my', 'GET', null, buyer1Headers);
    record(
      '8a. Buyer 1 GET /api/orders/my returns only Buyer 1 orders',
      buyer1Orders.status === 200 &&
        buyer1Orders.data?.data?.length === 1 &&
        buyer1Orders.data?.data?.[0]?.id === orderId
    );

    // 8b. Buyer 2 order history
    const buyer2Orders = await makeRequest('/api/orders/my', 'GET', null, buyer2Headers);
    record(
      '8b. Buyer 2 GET /api/orders/my returns only Buyer 2 orders',
      buyer2Orders.status === 200 &&
        buyer2Orders.data?.data?.length === 1 &&
        buyer2Orders.data?.data?.[0]?.id === order2Id
    );

    // 8c. Farmer incoming orders
    const farmerOrders = await makeRequest('/api/orders/farmer', 'GET', null, farmerHeaders);
    record(
      '8c. Farmer GET /api/orders/farmer returns all incoming orders on farmer listings',
      farmerOrders.status === 200 && farmerOrders.data?.data?.length === 2
    );

    // 8d. Order detail access by buyer and farmer
    const orderDetailBuyer = await makeRequest(`/api/orders/${orderId}`, 'GET', null, buyer1Headers);
    const orderDetailFarmer = await makeRequest(`/api/orders/${orderId}`, 'GET', null, farmerHeaders);
    record(
      '8d. Buyer and Farmer can both retrieve order details (GET /api/orders/:id)',
      orderDetailBuyer.status === 200 &&
        orderDetailFarmer.status === 200 &&
        orderDetailBuyer.data?.data?.id === orderId
    );

    // 8e. Tenant isolation: Unrelated Buyer 2 accessing Buyer 1's order returns 404
    const tenantIsolationOrder = await makeRequest(`/api/orders/${orderId}`, 'GET', null, buyer2Headers);
    record(
      '8e. Unrelated user GET /api/orders/:id returns 404 (Strict Tenant Isolation)',
      tenantIsolationOrder.status === 404
    );

    // Clean up test actors respecting foreign key constraints
    const testUsers = await prisma.user.findMany({
      where: { email: { in: [farmerEmail, buyer1Email, buyer2Email] } },
      select: { id: true },
    });
    const userIds = testUsers.map((u) => u.id);

    if (userIds.length > 0) {
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
    console.error('❌ Error during orders test execution:', err);
  } finally {
    await prisma.$disconnect();

    const passCount = results.filter((r) => r.passed).length;
    console.log('\n====================================================');
    console.log(`📊 MILESTONE 6 TEST SUMMARY: ${passCount} / ${results.length} PASSED`);
    console.log('====================================================\n');
    process.exit(passCount === results.length ? 0 : 1);
  }
}

runOrdersTestSuite();
