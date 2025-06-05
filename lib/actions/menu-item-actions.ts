"use server"

// IMPORTS SECTION - START
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
// PROBLEMATIC IMPORT REMOVED: import { digital_menu_id } from "@/lib/constants"
// IMPORTS SECTION - END

// GET MENU ITEMS FUNCTION - START
export async function getMenuItems() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID found for session in getMenuItems.")
      return []
    }
    const result = await sql`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.digital_menu_id,
        mi.menu_category_id,
        mc.name as category_name,
        mi.reusable_menu_item_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.restaurant_id = ${restaurantId}
      ORDER BY mi.name ASC
    `
    return result || []
  } catch (error) {
    console.error("menu-item-actions.ts: Error fetching menu items:", error)
    throw new Error("Failed to fetch menu items.")
  }
}
// GET MENU ITEMS FUNCTION - END

// GET MENU ITEM BY ID FUNCTION - START
export async function getMenuItemById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemById.")
      throw new Error("Authentication required.")
    }
    const result = await sql`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.digital_menu_id,
        mi.menu_category_id,
        mc.name as category_name,
        mi.reusable_menu_item_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.id = ${id} AND mi.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching menu item by ID ${id}:`, error)
    throw new Error("Failed to fetch menu item by ID.")
  }
}
// GET MENU ITEM BY ID FUNCTION - END

// CREATE MENU ITEM FUNCTION - START
export async function createMenuItem(data: {
  name: string
  description: string
  price: number
  image_url?: string
  digital_menu_id: number
  menu_category_id: number
  reusable_menu_item_id?: number
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for createMenuItem.")
      throw new Error("Authentication required to create menu item.")
    }

    const result = await sql`
      INSERT INTO menu_items (name, description, price, image_url, digital_menu_id, menu_category_id, reusable_menu_item_id, restaurant_id)
      VALUES (${data.name}, ${data.description}, ${data.price}, ${data.image_url || null}, ${data.digital_menu_id}, ${data.menu_category_id}, ${data.reusable_menu_item_id || null}, ${restaurantId})
      RETURNING id, name, description, price, image_url, digital_menu_id, menu_category_id, reusable_menu_item_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/menu/${data.digital_menu_id}`)
    return result[0]
  } catch (error) {
    console.error("menu-item-actions.ts: Error creating menu item:", error)
    throw new Error("Failed to create menu item.")
  }
}
// CREATE MENU ITEM FUNCTION - END

// UPDATE MENU ITEM FUNCTION - START
export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    image_url?: string
    digital_menu_id?: number
    menu_category_id?: number
    reusable_menu_item_id?: number
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for updateMenuItem.")
      throw new Error("Authentication required to update menu item.")
    }

    const result = await sql`
      UPDATE menu_items
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        image_url = COALESCE(${data.image_url}, image_url),
        digital_menu_id = COALESCE(${data.digital_menu_id}, digital_menu_id),
        menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
        reusable_menu_item_id = COALESCE(${data.reusable_menu_item_id}, reusable_menu_item_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, description, price, image_url, digital_menu_id, menu_category_id, reusable_menu_item_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/menu/${data.digital_menu_id}`)
    return result[0]
  } catch (error) {
    console.error("menu-item-actions.ts: Error updating menu item:", error)
    throw new Error("Failed to update menu item.")
  }
}
// UPDATE MENU ITEM FUNCTION - END

// DELETE MENU ITEM FUNCTION - START
export async function deleteMenuItem(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for deleteMenuItem.")
      throw new Error("Authentication required to delete menu item.")
    }

    // Get digital_menu_id before deleting for revalidation
    const menuItem =
      await sql`SELECT digital_menu_id FROM menu_items WHERE id = ${id} AND restaurant_id = ${restaurantId}`
    const digitalMenuId = menuItem[0]?.digital_menu_id

    await sql`
      DELETE FROM menu_items
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (digitalMenuId) {
      revalidatePath(`/dashboard/menu-studio/digital-menu`)
      revalidatePath(`/menu/${digitalMenuId}`)
    }
    return { success: true }
  } catch (error) {
    console.error("menu-item-actions.ts: Error deleting menu item:", error)
    throw new Error("Failed to delete menu item.")
  }
}
// DELETE MENU ITEM FUNCTION - END

// GET MENU ITEMS BY MENU ID FUNCTION - START
export async function getMenuItemsByMenuId(digitalMenuId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemsByMenuId.")
      return []
    }
    const result = await sql`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.digital_menu_id,
        mi.menu_category_id,
        mc.name as category_name,
        mi.reusable_menu_item_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.digital_menu_id = ${digitalMenuId} AND mi.restaurant_id = ${restaurantId}
      ORDER BY mc.order_index ASC, mi.name ASC
    `
    return result || []
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching menu items for menu ID ${digitalMenuId}:`, error)
    throw new Error("Failed to fetch menu items by menu ID.")
  }
}
// GET MENU ITEMS BY MENU ID FUNCTION - END

// GET MENU ITEM DETAILS FUNCTION - START
export async function getMenuItemDetails(menuItemId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemDetails.")
      throw new Error("Authentication required.")
    }
    const result = await sql`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.digital_menu_id,
        mi.menu_category_id,
        mc.name as category_name,
        mi.reusable_menu_item_id
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.id = ${menuItemId} AND mi.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching menu item details for ID ${menuItemId}:`, error)
    throw new Error("Failed to fetch menu item details.")
  }
}
// GET MENU ITEM DETAILS FUNCTION - END

