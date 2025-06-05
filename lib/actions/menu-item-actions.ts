"use server"

import { sql as neonSql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { z } from "zod"

// Define Zod schemas for validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  menu_category_id: z.number().optional().nullable(),
  digital_menu_id: z.number(),
  orderIndex: z.number().optional(),
  isAvailable: z.boolean().optional(),
})

const UpdateMenuItemSchema = CreateMenuItemSchema.extend({
  id: z.number(),
})

export async function getMenuItems() {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const items = await neonSql`
      SELECT mi.*, c.name as category_name, dm.name as digital_menu_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE dm.restaurant_id = ${restaurantId}
      ORDER BY mi.name ASC
    `
    return items
  } catch (error: any) {
    console.error("Error fetching all menu items:", error)
    throw new Error("Failed to fetch menu items: " + error.message)
  }
}

export async function getMenuItemById(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const result = await neonSql`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error: any) {
    console.error(`Error fetching menu item by ID ${id}:`, error)
    throw new Error("Failed to fetch menu item by ID: " + error.message)
  }
}

export async function createMenuItem(data: z.infer<typeof CreateMenuItemSchema>, imageFile?: File | null) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const validatedFields = CreateMenuItemSchema.safeParse(data)
  if (!validatedFields.success) {
    console.error("Validation Errors (createMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(`Invalid menu item data: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`)
  }
  let { name, description, price, menu_category_id, digital_menu_id, isAvailable, orderIndex } = validatedFields.data

  const menuCheckResults =
    await neonSql`SELECT id FROM digital_menus WHERE id = ${digital_menu_id} AND restaurant_id = ${restaurantId}`
  if (menuCheckResults.length === 0) throw new Error("Digital menu not found or does not belong to this restaurant.")

  // TEMPORARILY DISABLED IMAGE UPLOADS - NO UTAPI
  const imageUrl: string | undefined = undefined
  console.log("Image upload temporarily disabled - no utapi")

  try {
    if (orderIndex === undefined || orderIndex === null) {
      const result =
        await neonSql`SELECT MAX(order_index) as max_order FROM menu_items WHERE digital_menu_id = ${digital_menu_id} AND menu_category_id = ${menu_category_id}`
      const maxOrder = result[0]?.max_order
      orderIndex = (typeof maxOrder === "number" ? maxOrder : -1) + 1
    }

    const insertResult = await neonSql`
      INSERT INTO menu_items (name, description, price, menu_category_id, digital_menu_id, image_url, order_index, is_available)
      VALUES (${name}, ${description}, ${price}, ${menu_category_id}, ${digital_menu_id}, ${imageUrl}, ${orderIndex}, ${isAvailable ?? true})
      RETURNING *
    `

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${digital_menu_id}`)
    return insertResult[0]
  } catch (dbError: any) {
    console.error("Database Error (createMenuItem):", dbError)
    throw new Error("Database Error: Failed to Create Menu Item. " + dbError.message)
  }
}

