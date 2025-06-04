"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"

interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

interface DigitalMenuCategory {
  id: number
  digital_menu_id: number
  category_id: number
  category_name: string
  order_index: number
}

interface DigitalMenuCategoryUpdate {
  id: number // ID of the digital_menu_categories entry
  order_index: number
}

// Fetches all categories from the global 'categories' table
export async function getAllGlobalCategories(): Promise<Category[]> {
  try {
    const { rows } = await sql<Category>`
      SELECT id, name, type, order_index FROM global_categories ORDER BY order_index;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch global categories.")
  }
}

// Export getCategories as an alias for getAllGlobalCategories
export { getAllGlobalCategories as getCategories }

// Fetches categories from the global 'categories' table by type
export async function getCategoriesByType(type: string): Promise<Category[]> {
  try {
    const { rows } = await sql<Category[]>`
      SELECT id, name, type, order_index FROM global_categories WHERE type = ${type} ORDER BY order_index;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch categories by type.")
  }
}

// Creates a new global category
export async function createCategory(categoryData: { name: string; type: string }): Promise<Category> {
  try {
    const { rows } = await sql<Category>`
      INSERT INTO global_categories (name, type, order_index)
      VALUES (${categoryData.name}, ${categoryData.type}, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM global_categories WHERE type = ${categoryData.type}))
      RETURNING id, name, type, order_index;
    `
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu") // For menu item dialog
    revalidatePath("/dashboard/menu-studio/recipes") // For reusable menu item dialog
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create global category.")
  }
}

// Updates the name of a global category
export async function updateCategory(
  id: number,
  categoryData: { name?: string; type?: string; order_index?: number },
): Promise<Category> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    if (categoryData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(categoryData.name)
    }
    if (categoryData.type !== undefined) {
      fields.push(`type = $${paramIndex++}`)
      values.push(categoryData.type)
    }
    if (categoryData.order_index !== undefined) {
      fields.push(`order_index = $${paramIndex++}`)
      values.push(categoryData.order_index)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update.")
    }

    values.push(id) // Add the ID for the WHERE clause

    const query = `
      UPDATE global_categories
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, type, order_index;
    `

    const { rows } = await sql.query<Category>(query, values)

    if (rows.length === 0) {
      throw new Error(`Global category with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu") // For menu item dialog
    revalidatePath("/dashboard/menu-studio/recipes") // For reusable menu item dialog
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update global category.")
  }
}

// Deletes a global category (will cascade delete from digital_menu_categories if foreign key is set up)
export async function deleteCategory(id: number): Promise<void> {
  try {
    // Check for dependencies before deleting
    const { rowCount: menuCategoryCount } = await sql`SELECT 1 FROM menu_categories WHERE category_id = ${id} LIMIT 1;`
    const { rowCount: reusableMenuItemCount } =
      await sql`SELECT 1 FROM reusable_menu_items WHERE category_id = ${id} LIMIT 1;`
    const { rowCount: recipeCount } = await sql`SELECT 1 FROM recipes WHERE category_id = ${id} LIMIT 1;`

    if (menuCategoryCount > 0 || reusableMenuItemCount > 0 || recipeCount > 0) {
      throw new Error("Cannot delete category: it is currently in use by menus, reusable items, or recipes.")
    }

    await sql`DELETE FROM global_categories WHERE id = ${id};`
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu") // For menu item dialog
    revalidatePath("/dashboard/menu-studio/recipes") // For reusable menu item dialog
  } catch (error) {
    console.error("Database Error:", error)
    throw error // Re-throw the error to be caught by the caller
  }
}

// Reorders global categories by type
export async function reorderGlobalCategories(categoryIds: number[], type: string): Promise<void> {
  try {
    await sql.begin(async (db) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await db`
          UPDATE global_categories
          SET order_index = ${i}
          WHERE id = ${categoryIds[i]} AND type = ${type};
        `
      }
    })
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu") // For menu item dialog
    revalidatePath("/dashboard/menu-studio/recipes") // For reusable menu item dialog
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to reorder categories.")
  }
}

// Fetches categories associated with a specific digital menu, in their menu-specific order
export async function getMenuCategoriesForDigitalMenu(digitalMenuId: number): Promise<DigitalMenuCategory[]> {
  try {
    const { rows } = await sql<DigitalMenuCategory[]>`
      SELECT
        mc.id,
        mc.digital_menu_id,
        mc.category_id,
        gc.name AS category_name,
        mc.order_index
      FROM menu_categories mc
      JOIN global_categories gc ON mc.category_id = gc.id
      WHERE mc.digital_menu_id = ${digitalMenuId}
      ORDER BY mc.order_index ASC;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch menu-specific categories.")
  }
}

// Adds an existing global category to a specific digital menu
export async function addCategoryToDigitalMenu(
  digitalMenuId: number,
  categoryId: number,
): Promise<DigitalMenuCategory> {
  try {
    // Check if category already exists for this menu
    const { rowCount: exists } = await sql`
      SELECT 1 FROM menu_categories WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId};
    `
    if (exists > 0) {
      throw new Error("Category already exists in this menu.")
    }

    const { rows } = await sql<DigitalMenuCategory>`
      INSERT INTO menu_categories (digital_menu_id, category_id, order_index)
      VALUES (${digitalMenuId}, ${categoryId}, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM menu_categories WHERE digital_menu_id = ${digitalMenuId}))
      RETURNING id, digital_menu_id, category_id, (SELECT name FROM global_categories WHERE id = category_id) as category_name, order_index;
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${digitalMenuId}`)
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw error // Re-throw the error for the UI to handle
  }
}

// Removes a category from a specific digital menu's order
export async function removeCategoryFromDigitalMenu(digitalMenuCategoryId: number): Promise<void> {
  try {
    // Get digital_menu_id before deleting
    const { rows: menuInfo } = await sql`
      SELECT digital_menu_id FROM menu_categories WHERE id = ${digitalMenuCategoryId};
    `
    const digitalMenuId = menuInfo[0]?.digital_menu_id

    // Check if there are any menu items associated with this menu_category
    const { rowCount: itemCount } = await sql`
      SELECT 1 FROM menu_items WHERE menu_category_id = ${digitalMenuCategoryId} LIMIT 1;
    `
    if (itemCount > 0) {
      throw new Error("Cannot remove category: it contains menu items. Please remove all items first.")
    }

    await sql`DELETE FROM menu_categories WHERE id = ${digitalMenuCategoryId};`
    revalidatePath("/dashboard/menu-studio/digital-menu")
    if (digitalMenuId) {
      revalidatePath(`/menu/${digitalMenuId}`)
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw error // Re-throw the error for the UI to handle
  }
}

// Updates the order of categories within a specific digital menu
export async function updateDigitalMenuCategoryOrder(updates: DigitalMenuCategoryUpdate[]): Promise<void> {
  try {
    for (const update of updates) {
      await sql`
        UPDATE menu_categories
        SET order_index = ${update.order_index}
        WHERE id = ${update.id};
      `
    }
    revalidatePath("/dashboard/menu-studio/digital-menu")
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update digital menu category order.")
  }
}

// Reorders digital menu categories
export async function reorderDigitalMenuCategories(digitalMenuId: number, categoryIds: number[]): Promise<void> {
  try {
    await sql.begin(async (db) => {
      for (let i = 0; i < categoryIds.length; i++) {
        await db`
          UPDATE menu_categories
          SET order_index = ${i}
          WHERE id = ${categoryIds[i]} AND digital_menu_id = ${digitalMenuId};
        `
      }
    })
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${digitalMenuId}`)
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to reorder digital menu categories.")
  }
}
