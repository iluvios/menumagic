"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

export async function getCategories(restaurantId?: number) {
  try {
    const currentRestaurantId = restaurantId || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("[SERVER] getCategories: No restaurant ID found for session.")
      return []
    }

    console.log(`[SERVER] getCategories: Fetching all categories for restaurant ID: ${currentRestaurantId}`)
    const result = await sql`
      SELECT id, name, type
      FROM categories
      WHERE restaurant_id = ${currentRestaurantId}
      ORDER BY name ASC
    `
    console.log(`[SERVER] getCategories: Fetched ${result.length} categories. Example:`, result[0])
    return result || []
  } catch (error: any) {
    console.error("[SERVER] getCategories: Error fetching all categories:", error.message, error) // Log full error object
    throw new Error("Failed to fetch all categories.")
  }
}

export async function getCategoriesByType(type: string, restaurantId?: number) {
  try {
    const currentRestaurantId = restaurantId || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("[SERVER] getCategoriesByType: No restaurant ID found for session.")
      return []
    }

    console.log(
      `[SERVER] getCategoriesByType: Fetching categories of type: "${type}" for restaurant ID: ${currentRestaurantId}`,
    )
    const result = await sql`
      SELECT id, name, type
      FROM categories
      WHERE type = ${type} AND restaurant_id = ${currentRestaurantId}
      ORDER BY name ASC
    `
    console.log(
      `[SERVER] getCategoriesByType: Fetched ${result.length} categories for type "${type}". Example:`,
      result[0],
    )
    return result || []
  } catch (error: any) {
    console.error(`[SERVER] getCategoriesByType: Error fetching categories of type "${type}":`, error.message, error) // Log full error object
    throw new Error(`Failed to fetch categories for type ${type}.`)
  }
}

export async function createCategory(data: { name: string; type: string; restaurant_id?: number }) {
  try {
    const currentRestaurantId = data.restaurant_id || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("[SERVER] createCategory: No restaurant ID found for session.")
      throw new Error("Authentication required to create category.")
    }

    console.log(
      `[SERVER] createCategory: Attempting to create category: Name="${data.name}", Type="${data.type}", Restaurant ID=${currentRestaurantId}`,
    )
    const result = await sql`
      INSERT INTO categories (name, type, restaurant_id)
      VALUES (${data.name}, ${data.type}, ${currentRestaurantId})
      RETURNING id, name, type
    `
    console.log("[SERVER] createCategory: Category creation successful:", result[0])
    revalidatePath("/dashboard/menus") // Revalidate paths that might display categories
    return result[0]
  } catch (error: any) {
    console.error("[SERVER] createCategory: Error creating category:", error.message, error) // Log full error object
    throw new Error("Failed to create category.")
  }
}

export async function updateCategory(id: number, data: { name?: string; type?: string }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("[SERVER] updateCategory: No restaurant ID found for session.")
      throw new Error("Authentication required to update category.")
    }

    console.log(
      `[SERVER] updateCategory: Attempting to update category ID ${id} for restaurant ID ${restaurantId}. Data:`,
      data,
    )
    await sql`
      UPDATE categories
      SET 
        name = COALESCE(${data.name}, name),
        type = COALESCE(${data.type}, type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    console.log(`[SERVER] updateCategory: Category ID ${id} updated successfully.`)
    revalidatePath("/dashboard/menus")
    return { success: true }
  } catch (error: any) {
    console.error("[SERVER] updateCategory: Error updating category:", error.message, error) // Log full error object
    throw new Error("Failed to update category.")
  }
}

export async function deleteCategory(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("[SERVER] deleteCategory: No restaurant ID found for session.")
      throw new Error("Authentication required to delete category.")
    }

    console.log(`[SERVER] deleteCategory: Attempting to delete category ID ${id} for restaurant ID ${restaurantId}.`)
    await sql`
      DELETE FROM categories
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    console.log(`[SERVER] deleteCategory: Category ID ${id} deleted successfully.`)
    revalidatePath("/dashboard/menus")
    return { success: true }
  } catch (error: any) {
    console.error("[SERVER] deleteCategory: Error deleting category:", error.message, error) // Log full error object
    throw new Error("Failed to delete category.")
  }
}
