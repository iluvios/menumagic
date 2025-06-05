"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

export async function getCategories() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID found for session in getCategories.")
      return []
    }
    const result = await sql`
      SELECT id, name, type, order_index, created_at, updated_at
      FROM menu_categories
      WHERE restaurant_id = ${restaurantId}
      ORDER BY order_index ASC, name ASC
    `
    return result || []
  } catch (error) {
    console.error("category-actions.ts: Error fetching categories:", error)
    throw new Error("Failed to fetch categories.")
  }
}

export async function getCategoryById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for getCategoryById.")
      throw new Error("Authentication required.")
    }
    const result = await sql`
      SELECT id, name, type, order_index, created_at, updated_at
      FROM menu_categories
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error(`category-actions.ts: Error fetching category by ID ${id}:`, error)
    throw new Error("Failed to fetch category by ID.")
  }
}

export async function createCategory(name: string, type: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for createCategory.")
      throw new Error("Authentication required to create category.")
    }

    // Determine the next order_index
    const maxOrderIndexResult = await sql`
      SELECT MAX(order_index) as max_index
      FROM menu_categories
      WHERE restaurant_id = ${restaurantId}
    `
    const nextOrderIndex = (maxOrderIndexResult[0]?.max_index || 0) + 1

    const result = await sql`
      INSERT INTO menu_categories (name, type, restaurant_id, order_index)
      VALUES (${name}, ${type}, ${restaurantId}, ${nextOrderIndex})
      RETURNING id, name, type, order_index
    `
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu") // Revalidate digital menu page as categories might be used there
    return result[0]
  } catch (error) {
    console.error("category-actions.ts: Error creating category:", error)
    throw new Error("Failed to create category.")
  }
}

export async function updateCategory(id: number, data: { name?: string; type?: string; order_index?: number }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for updateCategory.")
      throw new Error("Authentication required to update category.")
    }

    const result = await sql`
      UPDATE menu_categories
      SET
        name = COALESCE(${data.name}, name),
        type = COALESCE(${data.type}, type),
        order_index = COALESCE(${data.order_index}, order_index),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, type, order_index
    `
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return result[0]
  } catch (error) {
    console.error("category-actions.ts: Error updating category:", error)
    throw new Error("Failed to update category.")
  }
}

export async function deleteCategory(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for deleteCategory.")
      throw new Error("Authentication required to delete category.")
    }

    // Remove associations from digital_menu_categories
    await sql`DELETE FROM digital_menu_categories WHERE category_id = ${id}`

    // Set menu_category_id to NULL for any menu items using this category
    await sql`UPDATE menu_items SET menu_category_id = NULL WHERE menu_category_id = ${id}`

    await sql`
      DELETE FROM menu_categories
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("category-actions.ts: Error deleting category:", error)
    throw new Error("Failed to delete category.")
  }
}

export async function reorderCategories(categoryIds: number[]) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for reorderCategories.")
      throw new Error("Authentication required to reorder categories.")
    }

    const updates = categoryIds.map(
      (id, index) =>
        sql`UPDATE menu_categories SET order_index = ${index} WHERE id = ${id} AND restaurant_id = ${restaurantId}`,
    )
    await sql.transaction(updates)

    revalidatePath("/dashboard/settings/categories")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("category-actions.ts: Error reordering categories:", error)
    throw new Error("Failed to reorder categories.")
  }
}

export async function getAllGlobalCategories() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for getAllGlobalCategories.")
      return []
    }
    const result = await sql`
      SELECT id, name, type, order_index
      FROM menu_categories
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error("category-actions.ts: Error fetching all global categories:", error)
    throw new Error("Failed to fetch global categories.")
  }
}

export async function getMenuCategoriesForDigitalMenu(digitalMenuId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for getMenuCategoriesForDigitalMenu.")
      return []
    }
    const result = await sql`
      SELECT
        dmc.id,
        dmc.digital_menu_id,
        dmc.category_id,
        mc.name as category_name,
        dmc.order_index
      FROM digital_menu_categories dmc
      JOIN menu_categories mc ON dmc.category_id = mc.id
      WHERE dmc.digital_menu_id = ${digitalMenuId} AND mc.restaurant_id = ${restaurantId}
      ORDER BY dmc.order_index ASC
    `
    return result || []
  } catch (error) {
    console.error(`category-actions.ts: Error fetching menu categories for digital menu ${digitalMenuId}:`, error)
    throw new Error("Failed to fetch digital menu categories.")
  }
}

export async function addCategoryToDigitalMenu(digitalMenuId: number, categoryId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for addCategoryToDigitalMenu.")
      throw new Error("Authentication required.")
    }

    // Check if category belongs to the restaurant
    const categoryCheck =
      await sql`SELECT id FROM menu_categories WHERE id = ${categoryId} AND restaurant_id = ${restaurantId}`
    if (categoryCheck.length === 0) {
      throw new Error("Category not found or does not belong to this restaurant.")
    }

    // Check if digital menu belongs to the restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Check if already exists
    const existing = await sql`
      SELECT id FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId}
    `
    if (existing.length > 0) {
      return { success: false, message: "Category already added to this menu." }
    }

    // Determine the next order_index for this digital menu
    const maxOrderIndexResult = await sql`
      SELECT MAX(order_index) as max_index
      FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId}
    `
    const nextOrderIndex = (maxOrderIndexResult[0]?.max_index || 0) + 1

    const result = await sql`
      INSERT INTO digital_menu_categories (digital_menu_id, category_id, order_index)
      VALUES (${digitalMenuId}, ${categoryId}, ${nextOrderIndex})
      RETURNING id, digital_menu_id, category_id, order_index
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/menu/${digitalMenuId}`)
    return { success: true, data: result[0] }
  } catch (error) {
    console.error(`category-actions.ts: Error adding category ${categoryId} to digital menu ${digitalMenuId}:`, error)
    throw new Error("Failed to add category to digital menu.")
  }
}

export async function removeCategoryFromDigitalMenu(digitalMenuId: number, categoryId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for removeCategoryFromDigitalMenu.")
      throw new Error("Authentication required.")
    }

    // Check if digital menu belongs to the restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    await sql`
      DELETE FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId}
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/menu/${digitalMenuId}`)
    return { success: true }
  } catch (error) {
    console.error(
      `category-actions.ts: Error removing category ${categoryId} from digital menu ${digitalMenuId}:`,
      error,
    )
    throw new Error("Failed to remove category from digital menu.")
  }
}

export async function updateDigitalMenuCategoryOrder(digitalMenuId: number, orderedCategoryIds: number[]) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("category-actions.ts: No restaurant ID for updateDigitalMenuCategoryOrder.")
      throw new Error("Authentication required.")
    }

    // Check if digital menu belongs to the restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    const updates = orderedCategoryIds.map(
      (categoryId, index) =>
        sql`UPDATE digital_menu_categories SET order_index = ${index} WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId}`,
    )
    await sql.transaction(updates)

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/menu/${digitalMenuId}`)
    return { success: true }
  } catch (error) {
    console.error(`category-actions.ts: Error updating digital menu category order for menu ${digitalMenuId}:`, error)
    throw new Error("Failed to update digital menu category order.")
  }
}
