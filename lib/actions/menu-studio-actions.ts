"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { z } from "zod"
import { getSession } from "@/lib/auth" // Ensure getSession is imported

// --- Digital Menu Actions ---

const digitalMenuSchema = z.object({
  name: z.string().min(1, "El nombre es requerido."),
  status: z.enum(["active", "draft"]),
})

export async function getDigitalMenus() {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getDigitalMenus.")
    return []
  }
  try {
    const menus = await sql`
      SELECT id, name, status, created_at::text, updated_at::text
      FROM digital_menus
      WHERE restaurant_id = ${session.restaurantId}
      ORDER BY id DESC
    `
    return menus as { id: number; name: string; status: string; created_at: string; updated_at: string }[]
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    throw new Error("No se pudieron cargar los menús digitales.")
  }
}

export async function createDigitalMenu(data: { name: string; status: string }) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot create digital menu.")
  }
  const validatedData = digitalMenuSchema.parse(data)
  try {
    const [newMenu] = await sql`
      INSERT INTO digital_menus (name, status, restaurant_id)
      VALUES (${validatedData.name}, ${validatedData.status}, ${session.restaurantId})
      RETURNING id, name, status
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return newMenu as { id: number; name: string; status: string }
  } catch (error) {
    console.error("Error creating digital menu:", error)
    throw new Error("No se pudo crear el menú digital.")
  }
}

export async function updateDigitalMenu(id: number, data: { name?: string; status?: string; qr_code_url?: string }) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot update digital menu.")
  }
  // Validate that the menu belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  const validatedData = digitalMenuSchema.partial().parse(data)
  try {
    const [updatedMenu] = await sql`
      UPDATE digital_menus
      SET
        name = COALESCE(${validatedData.name ?? null}, name),
        status = COALESCE(${validatedData.status ?? null}, status),
        qr_code_url = COALESCE(${data.qr_code_url ?? null}, qr_code_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id, name, status
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return updatedMenu as { id: number; name: string; status: string }
  } catch (error) {
    console.error("Error updating digital menu:", error)
    throw new Error("No se pudo actualizar el menú digital.")
  }
}

export async function deleteDigitalMenu(id: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot delete digital menu.")
  }
  // Validate that the menu belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${id} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }
  try {
    // Also delete associated menu items
    await sql`DELETE FROM menu_items WHERE digital_menu_id = ${id}`
    await sql`DELETE FROM digital_menus WHERE id = ${id}`
    revalidatePath("/dashboard/menu-studio/digital-menu")
  } catch (error) {
    console.error("Error deleting digital menu:", error)
    throw new Error("No se pudo eliminar el menú digital.")
  }
}

