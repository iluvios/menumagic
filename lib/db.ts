import { neon } from "@neondatabase/serverless"

const databaseUrl = process.env.DATABASE_URL

// Explicitly log the DATABASE_URL to see its value during initialization
console.log(
  `[lib/db.ts] Attempting to connect to database. DATABASE_URL: ${databaseUrl ? "***** (present)" : "undefined"}`,
)

if (!databaseUrl) {
  console.error("[lib/db.ts] DATABASE_URL is not set. Please ensure it's configured in your environment variables.")
  throw new Error("Database connection failed: DATABASE_URL is missing.")
}

export const sql = neon(databaseUrl)

export function formatCurrency(amount: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100) // Assuming value is a percentage like 50 for 50%
}
