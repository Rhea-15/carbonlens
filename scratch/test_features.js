import assert from "assert";

const BASE_URL = "http://localhost:3000";

async function runTests() {
  console.log("=== Starting CarbonLens Feature Integration Tests ===\n");
  let cookieHeader = "";

  // Helper to parse Set-Cookie
  function extractCookie(headers) {
    const setCookie = headers.get("set-cookie");
    if (setCookie) {
      const match = setCookie.match(/session_token=([^;]+)/);
      if (match) {
        return `session_token=${match[1]}`;
      }
    }
    return "";
  }

  // Test 1: Fetch Emission Factors
  console.log("Test 1: Fetching emission factors catalog...");
  const factorsRes = await fetch(`${BASE_URL}/api/factors`);
  assert.strictEqual(factorsRes.status, 200, "Factors fetch failed");
  const factors = await factorsRes.json();
  assert.ok(Array.isArray(factors), "Factors should be an array");
  assert.ok(factors.length > 0, "Factors catalog should not be empty");
  console.log(`✓ Success: Found ${factors.length} emission factors.`);

  // Test 2: Register a new user
  console.log("\nTest 2: Registering a new test user account...");
  const testEmail = `test_${Date.now()}@carbonlens.test`;
  const registerPayload = {
    email: testEmail,
    password: "Password123!",
    countryCode: "IN",
    householdSize: "3",
    commuteType: "car_petrol_km",
    dailyBudgetKg: "5.5"
  };
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(registerPayload)
  });
  assert.strictEqual(registerRes.status, 201, "Registration failed");
  const registerData = await registerRes.json();
  assert.strictEqual(registerData.email, testEmail, "Email mismatch");
  assert.strictEqual(registerData.householdSize, 3, "Household size mismatch");
  cookieHeader = extractCookie(registerRes.headers);
  assert.ok(cookieHeader.includes("session_token"), "Did not receive session cookie");
  console.log(`✓ Success: Account created for ${testEmail}.`);

  // Test 3: Retrieve profile
  console.log("\nTest 3: Retrieving authenticated user profile...");
  const profileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(profileRes.status, 200, "Profile fetch unauthorized/failed");
  const profileData = await profileRes.json();
  assert.strictEqual(profileData.email, testEmail, "Profile email mismatch");
  console.log(`✓ Success: Profile authenticated successfully.`);

  // Test 4: Update Profile
  console.log("\nTest 4: Updating user profile options...");
  const updatePayload = {
    countryCode: "DE",
    householdSize: 4,
    dailyBudgetKg: 6.0
  };
  const updateRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader
    },
    body: JSON.stringify(updatePayload)
  });
  assert.strictEqual(updateRes.status, 200, "Profile update failed");
  const updatedData = await updateRes.json();
  assert.strictEqual(updatedData.countryCode, "DE", "Country not updated");
  assert.strictEqual(updatedData.householdSize, 4, "Household size not updated");
  assert.strictEqual(updatedData.dailyBudgetKg, 6.0, "Budget not updated");
  console.log(`✓ Success: Profile updated to country DE, household size 4, daily budget 6.0.`);

  // Test 5: Verify Initial Empty Dashboard
  console.log("\nTest 5: Retrieving dashboard state...");
  const dashRes1 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(dashRes1.status, 200, "Dashboard fetch failed");
  const dashData1 = await dashRes1.json();
  assert.strictEqual(dashData1.todayLoggedKg, 0, "Initial emissions should be 0");
  assert.strictEqual(dashData1.streaks.current, 0, "Initial streak should be 0");
  console.log(`✓ Success: Dashboard initial state confirmed.`);

  // Test 6: Logging Activity
  console.log("\nTest 6: Logging daily emissions activity...");
  // Find a transport factor
  const transportFactor = factors.find(f => f.category === "transport");
  assert.ok(transportFactor, "Could not find a transport factor");
  const logPayload = {
    factorId: transportFactor.id,
    quantity: 15, // 15 km
    note: "Commute to office",
    loggedAt: new Date().toISOString()
  };
  const logRes = await fetch(`${BASE_URL}/api/logs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader
    },
    body: JSON.stringify(logPayload)
  });
  assert.strictEqual(logRes.status, 201, "Add log failed");
  const logData = await logRes.json();
  assert.strictEqual(logData.quantity, 15, "Logged quantity mismatch");
  assert.ok(logData.emissionKg > 0, "Logged emission should be greater than 0");
  const addedLogId = logData.id;
  console.log(`✓ Success: Logged 15 units of ${transportFactor.label} (${logData.emissionKg} kg CO₂e).`);

  // Test 7: Retrieve actions and toggle/adopt one
  console.log("\nTest 7: Fetching action library & adopting a habit swap...");
  const actionsRes = await fetch(`${BASE_URL}/api/actions`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(actionsRes.status, 200, "Actions fetch failed");
  const actionsData = await actionsRes.json();
  assert.ok(actionsData.library.length > 0, "Actions library is empty");
  
  const testAction = actionsData.library[0];
  const togglePayload = {
    actionKey: testAction.key,
    status: "adopted"
  };
  const toggleRes = await fetch(`${BASE_URL}/api/actions/toggle`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Cookie": cookieHeader
    },
    body: JSON.stringify(togglePayload)
  });
  assert.strictEqual(toggleRes.status, 200, "Toggle action failed");
  const toggleData = await toggleRes.json();
  assert.strictEqual(toggleData.status, "adopted", "Action status was not toggled to adopted");
  console.log(`✓ Success: Adopted action "${testAction.title}".`);

  // Test 8: Verify Dashboard Updates
  console.log("\nTest 8: Re-verifying dashboard stats after updates...");
  const dashRes2 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(dashRes2.status, 200, "Dashboard fetch failed");
  const dashData2 = await dashRes2.json();
  assert.strictEqual(dashData2.todayLoggedKg, logData.emissionKg, "Dashboard today total emission incorrect");
  assert.strictEqual(dashData2.recentLogs.length, 1, "Dashboard logs count mismatch");
  assert.strictEqual(dashData2.adoptedActions.length, 1, "Dashboard adopted actions count mismatch");
  console.log(`✓ Success: Dashboard reflects the logged activity and adopted action.`);

  // Test 9: Generate Weekly Insights
  console.log("\nTest 9: Requesting AI/Fallback weekly insight compilation...");
  const insightRes = await fetch(`${BASE_URL}/api/insights/generate`, {
    method: "POST",
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(insightRes.status, 200, "Insight generation failed");
  const insightData = await insightRes.json();
  assert.ok(insightData.headline, "Insight missing headline");
  assert.ok(insightData.body, "Insight missing body");
  assert.ok(insightData.swapAction, "Insight missing swapAction");
  console.log(`✓ Success: Insight compiled ("${insightData.headline}").`);

  // Test 10: Export CSV Settings
  console.log("\nTest 10: Exporting user logs to CSV...");
  const exportRes = await fetch(`${BASE_URL}/api/settings/export`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(exportRes.status, 200, "Export CSV failed");
  const exportData = await exportRes.text();
  assert.ok(exportData.includes("ID,Logged At,Category,Activity,Quantity,Emission (kgCO2e),Note"), "CSV header format invalid");
  assert.ok(exportData.includes("Commute to office"), "Logged note not found in CSV export");
  console.log(`✓ Success: Exported CSV successfully containing the user logs.`);

  // Test 11: Delete Log
  console.log("\nTest 11: Purging carbon log entry...");
  const deleteRes = await fetch(`${BASE_URL}/api/logs/${addedLogId}`, {
    method: "DELETE",
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(deleteRes.status, 200, "Delete log failed");
  const deleteConfirm = await deleteRes.json();
  assert.ok(deleteConfirm.message.includes("Successfully deleted"), "Delete response invalid");
  
  // Re-verify dashboard is clean again
  const dashRes3 = await fetch(`${BASE_URL}/api/dashboard`, {
    headers: { "Cookie": cookieHeader }
  });
  const dashData3 = await dashRes3.json();
  assert.strictEqual(dashData3.todayLoggedKg, 0, "Emissions should have reverted to 0");
  console.log(`✓ Success: Log entry successfully removed and dashboard recalculated.`);

  // Test 12: Account Purge
  console.log("\nTest 12: Purging account from system...");
  const purgeRes = await fetch(`${BASE_URL}/api/settings/delete-account`, {
    method: "POST",
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(purgeRes.status, 200, "Account purge failed");
  const purgeConfirm = await purgeRes.json();
  assert.strictEqual(purgeConfirm.success, true, "Purge success field invalid");
  
  // Confirm profile is no longer accessible
  const checkProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    headers: { "Cookie": cookieHeader }
  });
  assert.strictEqual(checkProfileRes.status, 401, "Profile should be unauthorized after purge");
  console.log(`✓ Success: Account purged. Access token successfully invalidated.`);

  console.log("\n=================================================");
  console.log("🎉 All 12 feature integration tests passed successfully! 🎉");
  console.log("=================================================");
}

runTests().catch(err => {
  console.error("\n❌ Test Suite Failed:", err.message || err);
  process.exit(1);
});
