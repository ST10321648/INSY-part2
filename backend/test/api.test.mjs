import { test, before } from "node:test";
import assert from "node:assert/strict";
import request from "supertest";
import { getDb } from "../src/db.js";
import { app } from "../src/app.js";


const agent = request.agent(app);

let csrfToken;
let accessToken;

before(async () => {
  const db = await getDb();
  await db.exec("DELETE FROM refresh_tokens; DELETE FROM payments; DELETE FROM users;");
});

test("GET /api/csrf-token yields a CSRF token", async () => {
  const res = await agent.get("/api/csrf-token");
  assert.equal(res.status, 200);
  assert.ok(res.body.csrfToken);
  csrfToken = res.body.csrfToken;
});

test("POST /api/auth/register -> 201", async () => {
  const res = await agent
    .post("/api/auth/register")
    .set("csrf-token", csrfToken)
    .send({ email: "test@example.com", password: "Passw0rd!" });
  assert.equal(res.status, 201);
});

test("POST /api/auth/login -> access token", async () => {
  const res = await agent
    .post("/api/auth/login")
    .set("csrf-token", csrfToken)
    .send({ email: "test@example.com", password: "Passw0rd!" });
  assert.equal(res.status, 200);
  assert.ok(res.body.accessToken);
  accessToken = res.body.accessToken;
});

test("Rejects bad payment (400)", async () => {
  const res = await agent
    .post("/api/payments")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("csrf-token", csrfToken)
    .send({
      amount: "abc",
      currency: "USD",
      recipient: "Bob",
      provider: "SWIFT",
      account_number: "12345678",
      swift_code: "ABCDEFGH"
    });
  assert.equal(res.status, 400);
});

test("Accepts valid payment (201)", async () => {
  const res = await agent
    .post("/api/payments")
    .set("Authorization", `Bearer ${accessToken}`)
    .set("csrf-token", csrfToken)
    .send({
      amount: "12.34",
      currency: "USD",
      recipient: "Alice Smith",
      provider: "SWIFT",
      account_number: "123456789012",
      swift_code: "ABCDEFGH123"
    });
  assert.equal(res.status, 201);
  assert.equal(res.body.message, "Payment recorded");
});

test("Lists payments (GET /api/payments)", async () => {
  const res = await agent
    .get("/api/payments")
    .set("Authorization", `Bearer ${accessToken}`);
  assert.equal(res.status, 200);
  assert.ok(Array.isArray(res.body));
  assert.equal(res.body[0].amount, "12.34");
  assert.equal(res.body[0].currency, "USD");
  assert.equal(res.body[0].provider, "SWIFT");
});
