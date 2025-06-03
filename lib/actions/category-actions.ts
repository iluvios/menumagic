"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

// All exported functions in this file MUST be async.

export async function getCategories(restaurantId?: number) {
  try {
    const currentRestaurantId = restaurantId || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const result = await sql`
      SELECT id, name, type
      FROM categories
      WHERE restaurant_id = ${currentRestaurantId}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching all categories:", error)
    throw new Error("Failed to fetch all categories.")
  }
}

export async function getCategoriesByType(type: string, restaurantId?: number) {
  try {
    const currentRestaurantId = restaurantId || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const result = await sql`
      SELECT id, name, type
      FROM categories
      WHERE type = ${type} AND restaurant_id = ${currentRestaurantId}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error(`Error fetching categories of type ${type}:`, error)
    throw new Error(`Failed to fetch categories for type ${type}.`)
  }
}

export async function createCategory(data: { name: string; type: string; restaurant_id?: number }) {
  try {
    const currentRestaurantId = data.restaurant_id || (await getRestaurantIdFromSession())
    if (!currentRestaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create category.")
    }

    const result = await sql`
      INSERT INTO categories (name, type, restaurant_id)
      VALUES (${data.name}, ${data.type}, ${currentRestaurantId})
      RETURNING id, name, type
    `
    revalidatePath("/dashboard/menus") // Revalidate paths that might display categories
    return result[0]
  } catch (error) {
    console.error("Error creating category:", error)
    throw new Error("Failed to create category.")
  }
}

export async function updateCategory(id: number, data: { name?: string; type?: string }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update category.")
    }

    await sql`
      UPDATE categories
      SET 
        name = COALESCE(${data.name}, name),
        type = COALESCE(${data.type}, type),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/menus")
    return { success: true }
  } catch (error) {
    console.error("Error updating category:", error)
    throw new Error("Failed to update category.")
  }
}

export async function deleteCategory(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete category.")
    }

    await sql`
      DELETE FROM categories
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/menus")
    return { success: true }
  } catch (error) {
    console.error("Error deleting category:", error)
    throw new Error("Failed to delete category.")
  }
}
