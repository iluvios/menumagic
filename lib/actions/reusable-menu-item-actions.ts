"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers"

interface ReusableMenuItem {
  id: number
  name: string
  description: string
  price: number
  category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  cost_per_serving?: number
}

export async function getReusableMenuItems(): Promise<ReusableMenuItem[]> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const result = await sql`
      SELECT 
        rmi.id, 
        rmi.name, 
        rmi.description, 
        rmi.price, 
        rmi.category_id, 
        c.name as category_name,
        rmi.image_url, 
        rmi.is_available,
        COALESCE(SUM(rdi.quantity_used * COALESCE(isl.cost_per_storage_unit, 0)), 0) as cost_per_serving
      FROM reusable_menu_items rmi
      JOIN categories c ON rmi.category_id = c.id
      LEFT JOIN reusable_dish_ingredients rdi ON rmi.id = rdi.reusable_menu_item_id
      LEFT JOIN ingredients i ON rdi.ingredient_id = i.id
      LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id AND isl.restaurant_id = ${restaurantId}
      WHERE rmi.restaurant_id = ${restaurantId}
      GROUP BY rmi.id, rmi.name, rmi.description, rmi.price, rmi.category_id, c.name, rmi.image_url, rmi.is_available
      ORDER BY rmi.created_at DESC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching reusable menu items:", error)
    throw new Error("Failed to fetch reusable menu items.")
  }
}

export async function createReusableMenuItem(data: {
  name: string
  description: string
  price: number
  category_id: number
  image_file?: File | null
  is_available?: boolean
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create reusable menu item.")
    }

    let imageUrl: string | null = null
    if (data.image_file) {
      imageUrl = await uploadImageToBlob(data.image_file)
    }

    const result = await sql`
      INSERT INTO reusable_menu_items (
        name, 
        description, 
        price, 
        category_id, 
        image_url, 
        is_available,
        restaurant_id
      )
      VALUES (
        ${data.name}, 
        ${data.description}, 
        ${data.price}, 
        ${data.category_id}, 
        ${imageUrl}, 
        ${data.is_available ?? true},
        ${restaurantId}
      )
      RETURNING id, name
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/menu-studio/recipes")
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error) {
    console.error("Error creating reusable menu item:", error)
    throw new Error("Failed to create reusable menu item.")
  }
}

export async function updateReusableMenuItem(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    category_id?: number
    image_file?: File | null
    image_url?: string | null // Allow direct URL update (e.g., for removing image)
    is_available?: boolean
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update reusable menu item.")
    }

    // Verify the reusable menu item belongs to this restaurant
    const itemCheck = await sql`
      SELECT id FROM reusable_menu_items WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Reusable menu item not found or does not belong to this restaurant.")
    }

    let imageUrl: string | null | undefined = data.image_url // Use provided image_url if available
    if (data.image_file !== undefined) {
      if (data.image_file === null) {
        imageUrl = null // Explicitly set to null if file is null
      } else if (data.image_file instanceof File) {
        imageUrl = await uploadImageToBlob(data.image_file)
      }
    }

    const result = await sql`
      UPDATE reusable_menu_items
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        category_id = COALESCE(${data.category_id}, category_id),
        image_url = COALESCE(${imageUrl}, image_url),
        is_available = COALESCE(${data.is_available}, is_available),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/menu-studio/recipes")
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error) {
    console.error("Error updating reusable menu item:", error)
    throw new Error("Failed to update reusable menu item.")
  }
}

export async function deleteReusableMenuItem(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to delete reusable menu item.")
    }

    // Verify the reusable menu item belongs to this restaurant
    const itemCheck = await sql`
      SELECT id FROM reusable_menu_items WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Reusable menu item not found or does not belong to this restaurant.")
    }

    await sql`
      DELETE FROM reusable_menu_items
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/menu-studio/recipes")
    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting reusable menu item:", error)
    throw new Error("Failed to delete reusable menu item.")
  }
}
