"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers"

interface MenuItem {
  id: number
  digital_menu_id: number
  reusable_menu_item_id?: number | null
  name: string
  description: string
  price: number
  category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  order_index: number
}

export async function getMenuItemsByMenuId(digitalMenuId: number): Promise<MenuItem[]> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    const result = await sql`
      SELECT 
        mi.id, 
        mi.digital_menu_id, 
        mi.reusable_menu_item_id,
        mi.name, 
        mi.description, 
        mi.price, 
        mi.category_id, 
        c.name as category_name,
        mi.image_url, 
        mi.is_available,
        mi.order_index
      FROM menu_items mi
      JOIN categories c ON mi.category_id = c.id
      WHERE mi.digital_menu_id = ${digitalMenuId}
      ORDER BY mi.order_index ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching menu items:", error)
    throw new Error("Failed to fetch menu items.")
  }
}

export async function createMenuItem(data: {
  digital_menu_id: number
  reusable_menu_item_id?: number | null
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
      throw new Error("Authentication required to create menu item.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${data.digital_menu_id} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    let imageUrl: string | null = null
    if (data.image_file) {
      imageUrl = await uploadImageToBlob(data.image_file)
    }

    // Find the maximum order_index for this specific menu
    const maxOrderResult = await sql<{ max_order: number }[]>`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM menu_items
      WHERE digital_menu_id = ${data.digital_menu_id};
    `
    const nextOrderIndex = maxOrderResult[0].max_order + 1

    const result = await sql`
      INSERT INTO menu_items (
        digital_menu_id, 
        reusable_menu_item_id, 
        name, 
        description, 
        price, 
        category_id, 
        image_url, 
        is_available,
        order_index
      )
      VALUES (
        ${data.digital_menu_id}, 
        ${data.reusable_menu_item_id || null}, 
        ${data.name}, 
        ${data.description}, 
        ${data.price}, 
        ${data.category_id}, 
        ${imageUrl}, 
        ${data.is_available ?? true},
        ${nextOrderIndex}
      )
      RETURNING id, name
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu/${data.digital_menu_id}`)
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return result[0]
  } catch (error) {
    console.error("Error creating menu item:", error)
    throw new Error("Failed to create menu item.")
  }
}

export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    category_id?: number
    image_file?: File | null
    image_url?: string | null // Allow direct URL update (e.g., for removing image)
    is_available?: boolean
    order_index?: number
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update menu item.")
    }

    // Verify the menu item belongs to a digital menu owned by this restaurant
    const itemCheck = await sql`
      SELECT mi.id 
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
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
      UPDATE menu_items
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        category_id = COALESCE(${data.category_id}, category_id),
        image_url = COALESCE(${imageUrl}, image_url),
        is_available = COALESCE(${data.is_available}, is_available),
        order_index = COALESCE(${data.order_index}, order_index),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, digital_menu_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu/${result[0].digital_menu_id}`)
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return result[0]
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw new Error("Failed to update menu item.")
  }
}

export async function deleteMenuItem(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to delete menu item.")
    }

    // Get digital_menu_id before deleting for revalidation
    const [menuItem] = await sql`SELECT digital_menu_id FROM menu_items WHERE id = ${id}`
    if (!menuItem) {
      throw new Error("Menu item not found.")
    }

    // Verify the menu item belongs to a digital menu owned by this restaurant
    const itemCheck = await sql`
      SELECT mi.id 
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu/${menuItem.digital_menu_id}`)
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu item:", error)
    throw new Error("Failed to delete menu item.")
  }
}

export async function updateMenuItemOrder(updates: { id: number; order_index: number }[]): Promise<void> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update menu item order.")
    }

    let digitalMenuIdToRevalidate: number | null = null

    for (const update of updates) {
      // Verify ownership of the menu_item entry
      const checkOwnership = await sql`
        SELECT mi.id, mi.digital_menu_id
        FROM menu_items mi
        JOIN digital_menus dm ON mi.digital_menu_id = dm.id
        WHERE mi.id = ${update.id} AND dm.restaurant_id = ${restaurantId}
      `
      if (checkOwnership.length === 0) {
        throw new Error(`Menu item with ID ${update.id} not found or does not belong to this restaurant.`)
      }
      if (!digitalMenuIdToRevalidate) {
        digitalMenuIdToRevalidate = checkOwnership[0].digital_menu_id
      }

      await sql`
        UPDATE menu_items
        SET order_index = ${update.order_index}
        WHERE id = ${update.id};
      `
    }

    if (digitalMenuIdToRevalidate) {
      revalidatePath(`/dashboard/menu-studio/digital-menu/${digitalMenuIdToRevalidate}`)
      revalidatePath("/dashboard/menu-studio/digital-menu")
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update menu item order.")
  }
}
