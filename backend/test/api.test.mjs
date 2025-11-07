// backend/test/api.test.mjs
import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import bcrypt from "bcrypt";

import { connectDb, clearDatabase, Employee, Payment } from "../src/db.js";
import { app } from "../src/app.js";

const agent = request.agent(app);

let csrfToken;
let customerAccessToken;
let employeeAccessToken;
let createdPaymentId;

before(async () => {
  // Connect to Mongo and start with a clean test DB
  await connectDb();
  await clearDatabase();

  // Seed ONE test employee directly in the test database
  const hash = await bcrypt.hash("EmpPassw0rd!", 12);
  await Employee.create({
    email: "verifier@bank.com",
    name: "Verifier One",
    role: "employee",
    password_hash: hash
  });

  // Fetch a CSRF token for subsequent POST requests
  const csrfRes = await agent.get("/api/csrf-token");
  assert.equal(csrfRes.statusCode, 200);
  csrfToken = csrfRes.body.csrfToken;
  assert.ok(csrfToken);
});

// --- CUSTOMER FLOW ---

test("Customer can register", async () => {
  const res = await agent
    .post("/api/auth/register")
    .set("csrf-token", csrfToken)
    .send({ email: "test@example.com", password: "Passw0rd!" });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, "Registered");
});

test("Customer can login and receives access token", async () => {
  const res = await agent
    .post("/api/auth/login")
    .set("csrf-token", csrfToken)
    .send({ email: "test@example.com", password: "Passw0rd!" });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.accessToken);
  customerAccessToken = res.body.accessToken;
});

test("Customer can create a payment", async () => {
  const res = await agent
    .post("/api/payments")
    .set("Authorization", `Bearer ${customerAccessToken}`)
    .set("csrf-token", csrfToken)
    .send({
      amount: "12.34",
      currency: "USD",
      recipient: "John Doe",
      provider: "SWIFT",
      account_number: "123456789012",
      swift_code: "ABCDEF12"
    });

  assert.equal(res.statusCode, 201);
  assert.equal(res.body.message, "Payment recorded");
});

test("Customer can list own payments (GET /api/payments)", async () => {
  const res = await agent
    .get("/api/payments")
    .set("Authorization", `Bearer ${customerAccessToken}`);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);

  const p = res.body[0];
  assert.equal(p.amount, "12.34");
  assert.equal(p.currency, "USD");
  assert.equal(p.provider, "SWIFT");
  // customer sees masked account number
  assert.notEqual(p.account_number, "123456789012");

  // Save the underlying payment id from the DB for employee actions
  const paymentDoc = await Payment.findOne({}).lean();
  createdPaymentId = paymentDoc._id.toString();
});

// --- EMPLOYEE FLOW ---

test("Employee can login and receives access token", async () => {
  const res = await agent
    .post("/api/employee/auth/login")
    .set("csrf-token", csrfToken)
    .send({ email: "verifier@bank.com", password: "EmpPassw0rd!" });

  assert.equal(res.statusCode, 200);
  assert.ok(res.body.accessToken);
  employeeAccessToken = res.body.accessToken;
});

test("Employee can see all payments with full details", async () => {
  const res = await agent
    .get("/api/employee/payments")
    .set("Authorization", `Bearer ${employeeAccessToken}`);

  assert.equal(res.statusCode, 200);
  assert.ok(Array.isArray(res.body));
  assert.ok(res.body.length >= 1);

  const p = res.body[0];
  assert.equal(p.amount, "12.34");
  assert.equal(p.currency, "USD");
  assert.equal(p.provider, "SWIFT");
  // employee should see FULL account number
  assert.equal(p.account_number, "123456789012");
});

test("Employee can verify a payment", async () => {
  const res = await agent
    .post(`/api/employee/payments/${createdPaymentId}/verify`)
    .set("Authorization", `Bearer ${employeeAccessToken}`)
    .set("csrf-token", csrfToken);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Payment verified");
});

test("Employee can submit a verified payment to SWIFT", async () => {
  const res = await agent
    .post(`/api/employee/payments/${createdPaymentId}/submit`)
    .set("Authorization", `Bearer ${employeeAccessToken}`)
    .set("csrf-token", csrfToken);

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.message, "Payment submitted to SWIFT (simulated)");
});
