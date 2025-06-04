"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  order_index: number
  reusable_menu_item_id?: number
}

export async function getMenuItemsByMenuId(digitalMenuId: number): Promise<MenuItem[]> {
  try {
    const { rows } = await sql<MenuItem>`
      SELECT 
        mi.id, 
        mi.name, 
        mi.description, 
        mi.price, 
        mi.image_url, 
        mi.menu_category_id,
        mi.order_index, 
        mi.reusable_menu_item_id
      FROM menu_items mi
      WHERE mi.menu_category_id = ${digitalMenuId}
      ORDER BY mi.order_index ASC
    `
    return rows || []
  } catch (error) {
    console.error("Error fetching menu items:", error)
    throw new Error("Failed to fetch menu items.")
  }
}

export async function createMenuItem(
  digitalMenuId: number,
  itemData: {
    name: string
    description: string
    price: number
    image?: File | null
    menu_category_id: number
    order_index: number
    reusable_menu_item_id?: number
  },
): Promise<MenuItem> {
  let imageUrl: string | undefined = undefined

  if (itemData.image) {
    imageUrl = await uploadImageToBlob(itemData.image)
  }

  try {
    const { rows } = await sql<MenuItem>`
      INSERT INTO menu_items (menu_category_id, name, description, price, image_url, order_index, reusable_menu_item_id)
      VALUES (${itemData.menu_category_id}, ${itemData.name}, ${itemData.description}, ${itemData.price}, ${imageUrl}, ${itemData.order_index}, ${itemData.reusable_menu_item_id})
      RETURNING id, name, description, price, image_url, menu_category_id, order_index, reusable_menu_item_id;
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${digitalMenuId}`)
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create menu item.")
  }
}

export async function updateMenuItem(
  digitalMenuId: number,
  id: number,
  itemData: {
    name?: string
    description?: string
    price?: number
    image?: File | null
    menu_category_id?: number
    order_index?: number
    reusable_menu_item_id?: number | null
  },
): Promise<MenuItem> {
  let imageUrl: string | undefined = undefined

  if (itemData.image !== undefined) {
    if (itemData.image === null) {
      imageUrl = null // Explicitly set to null if image is removed
    } else {
      imageUrl = await uploadImageToBlob(itemData.image)
    }
  }

  try {
    const fields = []
    const values = []
    let paramIndex = 1

    if (itemData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(itemData.name)
    }
    if (itemData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(itemData.description)
    }
    if (itemData.price !== undefined) {
      fields.push(`price = $${paramIndex++}`)
      values.push(itemData.price)
    }
    if (imageUrl !== undefined) {
      fields.push(`image_url = $${paramIndex++}`)
      values.push(imageUrl)
    }
    if (itemData.menu_category_id !== undefined) {
      fields.push(`menu_category_id = $${paramIndex++}`)
      values.push(itemData.menu_category_id)
    }
    if (itemData.order_index !== undefined) {
      fields.push(`order_index = $${paramIndex++}`)
      values.push(itemData.order_index)
    }
    if (itemData.reusable_menu_item_id !== undefined) {
      fields.push(`reusable_menu_item_id = $${paramIndex++}`)
      values.push(itemData.reusable_menu_item_id)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update.")
    }

    values.push(id) // Add the ID for the WHERE clause

    const query = `
      UPDATE menu_items
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, price, image_url, menu_category_id, order_index, reusable_menu_item_id;
    `

    const { rows } = await sql.query<MenuItem>(query, values)

    if (rows.length === 0) {
      throw new Error(`Menu item with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${digitalMenuId}`)
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update menu item.")
  }
}

export async function deleteMenuItem(id: number): Promise<void> {
  try {
    // First, get the digital_menu_id associated with this menu item
    const { rows: menuInfo } = await sql`
      SELECT mc.digital_menu_id
      FROM menu_items mi
      JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.id = ${id};
    `
    const digitalMenuId = menuInfo[0]?.digital_menu_id

    await sql`DELETE FROM menu_items WHERE id = ${id};`

    revalidatePath("/dashboard/menu-studio/digital-menu")
    if (digitalMenuId) {
      revalidatePath(`/menu/${digitalMenuId}`)
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete menu item.")
  }
}

export async function reorderMenuItems(digitalMenuId: number, categoryId: number, itemIds: number[]): Promise<void> {
  try {
    await sql.begin(async (db) => {
      for (let i = 0; i < itemIds.length; i++) {
        await db`
          UPDATE menu_items
          SET order_index = ${i}
          WHERE id = ${itemIds[i]} AND menu_category_id = ${categoryId};
        `
      }
    })
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${digitalMenuId}`)
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to reorder menu items.")
  }
}
