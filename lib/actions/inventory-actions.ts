"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// --- Inventory Actions ---

export async function getInventoryLevels() {
  try {
    // TODO: Filter by restaurant_id
    const result = await sql`
      SELECT 
        i.id as ingredient_id,
        i.name as ingredient_name,
        i.sku,
        c.name as category_name,
        COALESCE(isl.current_quantity_in_storage_units, 0)::numeric(10,3) as current_quantity_in_storage_units,
        i.storage_unit,
        i.calculated_storage_unit_cost,
        i.low_stock_threshold_quantity,
        isl.last_updated_at::text
      FROM ingredients i
      LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id
      LEFT JOIN categories c ON i.category_id = c.id
      ORDER BY i.name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching inventory levels:", error)
    return []
  }
}

export async function createInventoryAdjustment(data: {
  ingredient_id: number
  quantity_adjusted: number
  reason_code: string
  notes?: string
  user_id?: number
}) {
  try {
    // Record the adjustment
    const adjustmentResult = await sql`
      INSERT INTO inventory_adjustments (
        ingredient_id, quantity_adjusted, reason_code, notes, user_id
      )
      VALUES (
        ${data.ingredient_id}, ${data.quantity_adjusted}, ${data.reason_code}, ${data.notes}, ${data.user_id || null}
      )
      RETURNING id
    `

    // Update the current stock level
    await sql`
      INSERT INTO inventory_stock_levels (ingredient_id, current_quantity_in_storage_units, last_updated_at)
      VALUES (${data.ingredient_id}, ${data.quantity_adjusted}, CURRENT_TIMESTAMP)
      ON CONFLICT (ingredient_id) DO UPDATE
      SET 
        current_quantity_in_storage_units = inventory_stock_levels.current_quantity_in_storage_units + EXCLUDED.current_quantity_in_storage_units,
        last_updated_at = CURRENT_TIMESTAMP
    `

    revalidatePath("/dashboard/operations-hub/inventory")
    return { success: true, id: adjustmentResult[0].id }
  } catch (error) {
    console.error("Error creating inventory adjustment:", error)
    return { success: false, error: "Failed to create inventory adjustment" }
  }
}

export async function getInventoryHistory() {
  try {
    // TODO: Filter by restaurant_id
    const result = await sql`
      SELECT 
        ia.id,
        ia.adjustment_date::text,
        ia.quantity_adjusted::numeric(10,3) as quantity_adjusted,
        ia.reason_code,
        ia.notes,
        i.name as ingredient_name,
        u.full_name as user_name
      FROM inventory_adjustments ia
      JOIN ingredients i ON ia.ingredient_id = i.id
      LEFT JOIN users u ON ia.user_id = u.id
      ORDER BY ia.adjustment_date DESC
      LIMIT 50
    `
    return result || []
  } catch (error) {
    console.error("Error fetching inventory history:", error)
    return []
  }
}
