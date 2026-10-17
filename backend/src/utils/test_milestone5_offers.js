import http from 'http';
import dotenv from 'dotenv';
import prisma from '../config/db.js';

process.env.NODE_ENV = 'test';
dotenv.config();

const PORT = 5096; // Dedicated test port for M5 suite
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

async function runMilestone5Suite() {
  console.log('====================================================');
  console.log('🤝 FARMDEX MILESTONE 5: OFFERS & NEGOTIATION SUITE');
  console.log('====================================================\n');

  const { default: app } = await import('../app.js');
  server = app.listen(PORT);

  const testEmails = [
    'm5_farmer_1@farmdex.com',
    'm5_farmer_2@farmdex.com',
    'm5_buyer_1@farmdex.com',
    'm5_buyer_2@farmdex.com',
  ];

  // Pre-cleanup of any previous test records
  const existingUsers = await prisma.user.findMany({
    where: { email: { in: testEmails } },
    select: { id: true },
  });
  if (existingUsers.length > 0) {
    const userIds = existingUsers.map((u) => u.id);
    const farmerProfiles = await prisma.farmerProfile.findMany({
      where: { userId: { in: userIds } },
      select: { id: true },
    });
    const farmerProfileIds = farmerProfiles.map((f) => f.id);

    const testListings = await prisma.cropListing.findMany({
      where: { farmerProfileId: { in: farmerProfileIds } },
      select: { id: true },
    });
    const listingIds = testListings.map((l) => l.id);

    await prisma.offer.deleteMany({
      where: { OR: [{ buyerId: { in: userIds } }, { listingId: { in: listingIds } }] },
    });
    await prisma.cropListing.deleteMany({
      where: { id: { in: listingIds } },
    });
    await prisma.farm.deleteMany({
      where: { farmerProfileId: { in: farmerProfileIds } },
    });
    await prisma.user.deleteMany({
      where: { id: { in: userIds } },
    });
  }

  let passedCount = 0;
  let failedCount = 0;

  function record(title, condition, extraInfo = '') {
    if (condition) {
      passedCount++;
      console.log(`✅ PASS | ${title} ${extraInfo ? `-> ${extraInfo}` : ''}`);
    } else {
      failedCount++;
      console.error(`❌ FAIL | ${title} ${extraInfo ? `-> ${extraInfo}` : ''}`);
    }
  }

  try {
    // ----------------------------------------------------
    // 1. Setup Test Actors & Listings
    // ----------------------------------------------------
    // Farmer 1
    const regFarmer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Devraj',
      email: 'm5_farmer_1@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543301',
      role: 'FARMER',
    });
    const tokenFarmer1 = regFarmer1.data?.data?.token;
    const headersF1 = { Authorization: `Bearer ${tokenFarmer1}` };

    // Farmer 2
    const regFarmer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Gurpreet',
      email: 'm5_farmer_2@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543302',
      role: 'FARMER',
    });
    const tokenFarmer2 = regFarmer2.data?.data?.token;
    const headersF2 = { Authorization: `Bearer ${tokenFarmer2}` };

    // Buyer 1
    const regBuyer1 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer Rajesh Traders',
      email: 'm5_buyer_1@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543303',
      role: 'BUYER',
    });
    const tokenBuyer1 = regBuyer1.data?.data?.token;
    const headersB1 = { Authorization: `Bearer ${tokenBuyer1}` };

    // Buyer 2
    const regBuyer2 = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer Suresh Mandi',
      email: 'm5_buyer_2@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543304',
      role: 'BUYER',
    });
    const tokenBuyer2 = regBuyer2.data?.data?.token;
    const headersB2 = { Authorization: `Bearer ${tokenBuyer2}` };

    record('1a. Setup test actors (2 Farmers, 2 Buyers)', tokenFarmer1 && tokenFarmer2 && tokenBuyer1 && tokenBuyer2);

    // Get an active category
    const catRes = await makeRequest('/api/categories', 'GET');
    const category = catRes.data?.data?.[0];

    // Farmer 1 creates Active Listing (100 quintal @ ₹3,000)
    const activeListingRes = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'M5 Sharbati Wheat Prime',
        categoryId: category.id,
        quantity: 100,
        unit: 'quintal',
        pricePerUnit: 3000,
        location: 'Karnal, Haryana',
      },
      headersF1
    );
    const activeListing = activeListingRes.data?.data;
    record('1b. Farmer 1 creates active produce listing (100 quintal @ ₹3,000)', activeListingRes.status === 201 && activeListing?.id);

    // Farmer 1 creates Inactive Listing
    const inactiveListingRes = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'M5 Inactive Produce',
        categoryId: category.id,
        quantity: 50,
        unit: 'quintal',
        pricePerUnit: 2000,
      },
      headersF1
    );
    const inactiveListing = inactiveListingRes.data?.data;
    await makeRequest(`/api/crop-listings/${inactiveListing.id}/status`, 'PATCH', { status: 'INACTIVE' }, headersF1);

    // ----------------------------------------------------
    // 2. Access Control & Validation on Offer Creation
    // ----------------------------------------------------
    const unauthOffer = await makeRequest('/api/offers', 'POST', {
      listingId: activeListing.id,
      quantity: 20,
      offeredPrice: 2500,
    });
    record('2a. Unauthenticated POST /api/offers returns 401', unauthOffer.status === 401);

    const selfOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 20,
        offeredPrice: 2500,
      },
      headersF1 // Farmer 1 offering on own listing
    );
    record('2b. Farmer attempting to offer on own listing returns 400 or 403', [400, 403].includes(selfOffer.status));

    const farmerRoleOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 20,
        offeredPrice: 2500,
      },
      headersF2 // Farmer 2 (FARMER role)
    );
    record('2c. Non-buyer role (FARMER) attempt to place offer returns 403', farmerRoleOffer.status === 403);

    const nonExistentOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: '00000000-0000-0000-0000-000000000000',
        quantity: 20,
        offeredPrice: 2500,
      },
      headersB1
    );
    record('2d. Offer on non-existent listing returns 404', nonExistentOffer.status === 404);

    const inactiveOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: inactiveListing.id,
        quantity: 20,
        offeredPrice: 2500,
      },
      headersB1
    );
    record('2e. Offer on INACTIVE listing returns 400', inactiveOffer.status === 400);

    const negPriceOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 20,
        offeredPrice: -500,
      },
      headersB1
    );
    record('2f. Negative offeredPrice returns 400', negPriceOffer.status === 400);

    const overQtyOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 150, // exceeds 100 stock
        offeredPrice: 2800,
      },
      headersB1
    );
    record('2g. Offer quantity > available stock returns 400', overQtyOffer.status === 400);

    // ----------------------------------------------------
    // 3. Successful Offer Placement (PENDING)
    // ----------------------------------------------------
    const validOffer1 = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 50,
        offeredPrice: 2700,
        message: 'Initial buyer offer. Mandi delivery preferred.',
      },
      headersB1
    );
    const offer1 = validOffer1.data?.data;
    record(
      '3a. Buyer 1 creates valid offer (50 quintal @ ₹2,700, status PENDING)',
      validOffer1.status === 201 &&
        offer1?.id &&
        offer1.status === 'PENDING' &&
        Number(offer1.offeredPrice) === 2700
    );

    // Duplicate active offer block
    const dupOffer = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 20,
        offeredPrice: 2800,
      },
      headersB1
    );
    record('3b. Duplicate active offer by same buyer on same listing returns 400', dupOffer.status === 400);

    // Buyer 2 creates a separate offer
    const validOffer2 = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 30,
        offeredPrice: 2800,
        message: 'Buyer 2 offer.',
      },
      headersB2
    );
    const offer2 = validOffer2.data?.data;
    record(
      '3c. Buyer 2 creates separate offer on same listing (30 quintal @ ₹2,800)',
      validOffer2.status === 201 && offer2?.id && offer2.status === 'PENDING'
    );

    // ----------------------------------------------------
    // 4. Offer Retrieval & Tenant Isolation
    // ----------------------------------------------------
    const buyer1Offers = await makeRequest('/api/offers/my', 'GET', null, headersB1);
    record(
      '4a. Buyer 1 GET /api/offers/my returns only Buyer 1 offers',
      buyer1Offers.status === 200 &&
        buyer1Offers.data?.data?.length === 1 &&
        buyer1Offers.data?.data?.[0].id === offer1.id
    );

    const farmer1Offers = await makeRequest('/api/offers/farmer', 'GET', null, headersF1);
    record(
      '4b. Farmer 1 GET /api/offers/farmer returns both incoming buyer offers',
      farmer1Offers.status === 200 &&
        farmer1Offers.data?.data?.length === 2 &&
        farmer1Offers.data?.data?.some((o) => o.id === offer1.id) &&
        farmer1Offers.data?.data?.some((o) => o.id === offer2.id)
    );

    const farmer2Offers = await makeRequest('/api/offers/farmer', 'GET', null, headersF2);
    record(
      '4c. Farmer 2 GET /api/offers/farmer returns 0 (Strict owner isolation)',
      farmer2Offers.status === 200 && farmer2Offers.data?.data?.length === 0
    );

    const listingOffersF1 = await makeRequest(`/api/offers/listing/${activeListing.id}`, 'GET', null, headersF1);
    record(
      '4d. Farmer 1 GET /api/offers/listing/:id sees all offers on listing',
      listingOffersF1.status === 200 && listingOffersF1.data?.data?.length === 2
    );

    const listingOffersB1 = await makeRequest(`/api/offers/listing/${activeListing.id}`, 'GET', null, headersB1);
    record(
      '4e. Buyer 1 GET /api/offers/listing/:id sees only their own offer',
      listingOffersB1.status === 200 &&
        listingOffersB1.data?.data?.length === 1 &&
        listingOffersB1.data?.data?.[0].id === offer1.id
    );

    const unauthDetail = await makeRequest(`/api/offers/${offer1.id}`, 'GET', null, headersF2);
    record('4f. Unrelated Farmer 2 GET /api/offers/:id returns 404 (Isolation)', unauthDetail.status === 404);

    // ----------------------------------------------------
    // 5. Counteroffer Flow
    // ----------------------------------------------------
    // Buyer cannot counter their own pending offer
    const buyerCounterPending = await makeRequest(
      `/api/offers/${offer1.id}/counter`,
      'PATCH',
      { counterPrice: 2850 },
      headersB1
    );
    record('5a. Buyer cannot counter their own PENDING offer (returns 403)', buyerCounterPending.status === 403);

    // Farmer 1 counters Buyer 1: ₹2,900
    const farmerCounterRes = await makeRequest(
      `/api/offers/${offer1.id}/counter`,
      'PATCH',
      {
        counterPrice: 2900,
        message: 'Can supply at ₹2,900/quintal with immediate dispatch.',
      },
      headersF1
    );
    record(
      '5b. Farmer 1 counters Buyer 1 offer (₹2,900, status becomes COUNTERED)',
      farmerCounterRes.status === 200 &&
        farmerCounterRes.data?.data?.status === 'COUNTERED' &&
        Number(farmerCounterRes.data?.data?.offeredPrice) === 2900
    );

    // ----------------------------------------------------
    // 6. Buyer Re-Counter & Negotiation Cycle
    // ----------------------------------------------------
    // Farmer cannot accept their own counteroffer
    const farmerAcceptOwnCounter = await makeRequest(`/api/offers/${offer1.id}/accept`, 'PATCH', null, headersF1);
    record('6a. Farmer cannot accept their own COUNTERED offer (returns 403)', farmerAcceptOwnCounter.status === 403);

    // Buyer 1 re-counters back: ₹2,850
    const buyerReCounter = await makeRequest(
      `/api/offers/${offer1.id}/counter`,
      'PATCH',
      {
        counterPrice: 2850,
        message: 'Can we meet in the middle at ₹2,850?',
      },
      headersB1
    );
    record(
      '6b. Buyer 1 re-counters farmer (₹2,850, status cycles back to PENDING)',
      buyerReCounter.status === 200 &&
        buyerReCounter.data?.data?.status === 'PENDING' &&
        Number(buyerReCounter.data?.data?.offeredPrice) === 2850
    );

    // Farmer 1 counters again: ₹2,880
    const farmerFinalCounter = await makeRequest(
      `/api/offers/${offer1.id}/counter`,
      'PATCH',
      { counterPrice: 2880, message: 'Final agreed price ₹2,880.' },
      headersF1
    );
    record(
      '6c. Farmer 1 counters with ₹2,880 (status COUNTERED)',
      farmerFinalCounter.status === 200 && farmerFinalCounter.data?.data?.status === 'COUNTERED'
    );

    // ----------------------------------------------------
    // 7. Offer Acceptance & Terminal Safeguards
    // ----------------------------------------------------
    const buyerAccept = await makeRequest(`/api/offers/${offer1.id}/accept`, 'PATCH', null, headersB1);
    record(
      '7a. Buyer 1 accepts counteroffer (status becomes ACCEPTED)',
      buyerAccept.status === 200 && buyerAccept.data?.data?.status === 'ACCEPTED'
    );

    // Terminal state locks
    const reAccept = await makeRequest(`/api/offers/${offer1.id}/accept`, 'PATCH', null, headersF1);
    record('7b. Attempting to accept already ACCEPTED offer returns 400', reAccept.status === 400);

    const reCounter = await makeRequest(`/api/offers/${offer1.id}/counter`, 'PATCH', { counterPrice: 3000 }, headersF1);
    record('7c. Attempting to counter already ACCEPTED offer returns 400', reCounter.status === 400);

    const reCancel = await makeRequest(`/api/offers/${offer1.id}/cancel`, 'PATCH', null, headersB1);
    record('7d. Attempting to cancel already ACCEPTED offer returns 400', reCancel.status === 400);

    // ----------------------------------------------------
    // 8. Offer Rejection Flow
    // ----------------------------------------------------
    const farmerReject = await makeRequest(
      `/api/offers/${offer2.id}/reject`,
      'PATCH',
      { reason: 'Batch already committed to another buyer.' },
      headersF1
    );
    record(
      '8a. Farmer 1 rejects Buyer 2 offer with reason (status becomes REJECTED)',
      farmerReject.status === 200 && farmerReject.data?.data?.status === 'REJECTED'
    );

    const reReject = await makeRequest(`/api/offers/${offer2.id}/reject`, 'PATCH', null, headersF1);
    record('8b. Attempting to reject already REJECTED offer returns 400', reReject.status === 400);

    // ----------------------------------------------------
    // 9. Offer Cancellation Flow (Buyer only)
    // ----------------------------------------------------
    // Buyer 2 creates a fresh offer (since previous was rejected)
    const freshOfferRes = await makeRequest(
      '/api/offers',
      'POST',
      {
        listingId: activeListing.id,
        quantity: 15,
        offeredPrice: 2850,
      },
      headersB2
    );
    const offer3 = freshOfferRes.data?.data;
    record('9a. Buyer 2 places new offer after previous was resolved', freshOfferRes.status === 201 && offer3?.id);

    // Farmer cannot cancel buyer's offer
    const farmerCancel = await makeRequest(`/api/offers/${offer3.id}/cancel`, 'PATCH', null, headersF1);
    record('9b. Farmer attempting to cancel buyer offer returns 403', farmerCancel.status === 403);

    // Buyer cancels own offer
    const buyerCancel = await makeRequest(`/api/offers/${offer3.id}/cancel`, 'PATCH', null, headersB2);
    record(
      '9c. Buyer 2 cancels own offer (status becomes CANCELLED)',
      buyerCancel.status === 200 && buyerCancel.data?.data?.status === 'CANCELLED'
    );

    // Cleanup test records
    await prisma.offer.deleteMany({
      where: { id: { in: [offer1.id, offer2.id, offer3.id] } },
    });
    await prisma.cropListing.deleteMany({
      where: { id: { in: [activeListing.id, inactiveListing.id] } },
    });
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });
  } catch (err) {
    console.error('Unhandled test suite exception:', err);
    failedCount++;
  } finally {
    if (server) {
      server.close();
    }
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log('📊 MILESTONE 5 TEST SUITE SUMMARY RESULTS');
  console.log('====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED     : ${passedCount}`);
  console.log(`FAILED     : ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMilestone5Suite();
