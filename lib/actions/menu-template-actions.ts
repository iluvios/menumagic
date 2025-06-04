"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers"

interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image: string
}

export async function getMenuTemplates(): Promise<MenuTemplate[]> {
  try {
    const { rows } = await sql<MenuTemplate>`
      SELECT id, name, description, preview_image FROM menu_templates ORDER BY name;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch menu templates.")
  }
}

export async function getMenuTemplateById(id: number): Promise<MenuTemplate | null> {
  try {
    const { rows } = await sql<MenuTemplate>`
      SELECT id, name, description, preview_image FROM menu_templates WHERE id = ${id}
    `
    return rows[0] || null
  } catch (error) {
    console.error(`Error fetching menu template with ID ${id}:`, error)
    throw new Error("Failed to fetch menu template.")
  }
}

export async function createMenuTemplate(templateData: {
  name: string
  description: string
  previewImageFile: File
}): Promise<MenuTemplate> {
  try {
    const previewImageUrl = await uploadImageToBlob(templateData.previewImageFile)

    const { rows } = await sql<MenuTemplate>`
      INSERT INTO menu_templates (name, description, preview_image)
      VALUES (${templateData.name}, ${templateData.description}, ${previewImageUrl})
      RETURNING id, name, description, preview_image;
    `
    revalidatePath("/dashboard/menu-studio/templates")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create menu template.")
  }
}

export async function updateMenuTemplate(
  id: number,
  templateData: {
    name?: string
    description?: string
    previewImageFile?: File | null
  },
): Promise<MenuTemplate> {
  let previewImageUrl: string | undefined = undefined

  if (templateData.previewImageFile !== undefined) {
    if (templateData.previewImageFile === null) {
      previewImageUrl = null // Explicitly set to null if image is removed
    } else {
      previewImageUrl = await uploadImageToBlob(templateData.previewImageFile)
    }
  }

  try {
    const fields = []
    const values = []
    let paramIndex = 1

    if (templateData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(templateData.name)
    }
    if (templateData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`)
      values.push(templateData.description)
    }
    if (previewImageUrl !== undefined) {
      fields.push(`preview_image = $${paramIndex++}`)
      values.push(previewImageUrl)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update.")
    }

    values.push(id) // Add the ID for the WHERE clause

    const query = `
      UPDATE menu_templates
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, description, preview_image;
    `

    const { rows } = await sql.query<MenuTemplate>(query, values)

    if (rows.length === 0) {
      throw new Error(`Menu template with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/menu-studio/templates")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update menu template.")
  }
}

export async function deleteMenuTemplate(id: number): Promise<void> {
  try {
    await sql`DELETE FROM menu_templates WHERE id = ${id};`
    revalidatePath("/dashboard/menu-studio/templates")
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete menu template.")
  }
}

export async function applyTemplateToMenu(digitalMenuId: number, templateId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to apply template.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Verify the template exists
    const templateCheck = await sql`SELECT id FROM menu_templates WHERE id = ${templateId}`
    if (templateCheck.length === 0) {
      throw new Error("Menu template not found.")
    }

    await sql`
      UPDATE digital_menus
      SET template_id = ${templateId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu/${digitalMenuId}`)
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error applying template to menu:", error)
    throw new Error("Failed to apply template to menu.")
  }
}
