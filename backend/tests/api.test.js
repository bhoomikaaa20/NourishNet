// Integration tests. Requires a MongoDB reachable at TEST_MONGO_URL
// (default mongodb://127.0.0.1:27017/nourishnet_test). Never point this at production.
process.env.SECRET_KEY = "test-secret";
process.env.ADMIN_EMAIL = "Admin@Test.com";
process.env.ADMIN_PASSWORD = "correct horse battery";
delete process.env.ADMIN_PASSWORD_HASH;
delete process.env.CLIENT_ORIGIN;

const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const request = require("supertest");
const createApp = require("../app");

const URL = process.env.TEST_MONGO_URL || "mongodb://127.0.0.1:27017/nourishnet_test";
let app;
let token;

const donation = {
  name: "Asha", contactNumber: "+91 98765 43210", email: "Asha@Example.com",
  address: "12 MG Road", foodType: "rice", quantity: 5,
};
const foodRequest = {
  name: "Ravi", contactNumber: "9876543210", email: "ravi@example.com",
  urgency: "immediate", address: "4 Church St",
};

const authed = (method, path) =>
  request(app)[method](path).set("Authorization", "Bearer " + token);

before(async () => {
  await mongoose.connect(URL);
  await mongoose.connection.dropDatabase();
  await Promise.all(Object.values(mongoose.models).map((m) => m.init()));
  app = createApp();
});
after(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

test("public forms validate input", async () => {
  let res = await request(app).post("/api/donate-food").send({ ...donation, quantity: -1, email: "nope" });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.quantity && res.body.errors.email);

  res = await request(app).post("/api/request-food").send({ ...foodRequest, name: { $ne: null } });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.name);

  res = await request(app).post("/api/request-food").send({ ...foodRequest, urgency: "whenever" });
  assert.equal(res.status, 400);
});

test("public forms store records and return tracking ids", async () => {
  let res = await request(app).post("/api/donate-food").send(donation);
  assert.equal(res.status, 200);
  assert.match(res.body.trackingId, /^DON-[A-Z2-9]{8}$/);
  donation.trackingId = res.body.trackingId;

  res = await request(app).post("/api/request-food").send(foodRequest);
  assert.equal(res.status, 200);
  assert.match(res.body.trackingId, /^REQ-[A-Z2-9]{8}$/);
  foodRequest.trackingId = res.body.trackingId;

  res = await request(app).post("/contact").send({
    firstName: "A", lastName: "B", email: "a@b.co", phone: "1234567", comments: "hi",
  });
  assert.equal(res.status, 200);

  res = await request(app).post("/api/connections").send({ email: "News@Example.com" });
  assert.equal(res.status, 201);
  res = await request(app).post("/api/connections").send({ email: "news@example.com" });
  assert.equal(res.status, 200);
  assert.match(res.body.message, /already subscribed/);
});

test("tracking needs matching code and email", async () => {
  let res = await request(app).post("/api/track").send({ trackingId: donation.trackingId, email: "asha@example.com" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "pending");
  assert.equal(res.body.type, "donation");
  assert.equal(res.body.email, undefined);

  res = await request(app).post("/api/track").send({ trackingId: donation.trackingId, email: "other@example.com" });
  assert.equal(res.status, 404);
  res = await request(app).post("/api/track").send({ trackingId: { $ne: "" }, email: { $ne: "" } });
  assert.equal(res.status, 404);
});

test("admin endpoints require authentication", async () => {
  for (const path of ["/api/admin/stats", "/api/admin/requests", "/api/admin/donations/export"]) {
    assert.equal((await request(app).get(path)).status, 401);
  }
  assert.equal((await request(app).get("/api/dashboard")).status, 404);
  const bad = await request(app).get("/api/admin/stats").set("Authorization", "Bearer garbage");
  assert.equal(bad.status, 401);
});

test("login rejects bad credentials and issues a working token", async () => {
  let res = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "wrong" });
  assert.equal(res.status, 401);
  res = await request(app).post("/api/auth/login").send({ email: "other@test.com", password: "correct horse battery" });
  assert.equal(res.status, 401);
  res = await request(app).post("/api/auth/login").send({ email: { $ne: "" }, password: { $ne: "" } });
  assert.equal(res.status, 401);

  res = await request(app).post("/api/auth/login").send({ email: "admin@test.com", password: "correct horse battery" });
  assert.equal(res.status, 200);
  token = res.body.token;
  res = await authed("get", "/api/auth/me");
  assert.equal(res.status, 200);
});

