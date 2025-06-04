"use server"

import { sql } from "@/lib/db" // Import sql from lib/db
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"

// Helper to upload image to Vercel Blob
async function uploadImageToBlob(file: File | undefined | null, folder: string) {
  if (!file) return null // No file provided, return null
  if (file.size === 0) return null // Empty file, return null

  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const { url } = await put(filename, file, { access: "public" })
  return url
}

// Helper to delete image from Vercel Blob
async function deleteImageFromBlob(url: string | undefined | null) {
  if (!url) return
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting blob:", error)
    // Don't throw, just log, as it shouldn't block the main operation
  }
}

// Digital Menu Actions
export async function getDigitalMenus() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const result = await sql`
      SELECT id, name, status, qr_code_url, created_at, updated_at, template_id
      FROM digital_menus
      WHERE restaurant_id = ${restaurantId}
      ORDER BY created_at DESC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    throw new Error("Failed to fetch digital menus.")
  }
}

export async function getDigitalMenuWithTemplate(menuId: number) {
  console.log(`[getDigitalMenuWithTemplate] ========== FUNCTION START ==========`)
  console.log(`[getDigitalMenuWithTemplate] Input menuId: ${menuId} (type: ${typeof menuId})`)
  console.log(`[getDigitalMenuWithTemplate] DATABASE_URL status: ${process.env.DATABASE_URL ? "SET" : "NOT SET"}`)

  // Check if sql function is available
  console.log(`[getDigitalMenuWithTemplate] sql function type: ${typeof sql}`)
  console.log(`[getDigitalMenuWithTemplate] sql function: ${sql}`)

  let result: any = null

  try {
    console.log(`[getDigitalMenuWithTemplate] --- STEP 1: Creating SQL query ---`)

    const query = sql`
      SELECT
        dm.id,
        dm.name,
        dm.status,
        dm.qr_code_url,
        dm.created_at,
        dm.updated_at,
        dm.template_id,
        dm.restaurant_id,
        mt.name AS template_name,
        mt.description AS template_description,
        mt.preview_image_url AS template_preview_image,
        mt.template_data_json AS template_data
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${menuId}
    `

    console.log(`[getDigitalMenuWithTemplate] --- STEP 2: Query object created ---`)
    console.log(`[getDigitalMenuWithTemplate] Query object type: ${typeof query}`)
    console.log(`[getDigitalMenuWithTemplate] Query strings: ${JSON.stringify(query.strings)}`)
    console.log(`[getDigitalMenuWithTemplate] Query values: ${JSON.stringify(query.values)}`)

    console.log(`[getDigitalMenuWithTemplate] --- STEP 3: About to execute query ---`)

    try {
      console.log(`[getDigitalMenuWithTemplate] --- STEP 3a: Calling await query ---`)
      result = await query
      console.log(`[getDigitalMenuWithTemplate] --- STEP 3b: Query execution completed ---`)
      console.log(`[getDigitalMenuWithTemplate] Raw result type: ${typeof result}`)
      console.log(`[getDigitalMenuWithTemplate] Raw result is array: ${Array.isArray(result)}`)
      console.log(`[getDigitalMenuWithTemplate] Raw result is null: ${result === null}`)
      console.log(`[getDigitalMenuWithTemplate] Raw result is undefined: ${result === undefined}`)

      if (result) {
        console.log(`[getDigitalMenuWithTemplate] Result length: ${result.length}`)
        console.log(`[getDigitalMenuWithTemplate] Result content: ${JSON.stringify(result, null, 2)}`)
      } else {
        console.log(`[getDigitalMenuWithTemplate] Result is falsy: ${result}`)
      }
    } catch (queryError: any) {
      console.error(`[getDigitalMenuWithTemplate] --- STEP 3c: ERROR DURING QUERY EXECUTION ---`)
      console.error(`[getDigitalMenuWithTemplate] Query error type: ${typeof queryError}`)
      console.error(`[getDigitalMenuWithTemplate] Query error message: ${queryError?.message}`)
      console.error(`[getDigitalMenuWithTemplate] Query error stack: ${queryError?.stack}`)
      console.error(`[getDigitalMenuWithTemplate] Query error name: ${queryError?.name}`)
      console.error(`[getDigitalMenuWithTemplate] Full query error object:`, queryError)
      throw new Error(`Database query failed: ${queryError?.message || "Unknown query error"}`)
    }

    console.log(`[getDigitalMenuWithTemplate] --- STEP 4: Processing result ---`)

    if (!result || result.length === 0) {
      console.warn(`[getDigitalMenuWithTemplate] No menu found for ID ${menuId}. Result: ${result}`)
      return null
    }

    console.log(`[getDigitalMenuWithTemplate] --- STEP 5: Accessing result[0] ---`)
    console.log(`[getDigitalMenuWithTemplate] About to access result[0]...`)

    const firstResult = result[0]
    console.log(`[getDigitalMenuWithTemplate] Successfully accessed result[0]: ${JSON.stringify(firstResult, null, 2)}`)

    console.log(`[getDigitalMenuWithTemplate] ========== FUNCTION SUCCESS ==========`)
    return firstResult
  } catch (error: any) {
    console.error(`[getDigitalMenuWithTemplate] ========== FUNCTION ERROR ==========`)
    console.error(`[getDigitalMenuWithTemplate] Error type: ${typeof error}`)
    console.error(`[getDigitalMenuWithTemplate] Error message: ${error?.message}`)
    console.error(`[getDigitalMenuWithTemplate] Error stack: ${error?.stack}`)
    console.error(`[getDigitalMenuWithTemplate] Error name: ${error?.name}`)
    console.error(`[getDigitalMenuWithTemplate] Full error object:`, error)
    console.error(`[getDigitalMenuWithTemplate] ========== END ERROR LOG ==========`)
    throw new Error(`Failed to fetch digital menu with template: ${error?.message || "Unknown error"}`)
  }
}

export async function createDigitalMenu(data: { name: string; status: string }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create digital menu.")
    }

    const result = await sql`
      INSERT INTO digital_menus (name, status, restaurant_id)
      VALUES (${data.name}, ${data.status}, ${restaurantId})
      RETURNING id, name, status
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return result[0]
  } catch (error) {
    console.error("Error creating digital menu:", error)
    throw new Error("Failed to create digital menu.")
  }
}

