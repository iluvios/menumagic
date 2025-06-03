"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import type { PutBlobResult } from "@vercel/blob"
import { getCategoriesByType as getCategoriesByTypeAction } from "@/lib/actions/category-actions" // Import from new actions
import {
  applyTemplateToMenu as applyTemplateToMenuAction,
  getMenuTemplates as getMenuTemplatesAction,
} from "@/lib/actions/template-actions" // Import applyTemplateToMenu and getMenuTemplates
import { getSession } from "@/lib/auth"

// --- Digital Menus Actions ---

export async function getDigitalMenus() {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getDigitalMenus.")
    return []
  }
  try {
    const result = await sql`
      SELECT id, name, status, qr_code_url, created_at::text, updated_at::text
      FROM digital_menus
      WHERE restaurant_id = ${session.restaurantId}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    throw new Error("Failed to fetch digital menus.")
  }
}

export async function createDigitalMenu(data: { name: string; status: string }) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot create digital menu.")
  }
  try {
    const result = await sql`
      INSERT INTO digital_menus (name, status, restaurant_id) 
      VALUES (${data.name}, ${data.status}, ${session.restaurantId})
      RETURNING id, name, status
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true, id: result[0].id, name: result[0].name, status: result[0].status }
  } catch (error) {
    console.error("Error creating digital menu:", error)
    throw new Error("Failed to create digital menu.")
  }
}

export async function updateDigitalMenu(id: number, data: { name?: string; status?: string; qr_code_url?: string }) {
  try {
    await sql`
      UPDATE digital_menus
      SET 
        name = COALESCE(${data.name}, name),
        status = COALESCE(${data.status}, status),
        qr_code_url = COALESCE(${data.qr_code_url}, qr_code_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error updating digital menu:", error)
    throw new Error("Failed to update digital menu.")
  }
}

export async function deleteDigitalMenu(id: number) {
  try {
    // Also delete associated menu items
    await sql`DELETE FROM menu_items WHERE digital_menu_id = ${id}`
    await sql`DELETE FROM digital_menus WHERE id = ${id}`
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting digital menu:", error)
    throw new Error("Failed to delete digital menu.")
  }
}

// --- Menu Items Actions ---

export async function getMenuItemsByMenuId(digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getMenuItemsByMenuId.")
    return []
  }
  try {
    const result = await sql`
      SELECT 
        mi.id, mi.name, mi.description, mi.price, mi.image_url, mi.menu_category_id,
        c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.digital_menu_id = ${digitalMenuId} AND dm.restaurant_id = ${session.restaurantId}
      ORDER BY c.name ASC, mi.name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching menu items:", error)
    throw new Error("Failed to fetch menu items.")
  }
}