test("admin can list, search, filter, update and delete", async () => {
  let res = await authed("get", "/api/admin/stats");
  assert.equal(res.status, 200);
  assert.equal(res.body.donations.total, 1);
  assert.equal(res.body.requests.pending, 1);
  assert.equal(res.body.kgDonated, 5);

  res = await authed("get", "/api/admin/donations?q=asha");
  assert.equal(res.body.total, 1);
  res = await authed("get", "/api/admin/donations?q=.*"); // regex chars are escaped
  assert.equal(res.body.total, 0);
  res = await authed("get", "/api/admin/donations?status=completed");
  assert.equal(res.body.total, 0);
  res = await authed("get", "/api/admin/nope");
  assert.equal(res.status, 404);
  res = await authed("get", "/api/admin/__proto__");
  assert.equal(res.status, 404);

  const id = (await authed("get", "/api/admin/donations")).body.items[0]._id;
  res = await authed("patch", "/api/admin/donations/" + id).send({ status: "completed", adminNote: "Picked up" });
  assert.equal(res.status, 200);
  assert.equal(res.body.status, "completed");
  res = await authed("patch", "/api/admin/donations/" + id).send({ status: "bogus" });
  assert.equal(res.status, 400);
  res = await authed("patch", "/api/admin/donations/not-an-id").send({ status: "approved" });
  assert.equal(res.status, 400);

  res = await authed("get", "/api/admin/stats");
  assert.equal(res.body.kgDelivered, 5);
  res = await request(app).post("/api/track").send({ trackingId: donation.trackingId, email: "asha@example.com" });
  assert.equal(res.body.status, "completed");
  assert.equal(res.body.adminNote, "Picked up");

  // Legacy documents without status / trackingId still list and filter as pending.
  await mongoose.connection.collection("foodrequests").insertOne({
    name: "Legacy", contactNumber: "1234567", email: "l@x.co", urgency: "immediate", createdAt: new Date(),
  });
  res = await authed("get", "/api/admin/requests?status=pending");
  assert.equal(res.body.total, 2);
  assert.ok(res.body.items.every((i) => i.status === "pending"));

  // CSV export neutralises formula injection.
  await request(app).post("/api/donate-food").send({ ...donation, name: "=HYPERLINK(1)" });
  res = await authed("get", "/api/admin/donations/export");
  assert.equal(res.status, 200);
  assert.match(res.headers["content-type"], /text\/csv/);
  assert.match(res.text, /"'=HYPERLINK\(1\)"/);

  res = await authed("delete", "/api/admin/donations/" + id);
  assert.equal(res.status, 200);
  res = await authed("delete", "/api/admin/donations/" + id);
  assert.equal(res.status, 404);
});

test("malformed or oversized bodies are rejected cleanly", async () => {
  let res = await request(app).post("/contact").set("Content-Type", "application/json").send("{bad");
  assert.equal(res.status, 400);
  res = await request(app).post("/contact").send({ comments: "x".repeat(20000) });
  assert.equal(res.status, 413);
});