export async function updateDigitalMenu(id: number, data: { name?: string; status?: string; template_id?: number }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update digital menu.")
    }

    const result = await sql`
      UPDATE digital_menus
      SET
        name = COALESCE(${data.name}, name),
        status = COALESCE(${data.status}, status),
        template_id = COALESCE(${data.template_id}, template_id),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, status, template_id
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return result[0]
  } catch (error) {
    console.error("Error updating digital menu:", error)
    throw new Error("Failed to update digital menu.")
  }
}

export async function deleteDigitalMenu(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete digital menu.")
    }

    // Delete associated menu items first (if cascade delete is not set up)
    await sql`DELETE FROM menu_items WHERE digital_menu_id = ${id}`

    await sql`
      DELETE FROM digital_menus
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting digital menu:", error)
    throw new Error("Failed to delete digital menu.")
  }
}

// Menu Item Actions
export async function getMenuItemsByMenuId(digitalMenuId: number) {
  try {
    const result = await sql`
      SELECT mi.id, mi.name, mi.description, mi.price, mi.image_url, mi.menu_category_id, c.name as category_name
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id -- Join to ensure menu exists
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      WHERE mi.digital_menu_id = ${digitalMenuId}
      ORDER BY mi.name ASC
    `
    return result || []
  } catch (error) {
    console.error(`Error fetching menu items for menu ${digitalMenuId}:`, error)
    throw new Error("Failed to fetch menu items.")
  }
}

export async function createMenuItem(
  data: {
    digital_menu_id: number
    name: string
    description: string
    price: number
    menu_category_id: number
  },
  imageFile?: File,
) {
  console.log("Server Action: createMenuItem received data:", data)
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create menu item.")
    }

    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${data.digital_menu_id} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    let imageUrl: string | null = null
    if (imageFile) {
      imageUrl = await uploadImageToBlob(imageFile, "menu-items")
    }

    const result = await sql`
      INSERT INTO menu_items (digital_menu_id, name, description, price, image_url, menu_category_id)
      VALUES (${data.digital_menu_id}, ${data.name}, ${data.description}, ${data.price}, ${imageUrl}, ${data.menu_category_id})
      RETURNING id, name, description, price, image_url, menu_category_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${data.digital_menu_id}`)
    console.log("Server Action: createMenuItem result:", result[0])
    return result[0]
  } catch (error) {
    console.error("Error creating menu item:", error)
    throw new Error("Failed to create menu item.")
  }
}

