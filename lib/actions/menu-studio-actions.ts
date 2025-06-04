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
  console.log(`[getDigitalMenuWithTemplate] Attempting to fetch menu ${menuId} with template.`)
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("[getDigitalMenuWithTemplate] No restaurant ID found for session.")
      return null
    }

    const query = sql`
      SELECT
        dm.id,
        dm.name,
        dm.status,
        dm.qr_code_url,
        dm.created_at,
        dm.updated_at,
        dm.template_id,
        mt.name AS template_name,
        mt.description AS template_description,
        mt.preview_image AS template_preview_image,
        mt.template_data_json AS template_data
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${menuId} AND dm.restaurant_id = ${restaurantId}
    `
    console.log("[getDigitalMenuWithTemplate] Executing SQL query:", query.strings[0]) // Log the query string
    const result = await query

    if (result.length === 0) {
      console.warn(
        `[getDigitalMenuWithTemplate] No menu found for ID ${menuId} or it does not belong to this restaurant.`,
      )
      return null
    }

    console.log("[getDigitalMenuWithTemplate] Successfully fetched menu data:", result[0])
    return result[0]
  } catch (error) {
    console.error(`[getDigitalMenuWithTemplate] Detailed error fetching menu ${menuId}:`, error)
    throw new Error("Failed to fetch digital menu with template.")
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
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const result = await sql`
      SELECT mi.id, mi.name, mi.description, mi.price, mi.image_url, mi.menu_category_id, c.name as category_name
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      LEFT JOIN categories c ON mi.menu_category_id = c.id
      WHERE mi.digital_menu_id = ${digitalMenuId} AND dm.restaurant_id = ${restaurantId}
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
  console.log("Server Action: createMenuItem received data:", data) // NEW LOG
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create menu item.")
    }

    // Verify digital_menu_id belongs to the restaurant
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
    console.log("Server Action: createMenuItem result:", result[0]) // NEW LOG
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
  imageFileOrNull?: File | null, // Use File | null to distinguish between no change and explicit null
) {
  console.log("Server Action: updateMenuItem received data:", {
    id,
    data,
    imageFileOrNull: imageFileOrNull ? (imageFileOrNull instanceof File ? imageFileOrNull.name : "null") : "undefined",
  }) // NEW LOG
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update menu item.")
    }

    // Get current item to check ownership and existing image
    const currentItem = await sql`
      SELECT mi.image_url, dm.restaurant_id
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id}
    `
    if (currentItem.length === 0 || currentItem[0].restaurant_id !== restaurantId) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    let imageUrlToUpdate: string | undefined | null = undefined // undefined means no change
    const existingImageUrl = currentItem[0].image_url

    if (imageFileOrNull === null) {
      // Explicitly set to null (user removed image)
      imageUrlToUpdate = null
      if (existingImageUrl) {
        await deleteImageFromBlob(existingImageUrl)
      }
    } else if (imageFileOrNull instanceof File) {
      // New file provided (user uploaded new image)
      imageUrlToUpdate = await uploadImageToBlob(imageFileOrNull, "menu-items")
      if (existingImageUrl) {
        await deleteImageFromBlob(existingImageUrl) // Delete old image
      }
    }
    // If imageFileOrNull is undefined, imageUrlToUpdate remains undefined (no change to image_url column)

    const result = await sql`
      UPDATE menu_items
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
        image_url = COALESCE(${imageUrlToUpdate}, image_url), -- Use COALESCE for image_url
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, description, price, image_url, menu_category_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${currentItem[0].digital_menu_id}`)
    console.log("Server Action: updateMenuItem result:", result[0]) // NEW LOG
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

    // Get item to delete its image from blob storage
    const itemToDelete = await sql`
      SELECT mi.image_url, dm.digital_menu_id
      FROM menu_items mi
      JOIN digital_menus dm ON mi.digital_menu_id = dm.id
      WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    if (itemToDelete.length === 0) {
      throw new Error("Menu item not found or does not belong to this restaurant.")
    }

    await sql`
      DELETE FROM menu_items
      WHERE id = ${id}
    `
    if (itemToDelete[0].image_url) {
      await deleteImageFromBlob(itemToDelete[0].image_url)
    }

    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${itemToDelete[0].digital_menu_id}`)
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu item:", error)
    throw new Error("Failed to delete menu item.")
  }
}

// AI Onboarding Mock Actions
export async function mockAiMenuUpload(file: File, digitalMenuId: number) {
  console.log(`Mock AI processing file: ${file.name} for menu ID: ${digitalMenuId}`)
  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Mock extracted items with placeholder images and categories
  const mockItems = [
    {
      id: 1,
      name: "Pizza Margherita",
      description: "Clásica pizza con tomate, mozzarella fresca y albahaca.",
      price: 12.5,
      image_url: "/placeholder.svg?height=120&width=120",
      menu_category_id: 1, // Assuming category ID 1 exists for "Pizzas"
    },
    {
      id: 2,
      name: "Ensalada César",
      description: "Lechuga romana, crutones, queso parmesano y aderezo César.",
      price: 8.0,
      image_url: "/placeholder.svg?height=120&width=120",
      menu_category_id: 2, // Assuming category ID 2 exists for "Ensaladas"
    },
    {
      id: 3,
      name: "Tiramisú",
      description: "Postre italiano con capas de bizcochos, café, mascarpone y cacao.",
      price: 6.0,
      image_url: "/placeholder.svg?height=120&width=120",
      menu_category_id: 3, // Assuming category ID 3 exists for "Postres"
    },
  ]

  // In a real scenario, you'd map these to actual category IDs from your DB
  // For now, we'll just return them as is, assuming the categories exist or will be created.
  return mockItems
}

// Menu Template Actions
export async function getMenuTemplates() {
  try {
    // In a real app, you might fetch these from a database or a predefined list
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

    // Verify digital_menu_id belongs to the restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Update the digital menu with the selected template_id
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
