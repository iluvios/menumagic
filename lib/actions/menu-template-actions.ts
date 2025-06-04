"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

export async function getMenuTemplates() {
  try {
    const result = await sql`
      SELECT id, name, description, preview_image_url
      FROM menu_templates
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching menu templates:", error)
    throw new Error("Failed to fetch menu templates.")
  }
}

export async function getMenuTemplateById(id: number) {
  try {
    const result = await sql`
      SELECT id, name, description, preview_image_url, template_data_json
      FROM menu_templates
      WHERE id = ${id}
    `
    return result[0] || null
  } catch (error) {
    console.error(`Error fetching menu template with ID ${id}:`, error)
    throw new Error("Failed to fetch menu template.")
  }
}

export async function applyTemplateToMenu(menuId: number, templateId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to apply template.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Get template details
    const templateResult = await sql`
      SELECT template_data_json FROM menu_templates WHERE id = ${templateId}
    `
    if (templateResult.length === 0) {
      throw new Error("Template not found.")
    }
    const templateData = templateResult[0].template_data_json as any

    // Update the digital menu with the template_id
    await sql`
      UPDATE digital_menus
      SET template_id = ${templateId}
      WHERE id = ${menuId}
    `

    // Clear existing menu items and categories for this digital menu
    await sql`DELETE FROM menu_items WHERE digital_menu_id = ${menuId};`
    await sql`DELETE FROM digital_menu_categories WHERE digital_menu_id = ${menuId};`

    // Insert categories and menu items from template data
    if (templateData && templateData.categories) {
      for (const category of templateData.categories) {
        // Find or create global category
        let globalCategory = await sql`
          SELECT id FROM global_categories WHERE name = ${category.name} AND (restaurant_id = ${restaurantId} OR restaurant_id IS NULL)
        `
        if (globalCategory.length === 0) {
          const newGlobalCategory = await sql`
            INSERT INTO global_categories (name, type, order_index, restaurant_id)
            VALUES (${category.name}, 'food', ${category.order_index || 0}, ${restaurantId})
            RETURNING id
          `
          globalCategory = newGlobalCategory
        }
        const categoryId = globalCategory[0].id

        // Insert into digital_menu_categories (linking global category to this specific digital menu)
        await sql`
          INSERT INTO digital_menu_categories (digital_menu_id, category_id, order_index)
          VALUES (${menuId}, ${categoryId}, ${category.order_index || 0})
        `

        if (category.items) {
          for (const item of category.items) {
            await sql`
              INSERT INTO menu_items (digital_menu_id, category_id, name, description, price, image_url, order_index)
              VALUES (${menuId}, ${categoryId}, ${item.name}, ${item.description}, ${item.price}, ${item.image_url}, ${item.order_index || 0})
            `
          }
        }
      }
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${menuId}`) // Revalidate public menu page
    return { success: true }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to apply template to menu.")
  }
}
