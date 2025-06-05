import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

console.log(`[lib/db.ts] --- START DB INIT (Neon SQL Only) ---`)
console.log(`[lib/db.ts] DATABASE_URL: ${databaseUrl ? "SET" : "NOT SET"}`)

if (!databaseUrl) {
  console.error("[lib/db.ts] DATABASE_URL is not set. Please ensure it's configured in your environment variables.")
  throw new Error("Database connection failed: DATABASE_URL is missing.")
}

// Initialize and export Neon SQL client
export const sql = neon(databaseUrl)

console.log("[lib/db.ts] Neon SQL client initialized.")
console.log(`[lib/db.ts] --- END DB INIT ---`)

// Legacy formatter functions - these should be imported from lib/utils/client-formatters.ts instead
export function formatCurrency(amount: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100)
}