export async function updateMenuItem(
  id: number,
  data: Partial<
    Omit<z.infer<typeof CreateMenuItemSchema>, "digital_menu_id" | "orderIndex"> & {
      digital_menu_id?: number
      orderIndex?: number
    }
  >,
  imageFileOrNull?: File | null,
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const existingItems = await neonSql`
    SELECT mi.image_url, mi.digital_menu_id 
    FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
  `
  if (existingItems.length === 0) throw new Error("Menu item not found or not owned by this restaurant.")
  const existingItem = existingItems[0]

  const validatedFields = UpdateMenuItemSchema.safeParse({ ...data, id })
  if (!validatedFields.success) {
    console.error("Validation Errors (updateMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(`Invalid menu item data for update: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`)
  }

  const { id: validatedId, ...dataToUpdate } = validatedFields.data

  // TEMPORARILY DISABLED IMAGE UPLOADS - NO UTAPI
  const newImageUrl: string | undefined | null = undefined
  console.log("Image upload/delete temporarily disabled - no utapi")

  const { name, description, price, menu_category_id, digital_menu_id, isAvailable, orderIndex } = dataToUpdate

  // Build SET clause dynamically for fields that are actually provided
  const setClauses: string[] = []
  const queryParams: any[] = []

  if (name !== undefined) {
    setClauses.push(`name = $${queryParams.length + 1}`)
    queryParams.push(name)
  }
  if (description !== undefined) {
    setClauses.push(`description = $${queryParams.length + 1}`)
    queryParams.push(description)
  }
  if (price !== undefined) {
    setClauses.push(`price = $${queryParams.length + 1}`)
    queryParams.push(price)
  }
  if (menu_category_id !== undefined) {
    setClauses.push(`menu_category_id = $${queryParams.length + 1}`)
    queryParams.push(menu_category_id)
  }
  if (digital_menu_id !== undefined) {
    setClauses.push(`digital_menu_id = $${queryParams.length + 1}`)
    queryParams.push(digital_menu_id)
  }
  if (isAvailable !== undefined) {
    setClauses.push(`is_available = $${queryParams.length + 1}`)
    queryParams.push(isAvailable)
  }
  if (orderIndex !== undefined) {
    setClauses.push(`order_index = $${queryParams.length + 1}`)
    queryParams.push(orderIndex)
  }

  if (setClauses.length === 0) {
    console.warn("updateMenuItem called with no data to update for item ID:", id)
    const currentItem = await getMenuItemById(id)
    return currentItem
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`)

  queryParams.push(id)
  const idParamIndex = queryParams.length

  try {
    const updateQueryString = `UPDATE menu_items SET ${setClauses.join(", ")} WHERE id = $${idParamIndex} RETURNING *`
    const updatedResult = await neonSql({ text: updateQueryString, values: queryParams })

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    if (updatedResult[0]?.digital_menu_id) revalidatePath(`/dashboard/menus/dishes/${updatedResult[0].digital_menu_id}`)
    return updatedResult[0]
  } catch (dbError: any) {
    console.error("Database Error (updateMenuItem):", dbError)
    throw new Error("Database Error: Failed to Update Menu Item. " + dbError.message)
  }
}

export async function deleteMenuItem(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const itemsToDelete = await neonSql`
    SELECT mi.image_url, mi.digital_menu_id
    FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
  `

  if (itemsToDelete.length === 0) {
    throw new Error("Menu item not found or does not belong to this restaurant.")
  }
  const itemToDelete = itemsToDelete[0]

  try {
    await neonSql`DELETE FROM menu_items WHERE id = ${id}`
    // TEMPORARILY DISABLED IMAGE DELETION - NO UTAPI
    console.log("Image deletion temporarily disabled - no utapi")

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    if (itemToDelete.digital_menu_id) revalidatePath(`/dashboard/menus/dishes/${itemToDelete.digital_menu_id}`)
    return { success: true, message: "Menu item deleted successfully." }
  } catch (dbError: any) {
    console.error("Database Error (deleteMenuItem):", dbError)
    throw new Error("Database Error: Failed to Delete Menu Item. " + dbError.message)
  }
}

export async function getMenuItemsByMenuId(digital_menu_id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const menuItems = await neonSql`
      SELECT mi.*, c.name as category_name
      FROM menu_items mi
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.digital_menu_id = ${digital_menu_id} AND dm.restaurant_id = ${restaurantId}
      ORDER BY mi.order_index ASC
    `
    return menuItems
  } catch (error: any) {
    console.error("Error fetching menu items by menu ID:", error)
    return []
  }
}

export async function updateMenuItemOrder(menuId: number, categoryId: number | null, orderedIds: number[]) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const menuCheck = await neonSql`SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) {
    throw new Error("Menu not found or does not belong to this restaurant.")
  }

  try {
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const orderIndex = i
      await neonSql`
        UPDATE menu_items 
        SET order_index = ${orderIndex}, menu_category_id = ${categoryId === 0 ? null : categoryId}
        WHERE id = ${id}
      `
    }

    revalidatePath(`/dashboard/menus/dishes/${menuId}`)
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true, message: "Menu item order updated successfully." }
  } catch (error: any) {
    console.error("Error updating menu item order:", error)
    return { success: false, error: "Failed to update menu item order: " + error.message }
  }
}

export async function getMenuItemDetails(id: number) {
  console.warn("getMenuItemDetails is a stub. For now, aliasing to getMenuItemById.")
  return getMenuItemById(id)
}

export async function getMenuItemIngredients(menuItemId: number) {
  console.warn("getMenuItemIngredients is a stub and not fully implemented.")
  return []
}

export async function updateMenuItemIngredients(menuItemId: number, ingredientsData: any) {
  console.warn("updateMenuItemIngredients is a stub and not fully implemented.")
  revalidatePath(`/dashboard/menus/dishes/${menuItemId}`)
  return { success: true, message: "(Stub) Ingredients updated." }
}

export async function getMenuItemCategories() {
  console.warn("getMenuItemCategories is a stub. Consider using getCategoriesByType from category-actions.")
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  return []
}

export async function getMenuItemReusableItems(menuItemId: number) {
  console.warn("getMenuItemReusableItems is a stub and not fully implemented.")
  return []
}

export async function updateMenuItemReusableItems(menuItemId: number, reusableItemsData: any) {
  console.warn("updateMenuItemReusableItems is a stub and not fully implemented.")
  revalidatePath(`/dashboard/menus/dishes/${menuItemId}`)
  return { success: true, message: "(Stub) Reusable items updated." }
}
