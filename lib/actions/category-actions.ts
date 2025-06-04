"use server"

import { neon } from "@neondatabase/serverless"
import { unstable_noStore as noStore } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth" // Import getRestaurantIdFromSession

const sql = neon(process.env.DATABASE_URL!)

interface Category {
  id: number
  name: string
  type: string
  order_index: number // Global order index for categories
  restaurant_id?: number // Add restaurant_id
}

// New interface for menu-specific category order
interface DigitalMenuCategory {
  id: number // ID of the digital_menu_categories entry
  digital_menu_id: number
  category_id: number
  category_name: string // Joined from categories table
  order_index: number // Menu-specific order index
}

interface DigitalMenuCategoryUpdate {
  id: number // ID of the digital_menu_categories entry
  order_index: number
}

// Fetches all categories from the global 'categories' table
export async function getAllGlobalCategories(): Promise<Category[]> {
  noStore()
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const categories = await sql<Category[]>`
      SELECT id, name, type, order_index, restaurant_id
      FROM categories
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name ASC; -- Order globally by name for consistent selection
    `
    return categories
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch all global categories.")
  }
}

// Export getCategories as an alias for getAllGlobalCategories to satisfy the missing export error
export { getAllGlobalCategories as getCategories }

// Fetches categories from the global 'categories' table by type
export async function getCategoriesByType(type: string): Promise<Category[]> {
  noStore()
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const categories = await sql<Category[]>`
      SELECT id, name, type, order_index, restaurant_id
      FROM categories
      WHERE type = ${type} AND restaurant_id = ${restaurantId}
      ORDER BY name ASC;
    `
    return categories
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch categories by type.")
  }
}