// GET MENU ITEM INGREDIENTS FUNCTION - START
export async function getMenuItemIngredients(menuItemId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemIngredients.")
      return []
    }
    const result = await sql`
      SELECT
        mii.ingredient_id,
        i.name as ingredient_name,
        mii.quantity,
        mii.unit
      FROM menu_item_ingredients mii
      JOIN ingredients i ON mii.ingredient_id = i.id
      WHERE mii.menu_item_id = ${menuItemId} AND i.restaurant_id = ${restaurantId}
    `
    return result || []
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching ingredients for menu item ${menuItemId}:`, error)
    throw new Error("Failed to fetch menu item ingredients.")
  }
}
// GET MENU ITEM INGREDIENTS FUNCTION - END

// UPDATE MENU ITEM INGREDIENTS FUNCTION - START
export async function updateMenuItemIngredients(
  menuItemId: number,
  ingredients: { ingredient_id: number; quantity: number; unit: string }[],
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for updateMenuItemIngredients.")
      throw new Error("Authentication required.")
    }

    // Check if menu item belongs to the restaurant
    const menuItemCheck =
      await sql`SELECT id FROM menu_items WHERE id = ${menuItemId} AND restaurant_id = ${restaurantId}`
    if (menuItemCheck.length === 0) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${menuItemId}`

    if (ingredients.length > 0) {
      const values = ingredients.map((ing) => sql`(${menuItemId}, ${ing.ingredient_id}, ${ing.quantity}, ${ing.unit})`)
      await sql`
        INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
        VALUES ${sql.join(values, ",")}
      `
    }
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true }
  } catch (error) {
    console.error(`menu-item-actions.ts: Error updating ingredients for menu item ${menuItemId}:`, error)
    throw new Error("Failed to update menu item ingredients.")
  }
}
// UPDATE MENU ITEM INGREDIENTS FUNCTION - END

// GET MENU ITEM CATEGORIES FUNCTION - START
export async function getMenuItemCategories(menuItemId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemCategories.")
      return []
    }
    const result = await sql`
      SELECT
        mc.id,
        mc.name,
        mc.type,
        mc.order_index
      FROM menu_categories mc
      JOIN menu_items mi ON mc.id = mi.menu_category_id
      WHERE mi.id = ${menuItemId} AND mc.restaurant_id = ${restaurantId}
    `
    return result || []
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching categories for menu item ${menuItemId}:`, error)
    throw new Error("Failed to fetch menu item categories.")
  }
}
// GET MENU ITEM CATEGORIES FUNCTION - END

// GET MENU ITEM REUSABLE ITEMS FUNCTION - START
export async function getMenuItemReusableItems(menuItemId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for getMenuItemReusableItems.")
      return []
    }
    const result = await sql`
      SELECT
        rmii.reusable_menu_item_id,
        rmi.name as reusable_item_name,
        rmii.quantity
      FROM reusable_menu_item_ingredients rmii
      JOIN reusable_menu_items rmi ON rmii.reusable_menu_item_id = rmi.id
      WHERE rmii.menu_item_id = ${menuItemId} AND rmi.restaurant_id = ${restaurantId}
    `
    return result || []
  } catch (error) {
    console.error(`menu-item-actions.ts: Error fetching reusable items for menu item ${menuItemId}:`, error)
    throw new Error("Failed to fetch menu item reusable items.")
  }
}
// GET MENU ITEM REUSABLE ITEMS FUNCTION - END

// UPDATE MENU ITEM REUSABLE ITEMS FUNCTION - START
export async function updateMenuItemReusableItems(
  menuItemId: number,
  reusableItems: { reusable_menu_item_id: number; quantity: number }[],
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("menu-item-actions.ts: No restaurant ID for updateMenuItemReusableItems.")
      throw new Error("Authentication required.")
    }

    // Check if menu item belongs to the restaurant
    const menuItemCheck =
      await sql`SELECT id FROM menu_items WHERE id = ${menuItemId} AND restaurant_id = ${restaurantId}`
    if (menuItemCheck.length === 0) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    await sql`DELETE FROM reusable_menu_item_ingredients WHERE menu_item_id = ${menuItemId}`

    if (reusableItems.length > 0) {
      const values = reusableItems.map((item) => sql`(${menuItemId}, ${item.reusable_menu_item_id}, ${item.quantity})`)
      await sql`
        INSERT INTO reusable_menu_item_ingredients (menu_item_id, reusable_menu_item_id, quantity)
        VALUES ${sql.join(values, ",")}
      `
    }
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true }
  } catch (error) {
    console.error(`menu-item-actions.ts: Error updating reusable items for menu item ${menuItemId}:`, error)
    throw new Error("Failed to update menu item reusable items.")
  }
}
// UPDATE MENU ITEM REUSABLE ITEMS FUNCTION - END

// UPDATE MENU ITEM ORDER FUNCTION - START
export async function updateMenuItemOrder(updates: { id: number; order_index: number }[]) {
  try {
    // Process each update individually using SQL
    for (const update of updates) {
      await sql`
        UPDATE menu_items 
        SET order_index = ${update.order_index}
        WHERE id = ${update.id}
      `
    }
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Failed to update menu item order:", error)
    throw new Error("Failed to update menu item order.")
  }
}
// UPDATE MENU ITEM ORDER FUNCTION - END
