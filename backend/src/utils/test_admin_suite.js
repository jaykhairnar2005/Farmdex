import { provisionAdmin } from './seed_admin.js';
import prisma from '../config/db.js';

const API_BASE = 'http://localhost:5000/api';

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ PASS | ${message}`);
  } else {
    console.error(`❌ FAIL | ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runAdminTests() {
  console.log('\n===========================================================');
  console.log('🛡️ FARMDEX ADMIN PANEL & GOVERNANCE TEST SUITE');
  console.log('===========================================================\n');

  try {
    // 1. Admin Provisioning
    const adminEmail = `admin_test_${Date.now()}@farmdex.com`;
    const adminPassword = 'AdminSecretPass123!';
    const provisionedAdmin = await provisionAdmin({
      email: adminEmail,
      password: adminPassword,
      name: 'Test Administrator',
      phone: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
    });

    assert(provisionedAdmin && provisionedAdmin.role === 'ADMIN', '1a. Admin provisioning script successfully provisions ADMIN user');
    assert(provisionedAdmin.isActive === true && provisionedAdmin.isVerified === true, '1b. Admin account is verified and active');

    // 2. Prevent Public Registration of Admin Role
    const regAttempt = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hacker Admin',
        email: `hacker_${Date.now()}@example.com`,
        password: 'Password123!',
        role: 'ADMIN',
      }),
    });
    const regJson = await regAttempt.json();
    assert(regAttempt.status === 400, '2a. Public registration attempting ADMIN role is rejected with HTTP 400');
    assert(regJson.message && regJson.message.toLowerCase().includes('restricted to farmer or buyer'), '2b. Correct security error returned for admin self-registration');

    // 3. Register standard test buyer and farmer
    const timestamp = Date.now();
    const buyerEmail = `admin_test_buyer_${timestamp}@example.com`;
    const farmerEmail = `admin_test_farmer_${timestamp}@example.com`;

    const buyerReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Governance Test Buyer',
        email: buyerEmail,
        password: 'Password123!',
        role: 'BUYER',
      }),
    }).then((r) => r.json());

    const farmerReg = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Governance Test Farmer',
        email: farmerEmail,
        password: 'Password123!',
        role: 'FARMER',
        farmName: 'Admin Audit Farm',
      }),
    }).then((r) => r.json());

    const buyerToken = buyerReg.data.token;
    const buyerId = buyerReg.data.user.id;
    const farmerToken = farmerReg.data.token;
    const farmerId = farmerReg.data.user.id;

    assert(buyerToken && farmerToken, '3. Standard Buyer and Farmer registered successfully');

    // 4. Role-Based Authorization Security Checks
    const unauthStats = await fetch(`${API_BASE}/admin/stats`);
    assert(unauthStats.status === 401, '4a. Unauthenticated GET /api/admin/stats returns HTTP 401');

    const buyerStats = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(buyerStats.status === 403, '4b. BUYER role attempting GET /api/admin/stats is blocked with HTTP 403 Forbidden');

    const farmerUsers = await fetch(`${API_BASE}/admin/users`, {
      headers: { Authorization: `Bearer ${farmerToken}` },
    });
    assert(farmerUsers.status === 403, '4c. FARMER role attempting GET /api/admin/users is blocked with HTTP 403 Forbidden');

    const buyerDeactivate = await fetch(`${API_BASE}/admin/users/${farmerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert(buyerDeactivate.status === 403, '4d. Non-admin attempting user deactivation is blocked with HTTP 403');

    // 5. Admin Login & Metrics Dashboard
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: adminEmail,
        password: adminPassword,
      }),
    });
    const adminLoginJson = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminLoginJson.data?.user?.role === 'ADMIN', '5a. Admin successfully logs in with provisioned credentials');
    const adminToken = adminLoginJson.data.token;

    const statsRes = await fetch(`${API_BASE}/admin/stats`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsJson = await statsRes.json();
    assert(statsRes.status === 200 && statsJson.success === true, '5b. Admin retrieves real-time platform statistics (200)');
    assert(statsJson.data.users.total >= 3, '5c. Statistics accurately count real users in PostgreSQL');
    assert(typeof statsJson.data.payments.totalSettledRevenue === 'number', '5d. Settled revenue aggregated properly');

    // 6. User Governance & Self-Lockout Protection
    const usersListRes = await fetch(`${API_BASE}/admin/users?limit=10`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const usersListJson = await usersListRes.json();
    assert(usersListRes.status === 200 && usersListJson.data.users.length > 0, '6a. Admin lists registered users with metadata (200)');

    // Attempt self-deactivation (Must be rejected)
    const selfDeactRes = await fetch(`${API_BASE}/admin/users/${provisionedAdmin.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false }),
    });
    assert(selfDeactRes.status === 400, '6b. Admin self-deactivation attempt is blocked (HTTP 400)');

    // Deactivate buyer account
    const deactBuyerRes = await fetch(`${API_BASE}/admin/users/${buyerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: false, reason: 'Policy violation test' }),
    });
    assert(deactBuyerRes.status === 200, '6c. Admin successfully deactivates buyer account (200)');

    // Verify deactivated user cannot perform actions (real-time check)
    const deactivatedMeRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${buyerToken}` },
    });
    assert(deactivatedMeRes.status === 401, '6d. Deactivated user real-time request immediately rejected with HTTP 401');

    // Reactivate buyer account
    const reactBuyerRes = await fetch(`${API_BASE}/admin/users/${buyerId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isActive: true, reason: 'Account reinstated' }),
    });
    assert(reactBuyerRes.status === 200, '6e. Admin successfully reactivates buyer account (200)');

    // Verification toggle
    const verifyRes = await fetch(`${API_BASE}/admin/users/${farmerId}/verification`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ isVerified: true }),
    });
    assert(verifyRes.status === 200, '6f. Admin updates user profile verification status (200)');

    // 7. Produce Listing Moderation
    const categories = await prisma.category.findMany({ take: 1 });
    const categoryId = categories[0].id;
    const farmerProfile = await prisma.farmerProfile.findUnique({ where: { userId: farmerId } });

    const newListing = await prisma.cropListing.create({
      data: {
        farmerProfileId: farmerProfile.id,
        categoryId,
        cropName: 'Admin Moderation Golden Maize',
        quantity: 100,
        unit: 'KG',
        pricePerUnit: 45,
        status: 'ACTIVE',
      },
    });

    const listingsRes = await fetch(`${API_BASE}/admin/listings`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const listingsJson = await listingsRes.json();
    assert(listingsRes.status === 200 && listingsJson.data.listings.length > 0, '7a. Admin retrieves produce listings for moderation (200)');

    // Suspend listing
    const suspendRes = await fetch(`${API_BASE}/admin/listings/${newListing.id}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'SUSPENDED', reason: 'Misleading description report' }),
    });
    assert(suspendRes.status === 200, '7b. Admin suspends produce listing (200)');

    // Verify suspended listing is hidden from public marketplace
    const publicMarketplace = await fetch(`${API_BASE}/crop-listings?search=Golden Maize`).then((r) => r.json());
    const isHidden = !publicMarketplace.data?.listings?.some((l) => l.id === newListing.id);
    assert(isHidden, '7c. Suspended produce listing is hidden from public marketplace');

    // Reinstate listing
    const reinstateRes = await fetch(`${API_BASE}/admin/listings/${newListing.id}/moderate`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE', reason: 'Verified authentic produce' }),
    });
    assert(reinstateRes.status === 200, '7d. Admin reinstates produce listing to ACTIVE (200)');

    // 8. Order, Payment & Delivery Monitoring
    const adminOrdersRes = await fetch(`${API_BASE}/admin/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminOrdersRes.status === 200, '8a. Admin accesses orders monitoring feed (200)');

    const adminPaymentsRes = await fetch(`${API_BASE}/admin/payments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminPaymentsRes.status === 200, '8b. Admin accesses payment transactions audit feed (200)');

    const adminDeliveriesRes = await fetch(`${API_BASE}/admin/deliveries`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(adminDeliveriesRes.status === 200, '8c. Admin accesses consignment deliveries feed (200)');

    // 9. Complaint Lifecycle & Dispute Resolution
    const submitComplaintRes = await fetch(`${API_BASE}/complaints`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${buyerToken}`,
      },
      body: JSON.stringify({
        listingId: newListing.id,
        reason: 'Price discrepancy with market rate',
        description: 'Listing prices appear significantly elevated compared to regional APMC mandi rate.',
      }),
    });
    const complaintJson = await submitComplaintRes.json();
    assert(submitComplaintRes.status === 201 && complaintJson.data?.complaint?.id, '9a. Buyer submits dispute complaint (201)');
    const complaintId = complaintJson.data.complaint.id;

    const complaintsListRes = await fetch(`${API_BASE}/admin/complaints`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const complaintsListJson = await complaintsListRes.json();
    const hasComplaint = complaintsListJson.data?.complaints?.some((c) => c.id === complaintId);
    assert(complaintsListRes.status === 200 && hasComplaint, '9b. Admin discovers newly submitted complaint in queue (200)');

    // Resolve complaint
    const resolveCompRes = await fetch(`${API_BASE}/admin/complaints/${complaintId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'RESOLVED',
        adminResponse: 'FarmDex inspection confirmed price meets organic grade-A standards. Matter resolved.',
      }),
    });
    const resolvedJson = await resolveCompRes.json();
    assert(resolveCompRes.status === 200 && resolvedJson.data?.complaint?.status === 'RESOLVED', '9c. Admin provides official resolution response and marks complaint RESOLVED (200)');

    // 10. Audit Log Ledger Verification
    const auditLogsRes = await fetch(`${API_BASE}/admin/audit-logs`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const auditJson = await auditLogsRes.json();
    assert(auditLogsRes.status === 200 && auditJson.data?.logs?.length >= 4, '10a. Admin retrieves immutable audit logs from ledger (200)');
    const hasUserDeactLog = auditJson.data?.logs?.some((l) => l.action === 'USER_DEACTIVATED');
    const hasListingModLog = auditJson.data?.logs?.some((l) => l.action.startsWith('LISTING_'));
    const hasComplaintLog = auditJson.data?.logs?.some((l) => l.action.startsWith('COMPLAINT_'));
    assert(hasUserDeactLog && hasListingModLog && hasComplaintLog, '10b. Audit logs correctly recorded user deactivation, listing moderation, and complaint resolution');

    console.log('\n===========================================================');
    console.log(`📊 ADMIN TEST SUITE SUMMARY: ${passedTests} / ${totalTests} PASSED`);
    console.log('===========================================================\n');
  } catch (err) {
    console.error('\n❌ Admin test suite encountered an error:', err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runAdminTests();
