import sqlite3 from "sqlite3";
import { open } from "sqlite";

let dbPromise = null;

export async function getDb() {
  if (!dbPromise) {
    const filename =
      process.env.NODE_ENV === "test"
        ? "./test.sqlite"      // <-- persistent file for tests
        : "./data.sqlite";

    dbPromise = open({
      filename,
      driver: sqlite3.Database
    });

    const db = await dbPromise;
    await db.exec(`PRAGMA foreign_keys = ON;`);

    // Base tables
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        failed_logins INTEGER DEFAULT 0,
        lockout_until INTEGER DEFAULT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        token TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        amount_cents INTEGER NOT NULL,
        currency TEXT NOT NULL,
        recipient TEXT NOT NULL,
        provider TEXT NOT NULL,
        account_number TEXT NOT NULL,
        swift_code TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Lightweight migration if old DB lacks columns
    const pragma = await db.all(`PRAGMA table_info(payments);`);
    const cols = new Set(pragma.map(c => c.name));
    const missing = [];
    if (!cols.has("provider")) missing.push(`ADD COLUMN provider TEXT NOT NULL DEFAULT 'SWIFT'`);
    if (!cols.has("account_number")) missing.push(`ADD COLUMN account_number TEXT NOT NULL DEFAULT ''`);
    if (!cols.has("swift_code")) missing.push(`ADD COLUMN swift_code TEXT NOT NULL DEFAULT ''`);
    for (const stmt of missing) await db.exec(`ALTER TABLE payments ${stmt};`);
  }

  return dbPromise;
}
