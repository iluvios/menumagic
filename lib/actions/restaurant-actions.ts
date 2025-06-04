"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
// Import getSession from auth.ts
import { getSession } from "@/lib/auth"

// --- Restaurant Profile Actions ---

// Modify getRestaurantDetails to use session (renamed from getRestaurantProfile)
export async function getRestaurantDetails() {
  const session = await getSession()
  if (!session?.restaurantId) {
    // If no session or restaurantId, return null or handle as unauthenticated
    console.warn("No active session or restaurantId found for getRestaurantDetails.")
    return null
  }

  try {
    const result = await sql`
      SELECT
        id, name, address_json, phone, email, cuisine_type,
        operating_hours_json, currency_code, timezone, default_tax_rate_percentage
      FROM restaurants
      WHERE id = ${session.restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching restaurant details:", error)
    return null
  }
}

export async function updateRestaurantDetails(id: number, data: any) {
  // Renamed from updateRestaurantProfile
  try {
    await sql`
      UPDATE restaurants
      SET
        name = COALESCE(${data.name}, name),
        address_json = COALESCE(${JSON.stringify(data.address_json)}, address_json),
        phone = COALESCE(${data.phone}, phone),
        email = COALESCE(${data.email}, email),
        cuisine_type = COALESCE(${data.cuisine_type}, cuisine_type),
        operating_hours_json = COALESCE(${JSON.stringify(data.operating_hours_json || {})}, operating_hours_json),
        currency_code = COALESCE(${data.currency_code}, currency_code),
        timezone = COALESCE(${data.timezone}, timezone),
        default_tax_rate_percentage = COALESCE(${data.default_tax_rate_percentage}, default_tax_rate_percentage),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/settings/profile")
    return { success: true }
  } catch (error) {
    console.error("Error updating restaurant details:", error)
    return { success: false, error: "Failed to update restaurant details" }
  }
}
