// backend/src/db.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

let connectionPromise = null;

export async function connectDb() {
  if (!connectionPromise) {
    const uri = process.env.NODE_ENV === "test"
      ? process.env.MONGO_URI_TEST
      : process.env.MONGO_URI;

    if (!uri) {
      throw new Error("Missing MONGO_URI / MONGO_URI_TEST environment variables");
    }

    connectionPromise = mongoose.connect(uri);
  }
  return connectionPromise;
}

// ----- Schemas & Models -----

// Customers
const userSchema = new Schema({
  email: { type: String, required: true, unique: true },
  password_hash: { type: String, required: true },
  failed_logins: { type: Number, default: 0 },
  lockout_until: { type: Date, default: null },
  created_at: { type: Date, default: Date.now }
});

// Employees (NO self-registration)
const employeeSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  role: { type: String, enum: ["employee", "admin"], default: "employee" },
  password_hash: { type: String, required: true }
});

// Refresh tokens – only used for CUSTOMERS in this design
const refreshTokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true, index: true },
  expires_at: { type: Date, required: true }
});

// Payments
const paymentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  amount_cents: { type: Number, required: true },
  currency: { type: String, required: true },
  recipient: { type: String, required: true },
  provider: { type: String, required: true },
  account_number: { type: String, required: true },
  swift_code: { type: String, required: true },
  created_at: { type: Date, default: Date.now },

  // Audit fields for employee workflow
  verified: { type: Boolean, default: false },
  verified_by: { type: Schema.Types.ObjectId, ref: "Employee", default: null },
  verified_at: { type: Date, default: null },
  submitted_to_swift: { type: Boolean, default: false },
  submitted_at: { type: Date, default: null }
});

export const User = model("User", userSchema);
export const Employee = model("Employee", employeeSchema);
export const RefreshToken = model("RefreshToken", refreshTokenSchema);
export const Payment = model("Payment", paymentSchema);

// Helper for tests / reset
export async function clearDatabase() {
  await Promise.all([
    User.deleteMany({}),
    Employee.deleteMany({}),
    RefreshToken.deleteMany({}),
    Payment.deleteMany({})
  ]);
}

// Auto-connect outside tests
if (process.env.NODE_ENV !== "test") {
  connectDb().catch((err) => {
    console.error("MongoDB connection error:", err);
  });
}