export async function createMenuItem(
  data: {
    digital_menu_id: number
    name: string
    description: string
    price: number
    menu_category_id: number
  },
  imageFile?: File,
) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot create menu item.")
  }

  // Verify that the digital_menu_id belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${data.digital_menu_id} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  let imageUrl: string | undefined = undefined
  if (imageFile) {
    try {
      const blob: PutBlobResult = await put(`menu_items/${imageFile.name}`, imageFile, {
        access: "public",
      })
      imageUrl = blob.url
    } catch (uploadError) {
      console.error("Error uploading image:", uploadError)
      throw new Error("Failed to upload image for menu item.")
    }
  }

  try {
    const result = await sql`
      INSERT INTO menu_items (digital_menu_id, name, description, price, menu_category_id, image_url)
      VALUES (${data.digital_menu_id}, ${data.name}, ${data.description}, ${data.price}, ${data.menu_category_id}, ${imageUrl})
      RETURNING id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true, id: result[0].id }
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
    menu_category_id?: number
    image_url?: string | null // Added for explicit nulling
  },
  imageFile?: File,
) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot update menu item.")
  }

  // Verify that the menu item belongs to the current restaurant
  const itemCheck = await sql`
    SELECT mi.id FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${session.restaurantId}
  `
  if (itemCheck.length === 0) {
    throw new Error("Menu item not found or does not belong to your restaurant.")
  }

  let imageUrlUpdateSql = sql``
  if (imageFile) {
    try {
      const blob: PutBlobResult = await put(`menu_items/${imageFile.name}`, imageFile, {
        access: "public",
      })
      imageUrlUpdateSql = sql`, image_url = ${blob.url}`
    } catch (uploadError) {
      console.error("Error uploading image:", uploadError)
      throw new Error("Failed to upload image for menu item update.")
    }
  } else if (data.hasOwnProperty("image_url") && data.image_url === null) {
    // Explicitly setting image to null
    imageUrlUpdateSql = sql`, image_url = NULL`
  }

  try {
    let query = sql`
      UPDATE menu_items
      SET 
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
        updated_at = CURRENT_TIMESTAMP
    `

    if (imageUrlUpdateSql.query !== "") {
      query = sql`${query} ${imageUrlUpdateSql}`
    }

    query = sql`${query} WHERE id = ${id}`

    await query

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true }
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw new Error("Failed to update menu item.")
  }
}

export async function deleteMenuItem(id: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot delete menu item.")
  }

  // Verify that the menu item belongs to the current restaurant
  const itemCheck = await sql`
    SELECT mi.id FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${session.restaurantId}
  `
  if (itemCheck.length === 0) {
    throw new Error("Menu item not found or does not belong to your restaurant.")
  }

  try {
    await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu item:", error)
    throw new Error("Failed to delete menu item.")
  }
}

// --- Categories Actions (reusing existing categories table for menu categories) ---
// This function is now imported from category-actions.ts
export const getCategoriesByType = getCategoriesByTypeAction

// --- Mock AI Menu Upload ---
export async function mockAiMenuUpload(file: File, digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot perform AI menu upload.")
  }

  console.log(`Mock AI processing for file: ${file.name}, menu ID: ${digitalMenuId}`)
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Fetch existing categories for the current restaurant
  const existingCategories = await getCategoriesByTypeAction("recipe", session.restaurantId)
  const defaultCategoryId = existingCategories.length > 0 ? existingCategories[0].id : 0

  const mockItems = [
    {
      name: "Pizza Margherita (AI)",
      description: "Classic cheese and tomato pizza, AI extracted.",
      price: 12.99,
      menu_category_id: defaultCategoryId,
    },
    {
      name: "Spaghetti Carbonara (AI)",
      description: "Creamy pasta with bacon and egg, AI extracted.",
      price: 15.5,
      menu_category_id: defaultCategoryId,
    },
    {
      name: "Caesar Salad (AI)",
      description: "Fresh salad with Caesar dressing, AI extracted.",
      price: 9.75,
      menu_category_id: defaultCategoryId,
    },
    {
      name: "Tiramisu (AI)",
      description: "Coffee-flavored Italian dessert, AI extracted.",
      price: 7.0,
      menu_category_id: defaultCategoryId,
    },
  ]
  return mockItems.map((item) => ({ ...item, digital_menu_id: digitalMenuId }))
}

export async function getDigitalMenuWithTemplate(digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getDigitalMenuWithTemplate.")
    return null
  }
  try {
    const result = await sql`
      SELECT 
        dm.id, dm.name, dm.status, dm.qr_code_url, dm.template_id,
        dm.created_at::text, dm.updated_at::text,
        mt.name as template_name, mt.template_data_json
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${digitalMenuId} AND dm.restaurant_id = ${session.restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching digital menu with template:", error)
    throw new Error("Failed to fetch digital menu with template.")
  }
}

// Re-export applyTemplateToMenu and getMenuTemplates from template-actions
export const applyTemplateToMenu = applyTemplateToMenuAction
export const getMenuTemplates = getMenuTemplatesAction
