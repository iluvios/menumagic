import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

console.log(`[lib/db.ts] --- START DB INIT ---`)
console.log(`[lib/db.ts] DATABASE_URL: ${databaseUrl ? "SET" : "NOT SET"}`)
if (!databaseUrl) {
  console.error("[lib/db.ts] DATABASE_URL is not set. Please ensure it's configured in your environment variables.")
  throw new Error("Database connection failed: DATABASE_URL is missing.")
}

export const sql = neon(databaseUrl)
export const db = sql // Exporting sql as db to satisfy the missing export error
console.log("[lib/db.ts] Neon SQL client initialized.")
console.log(`[lib/db.ts] --- END DB INIT ---`)

// Placeholder exports to satisfy deployment checks
export function formatCurrency(amount: number, currencyCode = "USD"): string {
  // This is a placeholder. The actual implementation should be in lib/utils/client-formatters.ts
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount)
}

export function formatPercentage(value: number): string {
  // This is a placeholder. The actual implementation should be in lib/utils/client-formatters.ts
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}
