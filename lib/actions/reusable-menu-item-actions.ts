"use server"

import { sql as neonSql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"
import { z } from "zod"

const ReusableMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  category_id: z.number().optional().nullable(),
  isAvailable: z.boolean().optional(),
})

export async function getReusableMenuItems() {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const items = await neonSql`
      SELECT rmi.*, c.name as category_name
      FROM reusable_menu_items rmi
      LEFT JOIN categories c ON rmi.category_id = c.id
      WHERE rmi.restaurant_id = ${restaurantId}
      ORDER BY rmi.name ASC
    `
    return items
  } catch (error: any) {
    console.error("Error fetching reusable menu items:", error)
    throw new Error("Failed to fetch reusable menu items: " + error.message)
  }
}

export async function getReusableMenuItemById(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const result = await neonSql`
      SELECT rmi.*, c.name as category_name
      FROM reusable_menu_items rmi
      LEFT JOIN categories c ON rmi.category_id = c.id
      WHERE rmi.id = ${id} AND rmi.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error: any) {
    console.error(`Error fetching reusable menu item by ID ${id}:`, error)
    throw new Error("Failed to fetch reusable menu item by ID: " + error.message)
  }
}

export async function createReusableMenuItem(data: z.infer<typeof ReusableMenuItemSchema>, imageFile?: File | null) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const validatedFields = ReusableMenuItemSchema.safeParse(data)
  if (!validatedFields.success) {
    console.error("Validation Errors (createReusableMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(`Invalid reusable menu item data: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`)
  }
  const { name, description, price, category_id, isAvailable } = validatedFields.data

  let imageUrl: string | undefined = undefined
  if (imageFile && imageFile.size > 0) {
    try {
      const filename = `reusable-menu-items/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { url } = await put(filename, imageFile, { access: "public" })
      imageUrl = url
    } catch (uploadError: any) {
      console.error("Error uploading image for reusable menu item:", uploadError)
      throw new Error("Failed to upload image: " + uploadError.message)
    }
  }

  try {
    const insertResult = await neonSql`
      INSERT INTO reusable_menu_items (restaurant_id, name, description, price, category_id, image_url, is_available)
      VALUES (${restaurantId}, ${name}, ${description}, ${price}, ${category_id}, ${imageUrl}, ${isAvailable ?? true})
      RETURNING *
    `
    revalidatePath(`/dashboard/operations-hub/recipes`)
    return insertResult[0]
  } catch (dbError: any) {
    console.error("Database Error (createReusableMenuItem):", dbError)
    if (imageUrl) {
      try {
        await del(imageUrl)
      } catch (e) {
        console.error("Failed to delete orphaned image:", e)
      }
    }
    throw new Error("Database Error: Failed to Create Reusable Menu Item. " + dbError.message)
  }
}

export async function updateReusableMenuItem(
  id: number,
  data: Partial<z.infer<typeof ReusableMenuItemSchema>>,
  imageFileOrNull?: File | null,
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const existingItems = await neonSql`
    SELECT rmi.image_url
    FROM reusable_menu_items rmi
    WHERE rmi.id = ${id} AND rmi.restaurant_id = ${restaurantId}
  `
  if (existingItems.length === 0) throw new Error("Reusable menu item not found or not owned by this restaurant.")
  const existingItem = existingItems[0]

  const validatedFields = ReusableMenuItemSchema.safeParse(data)
  if (!validatedFields.success) {
    console.error("Validation Errors (updateReusableMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(
      `Invalid reusable menu item data for update: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`,
    )
  }

  const dataToUpdate = validatedFields.data
  let newImageUrl: string | undefined | null = undefined

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
      const filename = `reusable-menu-items/${Date.now()}-${imageFileOrNull.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { url } = await put(filename, imageFileOrNull, { access: "public" })
      newImageUrl = url
    } catch (uploadError: any) {
      console.error("Error uploading new image for reusable menu item:", uploadError)
      throw new Error("Failed to upload new image: " + uploadError.message)
    }
  }

  const { name, description, price, category_id, isAvailable } = dataToUpdate

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
    setClauses.push(`category_id = $${queryParams.length + 1}`)
    queryParams.push(category_id)
  }
  if (isAvailable !== undefined) {
    setClauses.push(`is_available = $${queryParams.length + 1}`)
    queryParams.push(isAvailable)
  }

  if (newImageUrl !== undefined) {
    setClauses.push(`image_url = $${queryParams.length + 1}`)
    queryParams.push(newImageUrl)
  }

  if (setClauses.length === 0) {
    console.warn("updateReusableMenuItem called with no data to update for item ID:", id)
    const currentItem = await getReusableMenuItemById(id)
    return currentItem
  }

  setClauses.push(`updated_at = CURRENT_TIMESTAMP`)

  queryParams.push(id)
  const idParamIndex = queryParams.length

  try {
    const updateQueryString = `UPDATE reusable_menu_items SET ${setClauses.join(", ")} WHERE id = $${idParamIndex} RETURNING *`
    const updatedResult = await neonSql({ text: updateQueryString, values: queryParams })

    revalidatePath(`/dashboard/operations-hub/recipes`)
    return updatedResult[0]
  } catch (dbError: any) {
    console.error("Database Error (updateReusableMenuItem):", dbError)
    throw new Error("Database Error: Failed to Update Reusable Menu Item. " + dbError.message)
  }
}

export async function deleteReusableMenuItem(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const itemsToDelete = await neonSql`
    SELECT rmi.image_url
    FROM reusable_menu_items rmi
    WHERE rmi.id = ${id} AND rmi.restaurant_id = ${restaurantId}
  `

  if (itemsToDelete.length === 0) {
    throw new Error("Reusable menu item not found or does not belong to this restaurant.")
  }
  const itemToDelete = itemsToDelete[0]

  try {
    await neonSql`DELETE FROM reusable_menu_items WHERE id = ${id}`

    if (itemToDelete.image_url) {
      try {
        await del(itemToDelete.image_url)
      } catch (e) {
        console.error("Failed to delete image on item delete:", e)
      }
    }

    revalidatePath(`/dashboard/operations-hub/recipes`)
    return { success: true, message: "Reusable menu item deleted successfully." }
  } catch (dbError: any) {
    console.error("Database Error (deleteReusableMenuItem):", dbError)
    throw new Error("Database Error: Failed to Delete Reusable Menu Item. " + dbError.message)
  }
}