export async function getDigitalMenuWithTemplate(digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getDigitalMenuWithTemplate.")
    return null
  }
  try {
    const result = await sql`
      SELECT
        dm.id, dm.name, dm.status, dm.qr_code_url, dm.template_id,
        dm.created_at::text, dm.updated_at::text,
        mt.name as template_name, mt.template_data_json
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${digitalMenuId} AND dm.restaurant_id = ${session.restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching digital menu with template:", error)
    throw new Error("Failed to fetch digital menu with template.")
  }
}

// --- Menu Item Actions ---

const menuItemSchema = z.object({
  digital_menu_id: z.number(),
  name: z.string().min(1, "El nombre del platillo es requerido."),
  description: z.string().optional().nullable(),
  price: z.number().positive("El precio debe ser un número positivo."),
  menu_category_id: z.number().optional().nullable(),
  image_url: z.string().url().optional().nullable(),
})

export async function getMenuItemsByMenuId(digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getMenuItemsByMenuId.")
    return []
  }
  // Verify that the digital_menu_id belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  try {
    const items = await sql`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.menu_category_id,
        mc.name AS category_name
      FROM menu_items mi
      LEFT JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mi.digital_menu_id = ${digitalMenuId}
      ORDER BY mi.name
    `
    return items as {
      id: number
      name: string
      description: string
      price: number
      image_url?: string
      menu_category_id: number
      category_name?: string
    }[]
  } catch (error) {
    console.error(`Error fetching menu items for menu ${digitalMenuId}:`, error)
    throw new Error("No se pudieron cargar los elementos del menú.")
  }
}

export async function createMenuItem(
  data: {
    digital_menu_id: number
    name: string
    description?: string | null
    price: number
    menu_category_id?: number | null
  },
  imageFile?: File,
) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot create menu item.")
  }

  // Verify that the digital_menu_id belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${data.digital_menu_id} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  const validatedData = menuItemSchema.omit({ image_url: true }).parse(data)
  let imageUrl: string | null = null

  if (imageFile) {
    // In a real application, you would upload the image to a storage service (e.g., Vercel Blob, S3)
    // For now, we'll simulate an upload or use a placeholder.
    // Example: const { url } = await put(imageFile.name, imageFile, { access: 'public' });
    // imageUrl = url;
    console.log("Simulating image upload for:", imageFile.name)
    imageUrl = `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(imageFile.name)}` // Placeholder
  }

  try {
    const [newItem] = await sql`
      INSERT INTO menu_items (digital_menu_id, name, description, price, menu_category_id, image_url)
      VALUES (
        ${validatedData.digital_menu_id},
        ${validatedData.name},
        ${validatedData.description ?? null},
        ${validatedData.price},
        ${validatedData.menu_category_id ?? null},
        ${imageUrl}
      )
      RETURNING id, name, description, price, image_url, menu_category_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${validatedData.digital_menu_id}`)
    return newItem as {
      id: number
      name: string
      description: string
      price: number
      image_url?: string
      menu_category_id: number
    }
  } catch (error) {
    console.error("Error creating menu item:", error)
    throw new Error("No se pudo crear el elemento del menú.")
  }
}

export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    description?: string | null
    price?: number
    menu_category_id?: number | null
  },
  imageFile?: File | null, // null means remove existing image
) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot update menu item.")
  }

  // Verify that the menu item belongs to the current restaurant
  const itemCheck = await sql`
    SELECT mi.id FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${session.restaurantId}
  `
  if (itemCheck.length === 0) {
    throw new Error("Menu item not found or does not belong to your restaurant.")
  }

  const validatedData = menuItemSchema.partial().omit({ image_url: true }).parse(data)
  let imageUrl: string | undefined | null = undefined // undefined means no change, null means clear image

  if (imageFile === null) {
    imageUrl = null // Explicitly set to null to clear the image
  } else if (imageFile) {
    // Simulate image upload
    console.log("Simulating image upload for update:", imageFile.name)
    imageUrl = `/placeholder.svg?height=100&width=100&text=${encodeURIComponent(imageFile.name)}` // Placeholder
  }

  try {
    const [updatedItem] = await sql`
      UPDATE menu_items
      SET
        name = COALESCE(${validatedData.name ?? null}, name),
        description = COALESCE(${validatedData.description ?? null}, description),
        price = COALESCE(${validatedData.price ?? null}, price),
        menu_category_id = COALESCE(${validatedData.menu_category_id ?? null}, menu_category_id),
        ${imageUrl !== undefined ? sql`image_url = ${imageUrl}` : sql``}
      WHERE id = ${id}
      RETURNING id, name, description, price, image_url, menu_category_id, digital_menu_id
    `
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${updatedItem.digital_menu_id}`)
    return updatedItem as {
      id: number
      name: string
      description: string
      price: number
      image_url?: string
      menu_category_id: number
      digital_menu_id: number
    }
  } catch (error) {
    console.error("Error updating menu item:", error)
    throw new Error("No se pudo actualizar el elemento del menú.")
  }
}

