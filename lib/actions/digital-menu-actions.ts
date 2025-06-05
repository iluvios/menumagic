"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put } from "@vercel/blob"

export async function getDigitalMenus() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to fetch digital menus.")
    }

    const result = await sql`
      SELECT 
        dm.id,
        dm.name,
        dm.is_active,
        dm.qr_code_url,
        dm.created_at,
        dm.updated_at,
        mt.id as template_id,
        mt.name as template_name,
        mt.description as template_description
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.restaurant_id = ${restaurantId}
      ORDER BY dm.created_at DESC
    `
    return result
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    throw new Error("Failed to fetch digital menus.")
  }
}

export async function getDigitalMenuById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to fetch digital menu.")
    }

    const result = await sql`
      SELECT 
        dm.*,
        mt.id as template_id,
        mt.name as template_name,
        mt.description as template_description,
        mt.layout_config as template_layout_config
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${id} AND dm.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching digital menu:", error)
    throw new Error("Failed to fetch digital menu.")
  }
}

export async function createDigitalMenu(data: any) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create digital menu.")
    }

    const result = await sql`
      INSERT INTO digital_menus (
        restaurant_id, name, template_id, is_active
      )
      VALUES (
        ${restaurantId}, ${data.name}, ${data.template_id || null}, ${data.is_active || false}
      )
      RETURNING id
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("Error creating digital menu:", error)
    throw new Error("Failed to create digital menu.")
  }
}

export async function updateDigitalMenu(id: number, data: any) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update digital menu.")
    }

    // Verify the menu belongs to the restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    await sql`
      UPDATE digital_menus
      SET 
        name = COALESCE(${data.name}, name),
        template_id = COALESCE(${data.template_id}, template_id),
        is_active = COALESCE(${data.is_active}, is_active),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
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

    // Verify the menu belongs to the restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    await sql`DELETE FROM digital_menus WHERE id = ${id}`
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error deleting digital menu:", error)
    throw new Error("Failed to delete digital menu.")
  }
}

export async function uploadQrCodeForDigitalMenu(digitalMenuId: number, qrCodeFile: File) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to upload QR code.")
    }

    // Verify the menu belongs to the restaurant
    const menuCheck = await sql`
      SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
    `
    if (menuCheck.length === 0) {
      throw new Error("Digital menu not found or does not belong to this restaurant.")
    }

    // Upload QR code to Vercel Blob
    const filename = `qr-codes/${digitalMenuId}-${Date.now()}.png`
    const blob = await put(filename, qrCodeFile, { access: "public" })

    // Update the digital menu with the QR code URL
    await sql`
      UPDATE digital_menus
      SET qr_code_url = ${blob.url}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${digitalMenuId}
    `

    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true, qrCodeUrl: blob.url }
  } catch (error) {
    console.error("Error uploading QR code:", error)
    throw new Error("Failed to upload QR code.")
  }
}

export async function getDigitalMenuQrCodeUrl(digitalMenuId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to get QR code URL.")
    }

    const result = await sql`
      SELECT qr_code_url
      FROM digital_menus
      WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
    `
    return result[0]?.qr_code_url || null
  } catch (error) {
    console.error("Error fetching QR code URL:", error)
    throw new Error("Failed to fetch QR code URL.")
  }
}

export async function getDigitalMenuWithTemplate(digitalMenuId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to fetch digital menu with template.")
    }

    const result = await sql`
      SELECT 
        dm.*,
        mt.id as template_id,
        mt.name as template_name,
        mt.description as template_description,
        mt.layout_config as template_layout_config,
        mt.color_scheme as template_color_scheme,
        mt.font_config as template_font_config
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.template_id = mt.id
      WHERE dm.id = ${digitalMenuId} AND dm.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error("Error fetching digital menu with template:", error)
    throw new Error("Failed to fetch digital menu with template.")
  }
}
