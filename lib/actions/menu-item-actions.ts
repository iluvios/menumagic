"use server"

import { sql as neonSql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"
import { z } from "zod"

// Define Zod schemas for validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  category_id: z.number().optional().nullable(), // Changed from menu_category_id
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
      LEFT JOIN categories c ON mi.category_id = c.id -- Changed from mi.menu_category_id
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
      LEFT JOIN categories c ON mi.category_id = c.id -- Changed from mi.menu_category_id
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
  let { name, description, price, category_id, digital_menu_id, isAvailable, orderIndex } = validatedFields.data // Changed from menu_category_id

  const menuCheckResults =
    await neonSql`SELECT id FROM digital_menus WHERE id = ${digital_menu_id} AND restaurant_id = ${restaurantId}`
  if (menuCheckResults.length === 0) throw new Error("Digital menu not found or does not belong to this restaurant.")

  // ACTIVE IMAGE UPLOAD WITH VERCEL BLOB
  let imageUrl: string | undefined = undefined
  if (imageFile && imageFile.size > 0) {
    try {
      const filename = `menu-items/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { url } = await put(filename, imageFile, { access: "public" })
      imageUrl = url
    } catch (uploadError: any) {
      console.error("Error uploading image for menu item:", uploadError)
      throw new Error("Failed to upload image: " + uploadError.message)
    }
  }

  try {
    if (orderIndex === undefined || orderIndex === null) {
      const result =
        await neonSql`SELECT MAX(order_index) as max_order FROM menu_items WHERE digital_menu_id = ${digital_menu_id} AND category_id = ${category_id}` // Changed from menu_category_id
      const maxOrder = result[0]?.max_order
      orderIndex = (typeof maxOrder === "number" ? maxOrder : -1) + 1
    }

    const insertResult = await neonSql`
      INSERT INTO menu_items (name, description, price, category_id, digital_menu_id, image_url, order_index, is_available) -- Changed from menu_category_id
      VALUES (${name}, ${description}, ${price}, ${category_id}, ${digital_menu_id}, ${imageUrl}, ${orderIndex}, ${isAvailable ?? true})
      RETURNING *
    `

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${digital_menu_id}`)
    return insertResult[0]
  } catch (dbError: any) {
    console.error("Database Error (createMenuItem):", dbError)
    if (imageUrl) {
      try {
        await del(imageUrl)
      } catch (e) {
        console.error("Failed to delete orphaned image:", e)
      }
    }
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
  let newImageUrl: string | undefined | null = undefined

  // ACTIVE IMAGE HANDLING WITH VERCEL BLOB
  if (imageFileOrNull === null) {
    newImageUrl = null
    if (existingItem.image_url) {
      try {
        await del(existingItem.image_url)
      } catch (e) {
        console.error("Failed to delete old image:", e)
      }
    }
  } else if (imageFileOrNull && imageFileOrNull.size > 0) {
    if (existingItem.image_url) {
      try {
        await del(existingItem.image_url)
      } catch (e) {
        console.error("Failed to delete old image before new upload:", e)
      }
    }
    try {
      const filename = `menu-items/${Date.now()}-${imageFileOrNull.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { url } = await put(filename, imageFileOrNull, { access: "public" })
      newImageUrl = url
    } catch (uploadError: any) {
      console.error("Error uploading new image for menu item:", uploadError)
      throw new Error("Failed to upload new image: " + uploadError.message)
    }
  }

  const { name, description, price, category_id, digital_menu_id, isAvailable, orderIndex } = dataToUpdate // Changed from menu_category_id

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
  if (category_id !== undefined) {
    // Changed from menu_category_id
    setClauses.push(`category_id = $${queryParams.length + 1}`) // Changed from menu_category_id
    queryParams.push(category_id)
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

  if (newImageUrl !== undefined) {
    setClauses.push(`image_url = $${queryParams.length + 1}`)
    queryParams.push(newImageUrl)
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

    // ACTIVE IMAGE DELETION WITH VERCEL BLOB
    if (itemToDelete.image_url) {
      try {
        await del(itemToDelete.image_url)
      } catch (e) {
        console.error("Failed to delete image on item delete:", e)
      }
    }

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
    // First check if order_index column exists
    const columnCheck = await neonSql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'menu_items' AND column_name = 'order_index'
    `

    const hasOrderIndex = columnCheck.length > 0

    let menuItems
    if (hasOrderIndex) {
      menuItems = await neonSql`
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id -- Changed from mi.menu_category_id
        JOIN digital_menus dm ON mi.digital_menu_id = dm.id
        WHERE mi.digital_menu_id = ${digital_menu_id} AND dm.restaurant_id = ${restaurantId}
        ORDER BY mi.order_index ASC, mi.id ASC
      `
    } else {
      menuItems = await neonSql`
        SELECT mi.*, c.name as category_name
        FROM menu_items mi
        LEFT JOIN categories c ON mi.category_id = c.id -- Changed from mi.menu_category_id
        JOIN digital_menus dm ON mi.digital_menu_id = dm.id
        WHERE mi.digital_menu_id = ${digital_menu_id} AND dm.restaurant_id = ${restaurantId}
        ORDER BY mi.id ASC
      `
    }

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
    // ACTIVE ORDERING FUNCTIONALITY
    for (let i = 0; i < orderedIds.length; i++) {
      const id = orderedIds[i]
      const orderIndex = i
      await neonSql`
        UPDATE menu_items 
        SET order_index = ${orderIndex}, category_id = ${categoryId === 0 ? null : categoryId} -- Changed from menu_category_id
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
  return getMenuItemById(id)
}

export async function getMenuItemIngredients(menuItemId: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  try {
    const ingredients = await neonSql`
      SELECT mii.*, i.name as ingredient_name, i.unit
      FROM menu_item_ingredients mii
      JOIN ingredients i ON mii.ingredient_id = i.id
      WHERE mii.menu_item_id = ${menuItemId}
      ORDER BY mii.id ASC
    `
    return ingredients
  } catch (error: any) {
    console.error("Error fetching menu item ingredients:", error)
    return []
  }
}

export async function updateMenuItemIngredients(menuItemId: number, ingredientsData: any) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  try {
    await neonSql.transaction(async (sql) => {
      // Delete existing ingredients for this menu item
      await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${menuItemId}`

      // Insert new ingredients
      for (const ingredient of ingredientsData) {
        await sql`
          INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity, unit)
          VALUES (${menuItemId}, ${ingredient.ingredient_id}, ${ingredient.quantity}, ${ingredient.unit})
        `
      }
    })

    revalidatePath(`/dashboard/operations-hub/recipes`)
    revalidatePath(`/dashboard/menus/dishes/${menuItemId}`) // Revalidate if this affects menu display
    return { success: true, message: "Ingredients updated successfully." }
  } catch (error: any) {
    console.error("Error updating menu item ingredients:", error)
    throw new Error("Failed to update menu item ingredients: " + error.message)
  }
}

export async function getMenuItemCategories() {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  try {
    const categories = await neonSql`
      SELECT * FROM categories 
      WHERE restaurant_id = ${restaurantId} AND type = 'menu_item'
      ORDER BY order_index ASC, name ASC
    `
    return categories
  } catch (error: any) {
    console.error("Error fetching menu item categories:", error)
    return []
  }
}
