"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

export { getCategoriesByType } from "@/lib/actions/category-actions"

// --- Ingredient Actions ---

export async function getIngredients() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const result = await sql`
      SELECT 
        i.id, i.sku, i.name, i.unit, i.cost_per_unit,
        i.purchase_unit, i.purchase_unit_cost, i.storage_unit,
        i.conversion_factor_purchase_to_storage, i.calculated_storage_unit_cost,
        i.low_stock_threshold_quantity,
        c.id as category_id, c.name as category_name,
        s.id as supplier_id, s.name as supplier_name
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.preferred_supplier_id = s.id
      WHERE i.restaurant_id = ${restaurantId}
      ORDER BY i.name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    throw new Error("Failed to fetch ingredients.")
  }
}

export async function createIngredient(data: {
  name: string
  sku: string
  category_id: number
  unit: string
  cost_per_unit: number
  supplier_id?: number
  purchase_unit?: string
  purchase_unit_cost?: number
  storage_unit?: string
  conversion_factor_purchase_to_storage?: number
  low_stock_threshold_quantity?: number
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create ingredient.")
    }

    // Calculate calculated_storage_unit_cost
    const calculated_storage_unit_cost =
      data.purchase_unit_cost && data.conversion_factor_purchase_to_storage
        ? data.purchase_unit_cost / data.conversion_factor_purchase_to_storage
        : data.cost_per_unit // Fallback if conversion not provided

    const result = await sql`
      INSERT INTO ingredients (
        restaurant_id, sku, name, category_id, unit, cost_per_unit,
        preferred_supplier_id, purchase_unit, purchase_unit_cost, storage_unit,
        conversion_factor_purchase_to_storage, calculated_storage_unit_cost,
        low_stock_threshold_quantity
      )
      VALUES (
        ${restaurantId},
        ${data.sku}, ${data.name}, ${data.category_id}, ${data.unit}, ${data.cost_per_unit},
        ${data.supplier_id || null}, ${data.purchase_unit || null}, ${data.purchase_unit_cost || null}, ${data.storage_unit || null},
        ${data.conversion_factor_purchase_to_storage || null}, ${calculated_storage_unit_cost},
        ${data.low_stock_threshold_quantity || null}
      )
      RETURNING id
    `
    revalidatePath("/dashboard/operations-hub/ingredients")
    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("Error creating ingredient:", error)
    throw new Error("Failed to create ingredient.")
  }
}

export async function updateIngredient(
  id: number,
  data: {
    name?: string
    sku?: string
    category_id?: number
    unit?: string
    cost_per_unit?: number
    supplier_id?: number
    purchase_unit?: string
    purchase_unit_cost?: number
    storage_unit?: string
    conversion_factor_purchase_to_storage?: number
    low_stock_threshold_quantity?: number
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update ingredient.")
    }

    // Recalculate calculated_storage_unit_cost if relevant fields are updated
    let calculated_storage_unit_cost = data.calculated_storage_unit_cost // Use existing if not updated
    if (data.purchase_unit_cost !== undefined || data.conversion_factor_purchase_to_storage !== undefined) {
      const currentIngredient = (
        await sql`SELECT purchase_unit_cost, conversion_factor_purchase_to_storage, cost_per_unit FROM ingredients WHERE id = ${id}`
      )[0]
      const effectivePurchaseCost =
        data.purchase_unit_cost !== undefined ? data.purchase_unit_cost : currentIngredient.purchase_unit_cost
      const effectiveConversionFactor =
        data.conversion_factor_purchase_to_storage !== undefined
          ? data.conversion_factor_purchase_to_storage
          : currentIngredient.conversion_factor_purchase_to_storage
      const effectiveCostPerUnit =
        data.cost_per_unit !== undefined ? data.cost_per_unit : currentIngredient.cost_per_unit

      if (effectivePurchaseCost && effectiveConversionFactor) {
        calculated_storage_unit_cost = effectivePurchaseCost / effectiveConversionFactor
      } else {
        calculated_storage_unit_cost = effectiveCostPerUnit
      }
    }

    await sql`
      UPDATE ingredients
      SET 
        name = COALESCE(${data.name}, name),
        sku = COALESCE(${data.sku}, sku),
        category_id = COALESCE(${data.category_id}, category_id),
        unit = COALESCE(${data.unit}, unit),
        cost_per_unit = COALESCE(${data.cost_per_unit}, cost_per_unit),
        preferred_supplier_id = COALESCE(${data.supplier_id || null}, preferred_supplier_id),
        purchase_unit = COALESCE(${data.purchase_unit}, purchase_unit),
        purchase_unit_cost = COALESCE(${data.purchase_unit_cost}, purchase_unit_cost),
        storage_unit = COALESCE(${data.storage_unit}, storage_unit),
        conversion_factor_purchase_to_storage = COALESCE(${data.conversion_factor_purchase_to_storage}, conversion_factor_purchase_to_storage),
        calculated_storage_unit_cost = COALESCE(${calculated_storage_unit_cost}, calculated_storage_unit_cost),
        low_stock_threshold_quantity = COALESCE(${data.low_stock_threshold_quantity}, low_stock_threshold_quantity),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/operations-hub/ingredients")
    return { success: true }
  } catch (error) {
    console.error("Error updating ingredient:", error)
    throw new Error("Failed to update ingredient.")
  }
}

export async function deleteIngredient(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete ingredient.")
    }

    await sql`
      DELETE FROM ingredients
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/operations-hub/ingredients")
    return { success: true }
  } catch (error) {
    console.error("Error deleting ingredient:", error)
    throw new Error("Failed to delete ingredient. Ensure no recipes or invoices are linked to it.")
  }
}
