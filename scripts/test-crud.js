// Automated Full CRUD and Auth Verification Script
// Tests all database operations (local or Supabase)
import { dbService, isSupabaseConfigured } from '../api/lib/supabase.js';

async function runFullCrudVerification() {
  console.log('====================================================');
  console.log('🧪 PAAL TRACKER - FULL CRUD & AUTH SYSTEM TEST');
  console.log('====================================================');
  console.log(`📡 Storage Engine: ${isSupabaseConfigured() ? '🌐 Supabase Cloud PostgreSQL' : '📁 Persistent Local Database (data/db.json)'}`);
  console.log(`⏰ Test Started At: ${new Date().toLocaleString()}`);
  console.log('----------------------------------------------------\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  ✅ [PASS] ${testName} ${details ? '(' + details + ')' : ''}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
      failed++;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // TEST 1: READ INITIAL CUSTOMERS
    // -------------------------------------------------------------------------
    console.log('📌 STEP 1: READ Operation (Customer List)');
    const initialCustomers = await dbService.getCustomers();
    assert(Array.isArray(initialCustomers) && initialCustomers.length > 0, 
      'Fetch customers list', 
      `Total customers found: ${initialCustomers.length}`);

    // -------------------------------------------------------------------------
    // TEST 2: CREATE A NEW CUSTOMER (e.g., Kannan)
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 2: CREATE Operation (Register New Customer)');
    const testPhone = '9876543210';
    const newCustomerPayload = {
      id: `cust_test_${Date.now()}`,
      name: 'கண்ணன் (Kannan Test)',
      houseNo: '77/B',
      street: 'காந்தி சாலை (Gandhi Salai)',
      phone: testPhone,
      defaultMorningQty: 1.5,
      defaultEveningQty: 0.5,
      ratePerLitre: 56,
      routeOrder: initialCustomers.length + 1,
      notes: 'Automated test customer entry',
      status: 'ACTIVE'
    };

    const createdCustomer = await dbService.saveCustomer(newCustomerPayload);
    assert(createdCustomer && createdCustomer.phone === testPhone, 
      'Save new customer to database', 
      `Customer Name: ${createdCustomer.name}, Phone: ${createdCustomer.phone}`);

    // -------------------------------------------------------------------------
    // TEST 3: READ / FIND CREATED CUSTOMER
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 3: READ Operation (Search & Customer Login Lookup)');
    const foundByPhone = await dbService.findCustomerByPhoneOrId(testPhone);
    assert(foundByPhone && foundByPhone.name.includes('Kannan'), 
      'Find customer by phone (Login lookup simulation)', 
      `Matched: ${foundByPhone?.name} (${foundByPhone?.phone})`);

    // -------------------------------------------------------------------------
    // TEST 4: UPDATE CUSTOMER DETAILS
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 4: UPDATE Operation (Modify Qty & Rate)');
    const updatedCustomer = await dbService.saveCustomer({
      ...createdCustomer,
      defaultMorningQty: 2.0,
      notes: 'Updated milk quantity to 2 Litres'
    });
    assert(updatedCustomer && updatedCustomer.defaultMorningQty === 2.0, 
      'Update customer default morning quantity', 
      `New Qty: ${updatedCustomer.defaultMorningQty}L`);

    // -------------------------------------------------------------------------
    // TEST 5: CREATE & READ DELIVERIES
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 5: CREATE & READ Operation (Delivery Logging)');
    const today = new Date().toISOString().split('T')[0];
    const deliveryBatch = [
      {
        date: today,
        shift: 'MORNING',
        customerId: createdCustomer.id,
        status: 'DELIVERED',
        litres: 2.0,
        extraLitres: 0.0,
        deliveredTime: '06:45 AM',
        note: 'Delivered successfully'
      }
    ];

    const deliverySaved = await dbService.saveDeliveries(deliveryBatch);
    assert(deliverySaved === true, 'Save morning delivery record');

    const fetchedDeliveries = await dbService.getDeliveries({ date: today, customerId: createdCustomer.id });
    assert(Array.isArray(fetchedDeliveries) && fetchedDeliveries.length > 0 && fetchedDeliveries[0].status === 'DELIVERED', 
      'Fetch recorded delivery for customer', 
      `Status: ${fetchedDeliveries[0]?.status}, Litres: ${fetchedDeliveries[0]?.litres}L`);

    // -------------------------------------------------------------------------
    // TEST 6: EXTRA MILK REQUEST (Create -> Read -> Approve)
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 6: CREATE & UPDATE Operation (Extra Milk Request Workflow)');
    const extraReqPayload = {
      id: `req_${Date.now()}`,
      customerId: createdCustomer.id,
      customerName: createdCustomer.name,
      houseNo: createdCustomer.houseNo,
      phone: createdCustomer.phone,
      date: today,
      shift: 'EVENING',
      extraLitres: 1.0,
      reason: 'Pooja at home',
      status: 'PENDING'
    };

    const createdReq = await dbService.saveExtraRequest(extraReqPayload);
    assert(createdReq && createdReq.id === extraReqPayload.id, 
      'Customer submits extra milk request', 
      `Req ID: ${createdReq.id}, Status: ${createdReq.status}`);

    const approvedReq = await dbService.updateExtraRequestStatus(createdReq.id, 'ACCEPTED', 'Sure, will deliver in evening');
    assert(approvedReq && approvedReq.status === 'ACCEPTED', 
      'Owner approves extra milk request', 
      `Updated Status: ${approvedReq?.status}, Vendor Note: "${approvedReq?.vendorNote}"`);

    // -------------------------------------------------------------------------
    // TEST 7: LEAVE REQUEST (Create -> Read -> Approve)
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 7: CREATE & UPDATE Operation (Leave Request Workflow)');
    const leavePayload = {
      id: `leave_${Date.now()}`,
      customerId: createdCustomer.id,
      customerName: createdCustomer.name,
      houseNo: createdCustomer.houseNo,
      phone: createdCustomer.phone,
      fromDate: today,
      toDate: today,
      shift: 'EVENING',
      reason: 'Out of station',
      status: 'PENDING'
    };

    const createdLeave = await dbService.saveLeaveRequest(leavePayload);
    assert(createdLeave && createdLeave.id === leavePayload.id, 
      'Customer submits leave request', 
      `Leave ID: ${createdLeave.id}, Status: ${createdLeave.status}`);

    const approvedLeave = await dbService.updateLeaveRequestStatus(createdLeave.id, 'ACCEPTED', 'Leave noted');
    assert(approvedLeave && approvedLeave.status === 'ACCEPTED', 
      'Owner approves leave request', 
      `Updated Status: ${approvedLeave?.status}`);

    // -------------------------------------------------------------------------
    // TEST 8: AUTHENTICATION
    // -------------------------------------------------------------------------
    console.log('\n📌 STEP 8: AUTHENTICATION Verification');
    const ownerAuthSuccess = await dbService.verifyOwnerPin('9842154321', '1234');
    assert(ownerAuthSuccess && ownerAuthSuccess.verified === true, 
      'Owner PIN authentication (1234)', 
      `Owner Farm: ${ownerAuthSuccess?.owner?.farmName}`);

    const ownerAuthFail = await dbService.verifyOwnerPin('9842154321', '9999');
    assert(ownerAuthFail && ownerAuthFail.verified === false, 
      'Owner PIN rejection on wrong PIN');

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n====================================================');
    console.log(`📊 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
    console.log('====================================================');
    if (failed === 0) {
      console.log('🎉 ALL CRUD OPERATIONS & LOGIC ARE WORKING 100% PERFECTLY!');
    } else {
      console.error('⚠️ Some tests failed. Please check the logs above.');
    }

  } catch (err) {
    console.error('💥 Fatal error during CRUD verification:', err);
  }
}

runFullCrudVerification();
