import http from 'http';
import dotenv from 'dotenv';
import prisma from '../config/db.js';

dotenv.config();

const PORT = 5098; // Dedicated test port for profile & farm tests
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

async function runProfileFarmsTestSuite() {
  console.log('====================================================');
  console.log('🌾 FARMDEX MILESTONE 3: PROFILES & FARMS TEST SUITE');
  console.log('====================================================\n');

  const { default: app } = await import('../app.js');
  server = app.listen(PORT);

  const testEmails = [
    'farmer_a_m3test@farmdex.com',
    'farmer_b_m3test@farmdex.com',
    'buyer_a_m3test@farmdex.com',
  ];

  // Clean up any old test users
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
    // TEST 1: 401 Unauthorized for Unauthenticated Requests
    // ----------------------------------------------------
    const unauthGetProfile = await makeRequest('/api/profiles/me');
    record('1a. Unauth GET /api/profiles/me returns 401', unauthGetProfile.status === 401);

    const unauthGetFarms = await makeRequest('/api/farms');
    record('1b. Unauth GET /api/farms returns 401', unauthGetFarms.status === 401);

    const unauthPostFarm = await makeRequest('/api/farms', 'POST', { name: 'Test Farm' });
    record('1c. Unauth POST /api/farms returns 401', unauthPostFarm.status === 401);

    // ----------------------------------------------------
    // TEST 2: Register Test Accounts (Farmer A, Farmer B, Buyer A)
    // ----------------------------------------------------
    const regFarmerA = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Alice',
      email: 'farmer_a_m3test@farmdex.com',
      password: 'Password123!',
      role: 'FARMER',
    });
    const tokenFarmerA = regFarmerA.data?.data?.token;
    record('2a. Register Farmer A', regFarmerA.status === 201 && !!tokenFarmerA);

    const regFarmerB = await makeRequest('/api/auth/register', 'POST', {
      name: 'Farmer Bob',
      email: 'farmer_b_m3test@farmdex.com',
      password: 'Password123!',
      role: 'FARMER',
    });
    const tokenFarmerB = regFarmerB.data?.data?.token;
    record('2b. Register Farmer B', regFarmerB.status === 201 && !!tokenFarmerB);

    const regBuyerA = await makeRequest('/api/auth/register', 'POST', {
      name: 'Buyer Bob',
      email: 'buyer_a_m3test@farmdex.com',
      password: 'Password123!',
      role: 'BUYER',
    });
    const tokenBuyerA = regBuyerA.data?.data?.token;
    record('2c. Register Buyer A', regBuyerA.status === 201 && !!tokenBuyerA);

    const headersA = { Authorization: `Bearer ${tokenFarmerA}` };
    const headersB = { Authorization: `Bearer ${tokenFarmerB}` };
    const headersBuyer = { Authorization: `Bearer ${tokenBuyerA}` };

    // ----------------------------------------------------
    // TEST 3: Profile Retrieval & Partial Update Logic
    // ----------------------------------------------------
    const getProfileA = await makeRequest('/api/profiles/me', 'GET', null, headersA);
    record(
      '3a. GET Farmer A profile',
      getProfileA.status === 200 && getProfileA.data?.data?.farmerProfile !== undefined
    );

    // Update Farmer A profile & attempt to overwrite verificationStatus
    const updateProfileA = await makeRequest(
      '/api/profiles/farmer',
      'PUT',
      {
        farmName: 'Green Valley Estate',
        farmSize: 45.0,
        state: 'Punjab',
        pincode: '141001',
        verificationStatus: 'VERIFIED', // Attempt tamper
      },
      headersA
    );
    const updatedStatus = updateProfileA.data?.data?.verificationStatus;
    record(
      '3b. PUT Farmer A profile (verificationStatus remains read-only PENDING)',
      updateProfileA.status === 200 &&
        updatedStatus === 'PENDING' &&
        updateProfileA.data?.data?.farmName === 'Green Valley Estate',
      `VerificationStatus: ${updatedStatus}`
    );

    // Update Buyer A profile
    const updateBuyer = await makeRequest(
      '/api/profiles/buyer',
      'PUT',
      {
        businessName: 'Agri World Corp',
        businessType: 'WHOLESALER',
        state: 'Delhi',
        pincode: '110001',
      },
      headersBuyer
    );
    record(
      '3c. PUT Buyer A profile updates buyer fields',
      updateBuyer.status === 200 &&
        updateBuyer.data?.data?.businessName === 'Agri World Corp'
    );

    // ----------------------------------------------------
    // TEST 4: Pincode and Coordinate Validation
    // ----------------------------------------------------
    const badPincodeProfile = await makeRequest(
      '/api/profiles/farmer',
      'PUT',
      { pincode: '12345' }, // 5 digits
      headersA
    );
    record('4a. Invalid pincode (5 digits) on profile returns 400', badPincodeProfile.status === 400);

    const badLatFarm = await makeRequest(
      '/api/farms',
      'POST',
      {
        name: 'Invalid Coords Farm',
        size: 10,
        state: 'Punjab',
        pincode: '141001',
        latitude: 95.0, // Out of range [-90, 90]
      },
      headersA
    );
    record('4b. Invalid latitude (>90) on farm returns 400', badLatFarm.status === 400);

    // ----------------------------------------------------
    // TEST 5: Cross-Role RBAC Authorization Blocks
    // ----------------------------------------------------
    const buyerCreateFarm = await makeRequest(
      '/api/farms',
      'POST',
      { name: 'Buyer Illegal Farm', size: 10, state: 'Punjab', pincode: '141001' },
      headersBuyer
    );
    record('5a. BUYER attempt to POST /api/farms returns 403', buyerCreateFarm.status === 403);

    const buyerGetFarms = await makeRequest('/api/farms', 'GET', null, headersBuyer);
    record('5b. BUYER attempt to GET /api/farms returns 403', buyerGetFarms.status === 403);

    // ----------------------------------------------------
    // TEST 6: Farm CRUD Operations for Farmer A
    // ----------------------------------------------------
    const createFarm1 = await makeRequest(
      '/api/farms',
      'POST',
      {
        name: 'Sunrise Acres',
        size: 12.5,
        state: 'Punjab',
        district: 'Ludhiana',
        pincode: '141001',
        latitude: 30.9,
        longitude: 75.85,
      },
      headersA
    );
    const farm1Id = createFarm1.data?.data?.id;
    record(
      '6a. Farmer A creates Farm 1',
      createFarm1.status === 201 && !!farm1Id,
      `FarmId: ${farm1Id}`
    );

    const createFarm2 = await makeRequest(
      '/api/farms',
      'POST',
      {
        name: 'Valley View',
        size: 8.0,
        state: 'Punjab',
        district: 'Ludhiana',
        pincode: '141002',
      },
      headersA
    );
    const farm2Id = createFarm2.data?.data?.id;
    record('6b. Farmer A creates Farm 2', createFarm2.status === 201 && !!farm2Id);

    const listFarmsA = await makeRequest('/api/farms', 'GET', null, headersA);
    record(
      '6c. Farmer A lists farms',
      listFarmsA.status === 200 && listFarmsA.data?.data?.length === 2
    );

    const getFarm1 = await makeRequest(`/api/farms/${farm1Id}`, 'GET', null, headersA);
    record(
      '6d. Farmer A fetches Farm 1 by ID',
      getFarm1.status === 200 && getFarm1.data?.data?.name === 'Sunrise Acres'
    );

    const updateFarm1 = await makeRequest(
      `/api/farms/${farm1Id}`,
      'PUT',
      { size: 15.0 },
      headersA
    );
    record(
      '6e. Farmer A updates Farm 1 size',
      updateFarm1.status === 200 && updateFarm1.data?.data?.size === '15'
    );

    // ----------------------------------------------------
    // TEST 7: Cross-Farmer Ownership Isolation (Farmer B calling Farmer A's farm)
    // ----------------------------------------------------
    const isolationGet = await makeRequest(`/api/farms/${farm1Id}`, 'GET', null, headersB);
    record('7a. Farmer B GET Farmer A farm returns 404', isolationGet.status === 404);

    const isolationPut = await makeRequest(
      `/api/farms/${farm1Id}`,
      'PUT',
      { name: 'Hacked Name' },
      headersB
    );
    record('7b. Farmer B PUT Farmer A farm returns 404', isolationPut.status === 404);

    const isolationDelete = await makeRequest(`/api/farms/${farm1Id}`, 'DELETE', null, headersB);
    record('7c. Farmer B DELETE Farmer A farm returns 404', isolationDelete.status === 404);

    // ----------------------------------------------------
    // TEST 8: Farm Deletion Safeguards (Active vs Non-Active Crop Listings)
    // ----------------------------------------------------
    // Seed test Category and ACTIVE crop listing linked to Farm 1 directly in Prisma
    const testCategory = await prisma.category.upsert({
      where: { name: 'Test Grains' },
      update: {},
      create: { name: 'Test Grains', description: 'Test category' },
    });

    const farmerAUser = await prisma.user.findUnique({
      where: { email: 'farmer_a_m3test@farmdex.com' },
      include: { farmerProfile: true },
    });

    const activeListing = await prisma.cropListing.create({
      data: {
        farmerProfileId: farmerAUser.farmerProfile.id,
        farmId: farm1Id,
        categoryId: testCategory.id,
        cropName: 'Wheat',
        quantity: 100,
        unit: 'KG',
        pricePerUnit: 25,
        status: 'ACTIVE',
      },
    });

    // Attempt to delete Farm 1 while active listing exists
    const deleteActiveBlock = await makeRequest(`/api/farms/${farm1Id}`, 'DELETE', null, headersA);
    record(
      '8a. Farmer A DELETE farm with ACTIVE listing returns 400',
      deleteActiveBlock.status === 400 &&
        deleteActiveBlock.data?.message?.toLowerCase().includes('active crop listings'),
      `Msg: ${deleteActiveBlock.data?.message}`
    );

    // Update listing status to ARCHIVED
    await prisma.cropListing.update({
      where: { id: activeListing.id },
      data: { status: 'ARCHIVED' },
    });

    // Attempt deletion again
    const deleteSuccess = await makeRequest(`/api/farms/${farm1Id}`, 'DELETE', null, headersA);
    record('8b. Farmer A DELETE farm with ARCHIVED listing succeeds (200)', deleteSuccess.status === 200);

    // Verify crop listing still exists and farmId is NULL
    const preservedListing = await prisma.cropListing.findUnique({
      where: { id: activeListing.id },
    });
    record(
      '8c. Preserved crop listing farmId set to NULL (onDelete SetNull)',
      preservedListing !== null && preservedListing.farmId === null
    );

    // Clean up test listing
    await prisma.cropListing.delete({ where: { id: activeListing.id } });

  } catch (err) {
    console.error('❌ EXCEPTION ENCOUNTERED IN TEST SUITE:', err);
  } finally {
    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { in: testEmails } },
    });

    if (server) server.close();
    await prisma.$disconnect();
  }

  console.log('\n====================================================');
  console.log('📊 MILESTONE 3 TEST SUMMARY RESULTS');
  console.log('====================================================');
  const total = results.length;
  const passed = results.filter((r) => r.pass).length;
  const failed = total - passed;
  console.log(`TOTAL TESTS: ${total}`);
  console.log(`PASSED     : ${passed}`);
  console.log(`FAILED     : ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runProfileFarmsTestSuite();
