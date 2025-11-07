// backend/src/seedEmployees.js
import "dotenv/config";
import bcrypt from "bcrypt";
import { connectDb, Employee } from "./db.js";

async function seedEmployees() {
  await connectDb();

  const existing = await Employee.countDocuments();
  if (existing > 0) {
    console.log(`Employees already exist (${existing}), skipping seeding.`);
    process.exit(0);
  }

  const defaults = [
    {
      email: "verifier@bank.com",
      name: "Verifier One",
      role: "employee",
      password: "EmpPassw0rd!"
    },
    {
      email: "admin@bank.com",
      name: "Admin User",
      role: "admin",
      password: "AdminPassw0rd!"
    }
  ];

  for (const emp of defaults) {
    const hash = await bcrypt.hash(emp.password, 12);
    await Employee.create({
      email: emp.email,
      name: emp.name,
      role: emp.role,
      password_hash: hash
    });
    console.log(`Seeded employee: ${emp.email} / ${emp.password}`);
  }

  console.log("Employee seeding complete.");
  process.exit(0);
}

seedEmployees().catch((err) => {
  console.error("Error seeding employees:", err);
  process.exit(1);
});
