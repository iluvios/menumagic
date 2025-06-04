"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image_url: string
  template_data_json: any // JSON object for template structure/styles
  created_at: string
  updated_at: string
}

export async function getMenuTemplates(): Promise<MenuTemplate[]> {
  try {
    const result = await sql`
      SELECT id, name, description, preview_image_url, template_data_json, created_at, updated_at
      FROM menu_templates
      ORDER BY created_at DESC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching menu templates:", error)
    throw new Error("Failed to fetch menu templates.")
  }
}

export async function getMenuTemplateById(id: number): Promise<MenuTemplate | null> {
  try {
    const result = await sql`
      SELECT id, name, description, preview_image_url, template_data_json, created_at, updated_at
      FROM menu_templates
      WHERE id = ${id}
    `
    return result[0] || null
  } catch (error) {
    console.error(`Error fetching menu template with ID ${id}:`, error)
    throw new Error("Failed to fetch menu template.")
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
