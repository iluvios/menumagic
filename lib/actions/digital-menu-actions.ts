"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { uploadBase64ImageToBlob } from "@/lib/utils/blob-helpers"

export async function getDigitalMenus() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }
    const result = await sql`
      SELECT 
        dm.id, 
        dm.name, 
        dm.status, 
        dm.qr_code_url, 
        dm.created_at, 
        dm.updated_at, 
        dm.template_id,
        mt.name as template_name
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.restaurant_id = ${restaurantId}
      ORDER BY dm.created_at DESC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    throw new Error("Failed to fetch digital menus.")
  }
}

export async function getDigitalMenuById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required.")
    }
    const result = await sql`
      SELECT 
        dm.id, 
        dm.name, 
        dm.status, 
        dm.qr_code_url, 
        dm.created_at, 
        dm.updated_at, 
        dm.template_id,
        mt.name as template_name
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error(`Error fetching digital menu by ID ${id}:`, error)
    throw new Error("Failed to fetch digital menu by ID.")
  }
}

export async function getDigitalMenuWithTemplate(menuId: number) {
  try {
    const query = await sql`
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

    if (!query || query.length === 0) {
      return null
    }

    return query[0]
  } catch (error: any) {
    console.error("Error fetching digital menu with template:", error)
    throw new Error(`Failed to fetch digital menu with template: ${error?.message || "Unknown error"}`)
  }
}

export async function createDigitalMenu(data: { name: string; status: string }) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
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

export async function updateDigitalMenu(
  id: number,
  data: { name?: string; status?: string; template_id?: number; qr_code_url?: string },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update digital menu.")
    }

    const result = await sql`
      UPDATE digital_menus
      SET
        name = COALESCE(${data.name}, name),
        status = COALESCE(${data.status}, status),
        template_id = COALESCE(${data.template_id}, template_id),
        qr_code_url = COALESCE(${data.qr_code_url}, qr_code_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, status, template_id, qr_code_url
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
      throw new Error("Authentication required to delete digital menu.")
    }

    // Delete associated menu items first
    await sql`DELETE FROM menu_items WHERE digital_menu_id = ${id}`
    // Delete associated digital_menu_categories entries
    await sql`DELETE FROM digital_menu_categories WHERE digital_menu_id = ${id}`

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

export async function uploadQrCodeForDigitalMenu(menuId: number, base64Image: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to upload QR code.")
    }

    // Verify the digital menu belongs to the current restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    const filename = `qr-code-${menuId}.png`
    const qrCodeUrl = await uploadBase64ImageToBlob(base64Image, filename)

    await updateDigitalMenu(menuId, { qr_code_url: qrCodeUrl })

    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true, qrCodeUrl }
  } catch (error) {
    console.error("Error uploading QR code:", error)
    throw new Error("Failed to upload QR code.")
  }
}

export async function getDigitalMenuQrCodeUrl(menuId: number): Promise<string | null> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required.")
    }
    const result = await sql`
      SELECT qr_code_url
      FROM digital_menus 
      WHERE id = ${menuId} AND restaurant_id = ${restaurantId}
    `
    return result[0]?.qr_code_url || null
  } catch (error) {
    console.error(`Error fetching QR code URL for menu ID ${menuId}:`, error)
    throw new Error("Failed to fetch QR code URL.")
  }
}