export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    menu_category_id?: number
  },
  imageFileOrNull?: File | null,
) {
  console.log("Server Action: updateMenuItem received data:", {
    id,
    data,
    imageFileOrNull: imageFileOrNull ? (imageFileOrNull instanceof File ? imageFileOrNull.name : "null") : "undefined",
  })
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update menu item.")
    }

    const currentItem = await sql`
      SELECT mi.image_url, dm.restaurant_id, mi.digital_menu_id
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id}
    `
    if (currentItem.length === 0 || currentItem[0].restaurant_id !== restaurantId) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    let imageUrlToUpdate: string | undefined | null = undefined
    const existingImageUrl = currentItem[0].image_url

    if (imageFileOrNull === null) {
      imageUrlToUpdate = null
      if (existingImageUrl) {
        await deleteImageFromBlob(existingImageUrl)
      }
    } else if (imageFileOrNull instanceof File) {
      imageUrlToUpdate = await uploadImageToBlob(imageFileOrNull, "menu-items")
      if (existingImageUrl) {
        await deleteImageFromBlob(existingImageUrl)
      }
    }

    const result = await sql`
      UPDATE menu_items
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
        image_url = COALESCE(${imageUrlToUpdate}, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, price, image_url, menu_category_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${currentItem[0].digital_menu_id}`)
    console.log("Server Action: updateMenuItem result:", result[0])
    return result[0]
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw new Error("Failed to update menu item.")
  }
}

export async function deleteMenuItem(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete menu item.")
    }

    // Verify that the menu item belongs to the current restaurant
    const itemCheck = await sql`
      SELECT mi.id, mi.image_url FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Menu item not found or does not belong to your restaurant.")
    }

    // Delete image from blob storage if it exists
    if (itemCheck[0].image_url) {
      await deleteImageFromBlob(itemCheck[0].image_url)
    }

    await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting menu item:", error)
    throw new Error(error.message || "Failed to delete menu item.")
  }
}

// AI Menu Upload Action
export async function mockAiMenuUpload(file: File, digitalMenuId: number) {
  console.log(`[mockAiMenuUpload] Received file: ${file.name} for menu ID: ${digitalMenuId}`);

  // Simulate AI processing delay (e.g., 2-5 seconds)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 3000 + 2000));

  // Mocked AI-extracted items
  // In a real scenario, this data would come from an AI service
  // and you'd likely want to parse the file content.
  const extractedItems = [
    {
      id: 0, // Temporary ID, real ID will be assigned on creation
      name: "Tacos al Pastor (AI)",
      description: "Deliciosos tacos de cerdo marinado con achiote, servidos con piña, cebolla y cilantro.",
      price: Math.round((Math.random() * 10 + 10) * 100) / 100, // Random price between 10-20
      menu_category_id: 1, // Placeholder category ID
      category_name: "Platos Fuertes",
      ai_extracted: true, // Flag to indicate it's from AI
    },
    {
      id: 0,
      name: "Guacamole Fresco (AI)",
      description: "Aguacate fresco machacado con cebolla, tomate, cilantro y un toque de limón.",
      price: Math.round((Math.random() * 5 + 5) * 100) / 100, // Random price between 5-10
      menu_category_id: 2, // Placeholder category ID
      category_name: "Entradas",
      ai_extracted: true,
    },
    {
      id: 0,
      name: "Horchata Casera (AI)",
      description: "Bebida refrescante de arroz con canela y vainilla.",
      price: Math.round((Math.random() * 3 + 2) * 100) / 100, // Random price between 2-5
      menu_category_id: 3, // Placeholder category ID
      category_name: "Bebidas",
      ai_extracted: true,
    },
    {
      id: 0,
      name: "Sopa de Tortilla (AI)",
      description: "Caldo de tomate con pollo deshebrado, tiras de tortilla frita, aguacate, queso y crema.",
      price: Math.round((Math.random() * 8 + 7) * 100) / 100, // Random price between 7-15
      menu_category_id: 1, // Placeholder category ID
      category_name: "Platos Fuertes",
      ai_extracted: true,
    },
  ];

  console.log(`[mockAiMenuUpload] Returning ${extractedItems.length} mock items.`);
  return extractedItems;
}

// Menu Template Actions
export async function getMenuTemplates() {
  try {
    const templates = [
      {
        id: 1,
        name: "Clásico Elegante",
        description: "Un diseño atemporal y sofisticado.",
        preview_image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 2,
        name: "Moderno Minimalista",
        description: "Líneas limpias y enfoque en el platillo.",
        preview_image: "/placeholder.svg?height=200&width=300",
      },
      {
        id: 3,
        name: "Rústico Tradicional",
        description: "Ambiente cálido con texturas naturales.",
        preview_image: "/placeholder.svg?height=200&width=300",
      },
    ]
    return templates
  } catch (error) {
    console.error("Error fetching menu templates:", error)
    throw new Error("Failed to fetch menu templates.")
  }
}

export async function applyTemplateToMenu(digitalMenuId: number, templateId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to apply template.")
    }

    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    await sql`
      UPDATE digital_menus
      SET template_id = ${templateId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${digitalMenuId}
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true }
  } catch (error) {
    console.error(`Error applying template ${templateId} to menu ${digitalMenuId}:`, error)
    throw new Error("Failed to apply template to menu.")
  }
}
