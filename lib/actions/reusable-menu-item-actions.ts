"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers"

interface ReusableMenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  category_id: number
  category_name?: string
}

export async function getReusableMenuItems(): Promise<ReusableMenuItem[]> {
  try {
    const { rows } = await sql<ReusableMenuItem>`
      SELECT
        rmi.id,
        rmi.name,
        rmi.description,
        rmi.price,
        rmi.image_url,
        rmi.category_id,
        gc.name AS category_name
      FROM reusable_menu_items rmi
      JOIN global_categories gc ON rmi.category_id = gc.id
      ORDER BY rmi.created_at DESC;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch reusable menu items.")
  }
}

export async function createReusableMenuItem(itemData: {
  name: string
  description: string
  price: number
  image?: File | null
  category_id: number
}): Promise<ReusableMenuItem> {
  let imageUrl: string | undefined = undefined

  if (itemData.image) {
    imageUrl = await uploadImageToBlob(itemData.image)
  }

  try {
    const { rows } = await sql<ReusableMenuItem>`
      INSERT INTO reusable_menu_items (name, description, price, image_url, category_id)
      VALUES (${itemData.name}, ${itemData.description}, ${itemData.price}, ${imageUrl}, ${itemData.category_id})
      RETURNING id, name, description, price, image_url, category_id;
    `
    revalidatePath("/dashboard/menu-studio/recipes")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create reusable menu item.")
  }
}

export async function updateReusableMenuItem(
  id: number,
  itemData: {
    name?: string
    description?: string
    price?: number
    image?: File | null
    category_id?: number
  },
): Promise<ReusableMenuItem> {
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
    if (itemData.category_id !== undefined) {
      fields.push(`category_id = $${paramIndex++}`)
      values.push(itemData.category_id)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update.")
    }

    values.push(id) // Add the ID for the WHERE clause

    const query = `
      UPDATE reusable_menu_items
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, price, image_url, category_id;
    `

    const { rows } = await sql.query<ReusableMenuItem>(query, values)

    if (rows.length === 0) {
      throw new Error(`Reusable menu item with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/menu-studio/recipes")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update reusable menu item.")
  }
}

export async function deleteReusableMenuItem(id: number): Promise<void> {
  try {
    await sql`DELETE FROM reusable_menu_items WHERE id = ${id};`
    revalidatePath("/dashboard/menu-studio/recipes")
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete reusable menu item.")
  }
}