test("listings: only approved, unclaimed, unexpired donations are public; claiming is atomic", async () => {
  const tomorrow = new Date(Date.now() + 86400000).toISOString();
  let res = await request(app).post("/api/donate-food").send({
    ...donation, name: "Lister", city: "Bangalore", dietType: "veg", availableUntil: tomorrow, quantity: 7,
  });
  assert.equal(res.status, 200);
  res = await request(app).post("/api/donate-food").send({ ...donation, availableUntil: "2001-01-01" });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.availableUntil);

  // Pending donations are not listed.
  res = await request(app).get("/api/listings");
  assert.equal(res.body.items.length, 0);

  const found = await authed("get", "/api/admin/donations?q=Lister");
  const id = found.body.items[0]._id;
  await authed("patch", "/api/admin/donations/" + id).send({ status: "approved" });

  res = await request(app).get("/api/listings?city=bangal&foodType=rice&dietType=veg");
  assert.equal(res.body.items.length, 1);
  const listing = res.body.items[0];
  assert.equal(listing.quantity, 7);
  for (const key of ["name", "email", "contactNumber", "address", "notes"]) assert.equal(listing[key], undefined);
  res = await request(app).get("/api/listings?foodType=bread");
  assert.equal(res.body.items.length, 0);

  const impact = await request(app).get("/api/impact");
  assert.equal(impact.status, 200);
  assert.equal(impact.body.availableListings, 1);

  // Two simultaneous claims: exactly one wins.
  const claimant = { name: "Neha", contactNumber: "9876501234", email: "neha@example.com", address: "7 Lake Rd" };
  const [a, b] = await Promise.all([
    request(app).post("/api/listings/" + listing.id + "/claim").send(claimant),
    request(app).post("/api/listings/" + listing.id + "/claim").send({ ...claimant, email: "other@example.com" }),
  ]);
  assert.deepEqual([a.status, b.status].sort(), [200, 409]);
  const winner = a.status === 200 ? a : b;
  assert.match(winner.body.trackingId, /^REQ-/);
  res = await request(app).get("/api/listings");
  assert.equal(res.body.items.length, 0);

  // Admin sees the link both ways.
  res = await authed("get", "/api/admin/donations?q=Lister");
  assert.equal(res.body.items[0].claimedByRequest.trackingId, winner.body.trackingId);
  res = await authed("get", "/api/admin/requests?q=" + winner.body.trackingId);
  assert.equal(res.body.items[0].linkedDonation.quantity, 7);
  const requestId = res.body.items[0]._id;

  // Release the claim -> listed again; claim again then delete the request -> listed again.
  res = await authed("patch", "/api/admin/donations/" + id).send({ releaseClaim: true });
  assert.equal(res.status, 200);
  assert.equal((await request(app).get("/api/listings")).body.items.length, 1);
  await authed("delete", "/api/admin/requests/" + requestId);
  const again = await request(app).post("/api/listings/" + listing.id + "/claim").send(claimant);
  assert.equal(again.status, 200);
  const reqDoc = (await authed("get", "/api/admin/requests?q=" + again.body.trackingId)).body.items[0];
  await authed("delete", "/api/admin/requests/" + reqDoc._id);
  assert.equal((await request(app).get("/api/listings")).body.items.length, 1);

  res = await request(app).post("/api/listings/not-an-id/claim").send(claimant);
  assert.equal(res.status, 404);
});

test("volunteers: validated sign-up and admin management", async () => {
  let res = await request(app).post("/api/volunteers").send({ name: "V", email: "v@x.co", phone: "1234567", city: "Pune", availability: "weekends", interests: ["hacking"] });
  assert.equal(res.status, 400);
  assert.ok(res.body.errors.interests);
  res = await request(app).post("/api/volunteers").send({
    name: "Vik", email: "vik@example.com", phone: "1234567", city: "Pune", availability: "weekends", interests: ["pickup", "pickup", "delivery"], hasVehicle: true,
  });
  assert.equal(res.status, 201);
  res = await authed("get", "/api/admin/volunteers?status=new");
  assert.equal(res.body.total, 1);
  assert.deepEqual(res.body.items[0].interests, ["pickup", "delivery"]);
  res = await authed("patch", "/api/admin/volunteers/" + res.body.items[0]._id).send({ status: "active" });
  assert.equal(res.body.status, "active");
  res = await authed("get", "/api/admin/stats");
  assert.equal(res.body.volunteers.total, 1);
  assert.equal(res.body.trend.length, 14);
  assert.ok(res.body.trend[13].donations >= 1);
});

test("health reports database connectivity", async () => {
  const res = await request(app).get("/api/health");
  assert.equal(res.status, 200);
  assert.equal(res.body.db, "connected");
});
