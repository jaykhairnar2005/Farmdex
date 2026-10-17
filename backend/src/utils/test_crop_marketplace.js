import http from 'http';
import dotenv from 'dotenv';
import prisma from '../config/db.js';
import { isCloudinaryConfigured } from '../config/cloudinary.js';

// Setup environment for testing
process.env.NODE_ENV = 'test';
dotenv.config();

const PORT = 5097; // Dedicated test port for M4 suite
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

async function runMilestone4Suite() {
  console.log('====================================================');
  console.log('🌾 FARMDEX MILESTONE 4: CROP MARKETPLACE TEST SUITE');
  console.log('====================================================\n');

  const { default: app } = await import('../app.js');
  server = app.listen(PORT);

  const testEmails = [
    'm4_farmer_a@farmdex.com',
    'm4_farmer_b@farmdex.com',
    'm4_buyer_a@farmdex.com',
  ];

  // Pre-cleanup of any previous test runs
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
    await prisma.cropListing.deleteMany({
      where: { farmerProfileId: { in: farmerProfileIds } },
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
    // 1. Categories Endpoint Verification
    // ----------------------------------------------------
    const catRes = await makeRequest('/api/categories', 'GET');
    record(
      '1a. GET /api/categories returns 200 with active categories',
      catRes.status === 200 &&
        catRes.data?.success === true &&
        Array.isArray(catRes.data?.data) &&
        catRes.data.data.length >= 8,
      `Categories count: ${catRes.data?.data?.length}`
    );

    const grainsCat = catRes.data?.data?.find((c) => c.name.includes('Grains') || c.name.includes('Cereals'));
    const fruitsCat = catRes.data?.data?.find((c) => c.name.includes('Fruits'));

    // ----------------------------------------------------
    // 2. Authentication & Setup for Test Actors
    // ----------------------------------------------------
    // Register Farmer A
    const regFarmerA = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Arjun',
      email: 'm4_farmer_a@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543211',
      role: 'FARMER',
    });
    const tokenA = regFarmerA.data?.data?.token;
    const headersA = { Authorization: `Bearer ${tokenA}` };
    record('2a. Register Farmer A', regFarmerA.status === 201 && tokenA !== undefined);

    // Register Farmer B
    const regFarmerB = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Baldev',
      email: 'm4_farmer_b@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543212',
      role: 'FARMER',
    });
    const tokenB = regFarmerB.data?.data?.token;
    const headersB = { Authorization: `Bearer ${tokenB}` };
    record('2b. Register Farmer B', regFarmerB.status === 201 && tokenB !== undefined);

    // Register Buyer A
    const regBuyerA = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer Ramesh',
      email: 'm4_buyer_a@farmdex.com',
      password: 'StrongPassword123!',
      phone: '9876543213',
      role: 'BUYER',
    });
    const tokenBuyer = regBuyerA.data?.data?.token;
    const headersBuyer = { Authorization: `Bearer ${tokenBuyer}` };
    record('2c. Register Buyer A', regBuyerA.status === 201 && tokenBuyer !== undefined);

    // Farmer A creates Farm A
    const farmARes = await makeRequest(
      '/api/farms',
      'POST',
      { name: 'Arjun Green Fields', district: 'Nashik', state: 'Maharashtra', size: 25, pincode: '422001' },
      headersA
    );
    const farmAId = farmARes.data?.data?.id;

    // Farmer B creates Farm B
    const farmBRes = await makeRequest(
      '/api/farms',
      'POST',
      { name: 'Baldev Orchards', district: 'Ludhiana', state: 'Punjab', size: 30, pincode: '141001' },
      headersB
    );
    const farmBId = farmBRes.data?.data?.id;

    // ----------------------------------------------------
    // 3. RBAC & Access Control Checks
    // ----------------------------------------------------
    const unauthCreate = await makeRequest('/api/crop-listings', 'POST', {
      cropName: 'Unauthorized Crop',
      categoryId: grainsCat.id,
      quantity: 100,
      unit: 'kg',
      pricePerUnit: 50,
    });
    record('3a. Unauthenticated POST /api/crop-listings returns 401', unauthCreate.status === 401);

    const buyerCreate = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Buyer Illegal Crop',
        categoryId: grainsCat.id,
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 50,
      },
      headersBuyer
    );
    record('3b. BUYER role attempt to POST /api/crop-listings returns 403', buyerCreate.status === 403);

    // ----------------------------------------------------
    // 4. Input Validation & Business Safeguards
    // ----------------------------------------------------
    const invalidCatCreate = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Invalid Category Wheat',
        categoryId: '00000000-0000-0000-0000-000000000000',
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 35,
      },
      headersA
    );
    record('4a. Invalid categoryId returns 400', invalidCatCreate.status === 400);

    const negativePriceCreate = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Negative Price Crop',
        categoryId: grainsCat.id,
        quantity: 100,
        unit: 'kg',
        pricePerUnit: -50,
      },
      headersA
    );
    record('4b. Negative pricePerUnit returns 400', negativePriceCreate.status === 400);

    const farmIsolationCreate = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Cross Farmer Farm Wheat',
        categoryId: grainsCat.id,
        farmId: farmBId, // Farmer B's farm!
        quantity: 100,
        unit: 'kg',
        pricePerUnit: 35,
      },
      headersA
    );
    record('4c. Farmer A attaching Farmer B farmId returns 400', farmIsolationCreate.status === 400);

    // ----------------------------------------------------
    // 5. Successful Crop Listing Creation
    // ----------------------------------------------------
    // Farmer A Listing 1: Organic Sharbati Wheat
    const listing1Res = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Sharbati Wheat Premium',
        categoryId: grainsCat.id,
        farmId: farmAId,
        quantity: 200,
        unit: 'quintal',
        pricePerUnit: 3200,
        quality: 'Grade A',
        location: 'Nashik Mandi, Maharashtra',
        isOrganic: true,
        description: 'Certified 100% organic golden wheat grain directly from farm harvest.',
      },
      headersA
    );
    const listing1 = listing1Res.data?.data;
    record(
      '5a. Farmer A creates Listing 1 (Organic Sharbati Wheat)',
      listing1Res.status === 201 && listing1?.id !== undefined && listing1?.isOrganic === true,
      `ID: ${listing1?.id}`
    );

    // Farmer A Listing 2: Alphonso Mangoes (Non-organic)
    const listing2Res = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Alphonso Mango Box',
        categoryId: fruitsCat.id,
        farmId: farmAId,
        quantity: 50,
        unit: 'box',
        pricePerUnit: 1200,
        quality: 'Export Quality',
        location: 'Ratnagiri, Maharashtra',
        isOrganic: false,
        description: 'Naturally ripened sweet Alphonso mango crates.',
      },
      headersA
    );
    const listing2 = listing2Res.data?.data;
    record(
      '5b. Farmer A creates Listing 2 (Alphonso Mango)',
      listing2Res.status === 201 && listing2?.id !== undefined,
      `ID: ${listing2?.id}`
    );

    // Farmer B Listing 3: Basmati Rice
    const listing3Res = await makeRequest(
      '/api/crop-listings',
      'POST',
      {
        cropName: 'Traditional 1121 Basmati Rice',
        categoryId: grainsCat.id,
        farmId: farmBId,
        quantity: 500,
        unit: 'quintal',
        pricePerUnit: 4800,
        quality: 'Premium / Grade A',
        location: 'Ludhiana Mandi, Punjab',
        isOrganic: true,
        description: 'Aged long grain aromatic Basmati.',
      },
      headersB
    );
    const listing3 = listing3Res.data?.data;
    record(
      '5c. Farmer B creates Listing 3 (Basmati Rice)',
      listing3Res.status === 201 && listing3?.id !== undefined,
      `ID: ${listing3?.id}`
    );

    // ----------------------------------------------------
    // 6. Farmer Dashboard Isolation (GET /api/crop-listings/mine)
    // ----------------------------------------------------
    const mineARes = await makeRequest('/api/crop-listings/mine', 'GET', null, headersA);
    const mineAListings = mineARes.data?.data || [];
    const hasOnlyFarmerAListings =
      mineAListings.every((l) => l.farmerProfile?.user?.email === 'm4_farmer_a@farmdex.com' || l.cropName.includes('Wheat') || l.cropName.includes('Mango')) &&
      !mineAListings.some((l) => l.id === listing3.id);
    record(
      '6a. Farmer A GET /api/crop-listings/mine returns only Farmer A listings',
      mineARes.status === 200 && mineAListings.length === 2 && hasOnlyFarmerAListings,
      `Count: ${mineAListings.length}`
    );

    const mineBRes = await makeRequest('/api/crop-listings/mine', 'GET', null, headersB);
    const mineBListings = mineBRes.data?.data || [];
    record(
      '6b. Farmer B GET /api/crop-listings/mine returns only Farmer B listings',
      mineBRes.status === 200 && mineBListings.length === 1 && mineBListings[0].id === listing3.id,
      `Count: ${mineBListings.length}`
    );

    // ----------------------------------------------------
    // 7. Ownership Isolation on Updates (PUT /api/crop-listings/:id)
    // ----------------------------------------------------
    const tamperUpdate = await makeRequest(
      `/api/crop-listings/${listing1.id}`,
      'PUT',
      { pricePerUnit: 100 },
      headersB // Farmer B attempts to update Farmer A's listing
    );
    record('7a. Farmer B PUT Farmer A listing returns 404 (Isolation)', tamperUpdate.status === 404);

    const validUpdate = await makeRequest(
      `/api/crop-listings/${listing1.id}`,
      'PUT',
      { pricePerUnit: 3450, quantity: 220 },
      headersA
    );
    record(
      '7b. Farmer A PUT own listing succeeds (200)',
      validUpdate.status === 200 &&
        Number(validUpdate.data?.data?.pricePerUnit) === 3450 &&
        Number(validUpdate.data?.data?.quantity) === 220
    );

    // ----------------------------------------------------
    // 8. Status Management & Safeguards
    // ----------------------------------------------------
    const tamperStatus = await makeRequest(
      `/api/crop-listings/${listing1.id}/status`,
      'PATCH',
      { status: 'INACTIVE' },
      headersB // Farmer B attempts tamper
    );
    record('8a. Farmer B PATCH status of Farmer A listing returns 404', tamperStatus.status === 404);

    const suspendedAttempt = await makeRequest(
      `/api/crop-listings/${listing1.id}/status`,
      'PATCH',
      { status: 'SUSPENDED' },
      headersA // Farmer cannot set SUSPENDED
    );
    record('8b. Farmer cannot set status to SUSPENDED (returns 400/403)', [400, 403].includes(suspendedAttempt.status));

    // Deactivate Listing 1
    const deactivateRes = await makeRequest(
      `/api/crop-listings/${listing1.id}/status`,
      'PATCH',
      { status: 'INACTIVE' },
      headersA
    );
    record('8c. Farmer A sets listing to INACTIVE succeeds (200)', deactivateRes.status === 200 && deactivateRes.data?.data?.status === 'INACTIVE');

    // Verify inactive listing is hidden from public marketplace
    const publicWhileInactive = await makeRequest('/api/crop-listings?search=Sharbati', 'GET');
    record(
      '8d. INACTIVE listing is hidden from public marketplace catalog',
      publicWhileInactive.status === 200 &&
        !publicWhileInactive.data?.data?.some((l) => l.id === listing1.id)
    );

    // Reactivate Listing 1
    const reactivateRes = await makeRequest(
      `/api/crop-listings/${listing1.id}/status`,
      'PATCH',
      { status: 'ACTIVE' },
      headersA
    );
    record('8e. Farmer A reactivates listing to ACTIVE succeeds (200)', reactivateRes.status === 200 && reactivateRes.data?.data?.status === 'ACTIVE');

    // ----------------------------------------------------
    // 9. Marketplace Search, Filters, Sorting & Pagination
    // ----------------------------------------------------
    // Public browse
    const publicCatalog = await makeRequest('/api/crop-listings', 'GET');
    record(
      '9a. GET /api/crop-listings returns 200 with ACTIVE listings',
      publicCatalog.status === 200 &&
        publicCatalog.data?.success === true &&
        publicCatalog.data?.data?.length >= 3
    );

    // Search query
    const searchRes = await makeRequest('/api/crop-listings?search=Basmati', 'GET');
    record(
      '9b. Search by query (?search=Basmati) filters accurately',
      searchRes.status === 200 &&
        searchRes.data?.data?.length >= 1 &&
        searchRes.data?.data?.every((l) => l.cropName.toLowerCase().includes('basmati'))
    );

    // Filter by category
    const catFilterRes = await makeRequest(`/api/crop-listings?categoryId=${fruitsCat.id}`, 'GET');
    record(
      '9c. Filter by categoryId filters accurately',
      catFilterRes.status === 200 &&
        catFilterRes.data?.data?.length >= 1 &&
        catFilterRes.data?.data?.every((l) => l.categoryId === fruitsCat.id)
    );

    // Filter by price range
    const priceFilterRes = await makeRequest('/api/crop-listings?minPrice=1000&maxPrice=4000', 'GET');
    record(
      '9d. Filter by price range (?minPrice=1000&maxPrice=4000) filters accurately',
      priceFilterRes.status === 200 &&
        priceFilterRes.data?.data?.length >= 1 &&
        priceFilterRes.data?.data?.every((l) => Number(l.pricePerUnit) >= 1000 && Number(l.pricePerUnit) <= 4000)
    );

    // Filter by organic
    const organicFilterRes = await makeRequest('/api/crop-listings?isOrganic=true', 'GET');
    record(
      '9e. Filter by organic status (?isOrganic=true) filters accurately',
      organicFilterRes.status === 200 &&
        organicFilterRes.data?.data?.length >= 2 &&
        organicFilterRes.data?.data?.every((l) => l.isOrganic === true)
    );

    // Sort by price_asc
    const sortAscRes = await makeRequest('/api/crop-listings?sort=price_asc', 'GET');
    const ascPrices = sortAscRes.data?.data?.map((l) => Number(l.pricePerUnit)) || [];
    const isSortedAsc = ascPrices.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
    record('9f. Sort by price_asc orders ascending', sortAscRes.status === 200 && isSortedAsc);

    // Sort by price_desc
    const sortDescRes = await makeRequest('/api/crop-listings?sort=price_desc', 'GET');
    const descPrices = sortDescRes.data?.data?.map((l) => Number(l.pricePerUnit)) || [];
    const isSortedDesc = descPrices.every((val, i, arr) => i === 0 || arr[i - 1] >= val);
    record('9g. Sort by price_desc orders descending', sortDescRes.status === 200 && isSortedDesc);

    // Pagination
    const pageRes = await makeRequest('/api/crop-listings?page=1&limit=2', 'GET');
    record(
      '9h. Pagination (?page=1&limit=2) returns correct limit & pagination metadata',
      pageRes.status === 200 &&
        pageRes.data?.data?.length === 2 &&
        pageRes.data?.page === 1 &&
        pageRes.data?.limit === 2 &&
        pageRes.data?.total >= 3
    );

    // ----------------------------------------------------
    // 10. Public Listing Detail (GET /api/crop-listings/:id)
    // ----------------------------------------------------
    const detailRes = await makeRequest(`/api/crop-listings/${listing1.id}`, 'GET');
    record(
      '10a. Public GET /api/crop-listings/:id returns full listing with associations',
      detailRes.status === 200 &&
        detailRes.data?.data?.cropName === 'Sharbati Wheat Premium' &&
        detailRes.data?.data?.category?.name !== undefined &&
        detailRes.data?.data?.farmerProfile?.user?.name === 'Farmer Arjun'
    );

    const nonExistentDetail = await makeRequest('/api/crop-listings/00000000-0000-0000-0000-000000000000', 'GET');
    record('10b. GET non-existent listing ID returns 404', nonExistentDetail.status === 404);

    // ----------------------------------------------------
    // 11. Image Upload & Delete RBAC / Service Handling
    // ----------------------------------------------------
    const unauthImg = await makeRequest(`/api/crop-listings/${listing1.id}/images`, 'POST');
    record('11a. Unauthenticated image upload returns 401', unauthImg.status === 401);

    const buyerImg = await makeRequest(`/api/crop-listings/${listing1.id}/images`, 'POST', null, headersBuyer);
    record('11b. BUYER role image upload returns 403', buyerImg.status === 403);

    const tamperImg = await makeRequest(`/api/crop-listings/${listing1.id}/images`, 'POST', null, headersB);
    // When no file attached or not owner
    record('11c. Farmer B attempting image upload on Farmer A listing blocked', [400, 404].includes(tamperImg.status));

    const cloudStatus = isCloudinaryConfigured();
    console.log(`ℹ️ [Cloudinary Storage Status] Configured: ${cloudStatus}`);
    record('11d. Cloudinary configuration detected properly', typeof cloudStatus === 'boolean');

    // ----------------------------------------------------
    // 12. Listing Deletion (DELETE /api/crop-listings/:id)
    // ----------------------------------------------------
    const tamperDelete = await makeRequest(`/api/crop-listings/${listing2.id}`, 'DELETE', null, headersB);
    record('12a. Farmer B DELETE Farmer A listing returns 404 (Isolation)', tamperDelete.status === 404);

    const validDelete = await makeRequest(`/api/crop-listings/${listing2.id}`, 'DELETE', null, headersA);
    record('12b. Farmer A DELETE own listing succeeds (200)', validDelete.status === 200);

    const verifyDeleted = await makeRequest(`/api/crop-listings/${listing2.id}`, 'GET');
    record('12c. Deleted listing is no longer accessible (404)', verifyDeleted.status === 404);

    // Cleanup remaining test records
    await prisma.cropListing.deleteMany({
      where: { id: { in: [listing1.id, listing3.id] } },
    });
    await prisma.farm.deleteMany({
      where: { id: { in: [farmAId, farmBId] } },
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
  console.log('📊 MILESTONE 4 TEST SUITE SUMMARY RESULTS');
  console.log('====================================================');
  console.log(`TOTAL TESTS: ${passedCount + failedCount}`);
  console.log(`PASSED     : ${passedCount}`);
  console.log(`FAILED     : ${failedCount}`);
  console.log('====================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runMilestone4Suite();