export async function deleteMenuItem(id: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot delete menu item.")
  }

  // Verify that the menu item belongs to the current restaurant
  const itemCheck = await sql`
    SELECT mi.id, mi.digital_menu_id FROM menu_items mi
    JOIN digital_menus dm ON mi.digital_menu_id = dm.id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${session.restaurantId}
  `
  if (itemCheck.length === 0) {
    throw new Error("Menu item not found or does not belong to your restaurant.")
  }
  const digitalMenuId = itemCheck[0].digital_menu_id

  try {
    await sql`DELETE FROM menu_items WHERE id = ${id}`
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${digitalMenuId}`)
  } catch (error) {
    console.error("Error deleting menu item:", error)
    throw new Error("No se pudo eliminar el elemento del menú.")
  }
}

// --- Category Actions ---

export async function getCategoriesByType(type: string) {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getCategoriesByType.")
    return []
  }
  try {
    const categories = await sql`
      SELECT id, name
      FROM menu_categories
      WHERE type = ${type} AND restaurant_id = ${session.restaurantId}
      ORDER BY name
    `
    return categories as { id: number; name: string }[]
  } catch (error) {
    console.error(`Error fetching categories of type ${type}:`, error)
    throw new Error("No se pudieron cargar las categorías.")
  }
}

// --- AI Onboarding Actions ---

export async function mockAiMenuUpload(file: File, digitalMenuId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot perform AI menu upload.")
  }

  // Verify that the digital_menu_id belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  console.log(`Simulating AI processing for file: ${file.name} for menu ID: ${digitalMenuId}`)

  // Simulate AI extraction with some mock data
  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate processing time

  // Fetch existing categories for the current restaurant
  const existingCategories = await getCategoriesByType("menu_item") // Assuming 'menu_item' is the type for menu categories
  const defaultCategoryId = existingCategories.length > 0 ? existingCategories[0].id : null

  const mockItems = [
    {
      name: "Pizza Margherita",
      description: "Clásica pizza con tomate, mozzarella fresca y albahaca.",
      price: 12.5,
      menu_category_id: defaultCategoryId,
    },
    {
      name: "Ensalada César",
      description: "Lechuga romana, crutones, queso parmesano y aderezo César.",
      price: 8.0,
      menu_category_id: defaultCategoryId,
    },
    {
      name: "Tiramisú",
      description: "Postre italiano de café, mascarpone y bizcochos.",
      price: 6.75,
      menu_category_id: defaultCategoryId,
    },
  ]

  return mockItems as { name: string; description: string; price: number; menu_category_id: number | null }[]
}

// --- Template Actions ---

export async function getMenuTemplates() {
  const session = await getSession()
  if (!session?.restaurantId) {
    console.warn("No active session or restaurantId found for getMenuTemplates.")
    return []
  }
  try {
    const templates = await sql`
      SELECT id, name, description, preview_image_url
      FROM menu_templates
      WHERE restaurant_id = ${session.restaurantId} OR is_global = TRUE
      ORDER BY id ASC
    `
    return templates as { id: number; name: string; description: string; preview_image_url?: string }[]
  } catch (error) {
    console.error("Error fetching menu templates:", error)
    throw new Error("No se pudieron cargar las plantillas de menú.")
  }
}

export async function applyTemplateToMenu(menuId: number, templateId: number) {
  const session = await getSession()
  if (!session?.restaurantId) {
    throw new Error("No active session or restaurantId found. Cannot apply template.")
  }
  // Verify that the digital_menu_id belongs to the current restaurant
  const menuCheck = await sql`
    SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${session.restaurantId}
  `
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to your restaurant.")
  }

  try {
    await sql`
      UPDATE digital_menus
      SET template_id = ${templateId}
      WHERE id = ${menuId}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
  } catch (error) {
    console.error(`Error applying template ${templateId} to menu ${menuId}:`, error)
    throw new Error("No se pudo aplicar la plantilla al menú.")
  }
}
