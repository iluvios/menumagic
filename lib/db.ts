import { PrismaClient } from '@prisma/client';
import { neon } from "@neondatabase/serverless";

const databaseUrl = process.env.DATABASE_URL;

console.log(`[lib/db.ts] --- START DB INIT ---`);
console.log(`[lib/db.ts] DATABASE_URL: ${databaseUrl ? "SET" : "NOT SET"}`);
if (!databaseUrl) {
  console.error("[lib/db.ts] DATABASE_URL is not set. Please ensure it's configured in your environment variables.");
  throw new Error("Database connection failed: DATABASE_URL is missing.");
}

// Initialize Neon SQL client
export const sql = neon(databaseUrl);
console.log("[lib/db.ts] Neon SQL client initialized.");

// Initialize Prisma Client
let prisma: PrismaClient;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
  console.log("[lib/db.ts] Prisma Client initialized for production.");
} else {
  // @ts-ignore
  if (!global.prisma) {
    // @ts-ignore
    global.prisma = new PrismaClient({
      // log: ['query', 'info', 'warn', 'error'], // Optional: for development logging
    });
    console.log("[lib/db.ts] New Prisma Client instance created for development.");
  }
  // @ts-ignore
  prisma = global.prisma;
  console.log("[lib/db.ts] Reusing existing Prisma Client instance for development.");
}

export const db = prisma; // This is your Prisma Client instance

console.log(`[lib/db.ts] --- END DB INIT ---`);

// Placeholder utility functions (can be removed if not used or moved)
export function formatCurrency(amount: number, currencyCode = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode }).format(amount);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value / 100); // Assuming value is 0-100 for percentage
}