// Fetches categories associated with a specific digital menu, in their menu-specific order
export async function getMenuCategoriesForDigitalMenu(digitalMenuId: number): Promise<DigitalMenuCategory[]> {
  noStore()
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    // Ensure the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    const menuCategories = await sql<DigitalMenuCategory[]>`
      SELECT
        dmc.id,
        dmc.digital_menu_id,
        dmc.category_id,
        c.name AS category_name,
        dmc.order_index
      FROM digital_menu_categories dmc
      JOIN categories c ON dmc.category_id = c.id
      WHERE dmc.digital_menu_id = ${digitalMenuId}
      ORDER BY dmc.order_index ASC;
    `
    return menuCategories
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch menu-specific categories.")
  }
}

// Creates a new global category
export async function createCategory(name: string, type: string): Promise<Category> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create category.")
    }

    // Find the maximum global order_index for the given type and restaurant
    const maxOrderResult = await sql<{ max_order: number }[]>`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM categories
      WHERE type = ${type} AND restaurant_id = ${restaurantId};
    `
    const nextGlobalOrderIndex = maxOrderResult[0].max_order + 1

    const [newCategory] = await sql<Category[]>`
      INSERT INTO categories (name, type, order_index, restaurant_id)
      VALUES (${name}, ${type}, ${nextGlobalOrderIndex}, ${restaurantId})
      RETURNING id, name, type, order_index, restaurant_id;
    `
    return newCategory
  } catch (error: any) {
    console.error("Database Error:", error)
    if (error.message?.includes("unique_category_name_type_per_restaurant")) {
      throw new Error(`Ya existe una categoría con el nombre "${name}" y tipo "${type}".`)
    }
    throw new Error("Failed to create category.")
  }
}

// Adds an existing global category to a specific digital menu
export async function addCategoryToDigitalMenu(
  digitalMenuId: number,
  categoryId: number,
): Promise<DigitalMenuCategory | null> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to link category to menu.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Verify the category belongs to the current restaurant
    const categoryCheck =
      await sql`SELECT id FROM categories WHERE id = ${categoryId} AND restaurant_id = ${restaurantId}`
    if (categoryCheck.length === 0) {
      throw new Error("Category not found or does not belong to this restaurant.")
    }

    // Check if the category is already linked to this menu
    const existingLink = await sql<DigitalMenuCategory[]>`
      SELECT id, digital_menu_id, category_id, order_index FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId};
    `
    if (existingLink.length > 0) {
      // If already linked, return the existing link instead of throwing an error
      console.log(`Category ${categoryId} is already linked to menu ${digitalMenuId}. Returning existing link.`)
      return existingLink[0]
    }

    // Find the maximum order_index for this specific menu
    const maxOrderResult = await sql<{ max_order: number }[]>`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId};
    `
    const nextMenuOrderIndex = maxOrderResult[0].max_order + 1

    const [newLink] = await sql<DigitalMenuCategory[]>`
      INSERT INTO digital_menu_categories (digital_menu_id, category_id, order_index)
      VALUES (${digitalMenuId}, ${categoryId}, ${nextMenuOrderIndex})
      RETURNING id, digital_menu_id, category_id, order_index;
    `
    // To return category_name, we need to fetch it
    const [categoryNameResult] = await sql<{ name: string }[]>`
      SELECT name FROM categories WHERE id = ${newLink.category_id};
    `
    return { ...newLink, category_name: categoryNameResult.name }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to add category to digital menu.")
  }
}

// Removes a category from a specific digital menu's order
export async function removeCategoryFromDigitalMenu(
  digitalMenuId: number,
  digitalMenuCategoryId: number,
): Promise<void> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to remove category from menu.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck =
      await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    await sql`
      DELETE FROM digital_menu_categories
      WHERE id = ${digitalMenuCategoryId} AND digital_menu_id = ${digitalMenuId};
    `
    // Re-index remaining categories for this menu
    const remainingCategories = await sql<DigitalMenuCategory[]>`
      SELECT id, order_index FROM digital_menu_categories
      WHERE digital_menu_id = ${digitalMenuId}
      ORDER BY order_index ASC;
    `
    for (let i = 0; i < remainingCategories.length; i++) {
      if (remainingCategories[i].order_index !== i + 1) {
        await sql`
          UPDATE digital_menu_categories
          SET order_index = ${i + 1}
          WHERE id = ${remainingCategories[i].id};
        `
      }
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to remove category from digital menu.")
  }
}

// Updates the name of a global category
export async function updateCategory(id: number, name: string): Promise<Category> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update category.")
    }

    const [updatedCategory] = await sql<Category[]>`
      UPDATE categories
      SET name = ${name}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, type, order_index, restaurant_id;
    `
    if (!updatedCategory) {
      throw new Error("Category not found or does not belong to this restaurant.")
    }
    return updatedCategory
  } catch (error: any) {
    console.error("Database Error:", error)
    if (error.message?.includes("unique_category_name_type_per_restaurant")) {
      throw new Error(`Ya existe una categoría con el nombre "${name}" y tipo similar.`)
    }
    throw new Error("Failed to update category name.")
  }
}

// Updates the order of categories within a specific digital menu
export async function updateDigitalMenuCategoryOrder(updates: DigitalMenuCategoryUpdate[]): Promise<void> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update category order.")
    }

    for (const update of updates) {
      // Verify ownership of the digital_menu_category entry
      const checkOwnership = await sql`
        SELECT dmc.id
        FROM digital_menu_categories dmc
        JOIN digital_menus dm ON dmc.digital_menu_id = dm.id
        WHERE dmc.id = ${update.id} AND dm.restaurant_id = ${restaurantId}
      `
      if (checkOwnership.length === 0) {
        throw new Error(`Digital menu category with ID ${update.id} not found or does not belong to this restaurant.`)
      }

      await sql`
        UPDATE digital_menu_categories
        SET order_index = ${update.order_index}
        WHERE id = ${update.id};
      `
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update digital menu category order.")
  }
}

// Deletes a global category (will cascade delete from digital_menu_categories if foreign key is set up)
export async function deleteCategory(id: number): Promise<void> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete category.")
    }

    const result = await sql`
      DELETE FROM categories
      WHERE id = ${id} AND restaurant_id = ${restaurantId};
    `
    if (result.count === 0) {
      throw new Error("Category not found or does not belong to this restaurant.")
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete global category.")
  }
}
