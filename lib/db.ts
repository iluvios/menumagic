import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

console.log(`[lib/db.ts] --- START DB INIT (Neon SQL Only) ---`);
console.log(`[lib/db.ts] DATABASE_URL: ${databaseUrl ? "SET" : "NOT SET"}`);

if (!databaseUrl) {
  console.error("[lib/db.ts] DATABASE_URL is not set. Please ensure it's configured in your environment variables.");
  throw new Error("Database connection failed: DATABASE_URL is missing.");
}

// Initialize and export Neon SQL client
export const sql = neon(databaseUrl);

console.log("[lib/db.ts] Neon SQL client initialized.");
console.log(`[lib/db.ts] --- END DB INIT ---`);

// Removing placeholder utility functions if they are not truly part of db setup
// or should be in their own utils file.
// export function formatCurrency(amount: number, currencyCode = "USD"): string { ... }
// export function formatPercentage(value: number): string { ... }
