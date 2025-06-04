"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { uploadBase64ImageToBlob } from "@/lib/utils/blob-helpers"

interface DigitalMenu {
  id: number
  name: string
  status: string
  qr_code_url?: string
  template_name?: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  reusable_menu_item_id?: number
}

interface DigitalMenuCategory {
  id: number
  digital_menu_id: number
  category_id: number
  category_name: string
  order_index: number
}

interface GlobalCategory {
  id: number
  name: string
  type: string
  order_index: number
}

export async function getDigitalMenus(): Promise<DigitalMenu[]> {
  try {
    const { rows } = await sql<DigitalMenu>`
      SELECT
        dm.id,
        dm.name,
        dm.status,
        dm.qr_code_url,
        mt.name AS template_name
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.menu_template_id = mt.id
      ORDER BY dm.created_at DESC;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch digital menus.")
  }
}

export async function getDigitalMenuById(id: number): Promise<DigitalMenu | null> {
  try {
    const { rows } = await sql<DigitalMenu>`
      SELECT
        dm.id,
        dm.name,
        dm.status,
        dm.qr_code_url,
        mt.name AS template_name
      FROM digital_menus dm
      LEFT JOIN menu_templates mt ON dm.menu_template_id = mt.id
      WHERE dm.id = ${id};
    `
    return rows[0] || null
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error(`Failed to fetch digital menu with ID ${id}.`)
  }
}

export async function createDigitalMenu(menuData: { name: string; status: string }): Promise<DigitalMenu> {
  try {
    const { rows } = await sql<DigitalMenu>`
      INSERT INTO digital_menus (name, status)
      VALUES (${menuData.name}, ${menuData.status})
      RETURNING id, name, status, qr_code_url;
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create digital menu.")
  }
}

export async function updateDigitalMenu(
  id: number,
  menuData: { name?: string; status?: string; qr_code_url?: string; menu_template_id?: number | null },
): Promise<DigitalMenu> {
  try {
    const fields = []
    const values = []
    let paramIndex = 1

    if (menuData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`)
      values.push(menuData.name)
    }
    if (menuData.status !== undefined) {
      fields.push(`status = $${paramIndex++}`)
      values.push(menuData.status)
    }
    if (menuData.qr_code_url !== undefined) {
      fields.push(`qr_code_url = $${paramIndex++}`)
      values.push(menuData.qr_code_url)
    }
    if (menuData.menu_template_id !== undefined) {
      fields.push(`menu_template_id = $${paramIndex++}`)
      values.push(menuData.menu_template_id)
    }

    if (fields.length === 0) {
      throw new Error("No fields to update.")
    }

    values.push(id) // Add the ID for the WHERE clause

    const query = `
      UPDATE digital_menus
      SET ${fields.join(", ")}
      WHERE id = $${paramIndex}
      RETURNING id, name, status, qr_code_url;
    `

    const { rows } = await sql.query<DigitalMenu>(query, values)

    if (rows.length === 0) {
      throw new Error(`Digital menu with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${id}`) // Revalidate public menu page
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update digital menu.")
  }
}

export async function deleteDigitalMenu(id: number): Promise<void> {
  try {
    await sql`DELETE FROM digital_menus WHERE id = ${id};`
    revalidatePath("/dashboard/menu-studio/digital-menu")
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete digital menu.")
  }
}

export async function uploadQrCodeForDigitalMenu(menuId: number, base64Image: string) {
  try {
    const filename = `qr-code-${menuId}.png` // Or .svg, depending on what your QR generator outputs
    const qrCodeUrl = await uploadBase64ImageToBlob(base64Image, filename)

    await updateDigitalMenu(menuId, { qr_code_url: qrCodeUrl })

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${menuId}`) // Revalidate public menu page

    return { success: true, qrCodeUrl }
  } catch (error) {
    console.error("Error uploading QR code:", error)
    throw new Error("Failed to upload QR code.")
  }
}

export async function getMenuItemsByMenuId(menuId: number): Promise<MenuItem[]> {
  try {
    const { rows } = await sql<MenuItem>`
      SELECT
        mi.id,
        mi.name,
        mi.description,
        mi.price,
        mi.image_url,
        mi.menu_category_id,
        mc.name AS category_name,
        mi.reusable_menu_item_id
      FROM menu_items mi
      JOIN menu_categories mc ON mi.menu_category_id = mc.id
      WHERE mc.digital_menu_id = ${menuId}
      ORDER BY mc.order_index, mi.order_index;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch menu items for digital menu.")
  }
}

export async function getMenuCategoriesForDigitalMenu(menuId: number): Promise<DigitalMenuCategory[]> {
  try {
    const { rows } = await sql<DigitalMenuCategory>`
      SELECT
        mc.id,
        mc.digital_menu_id,
        mc.category_id,
        gc.name AS category_name,
        mc.order_index
      FROM menu_categories mc
      JOIN global_categories gc ON mc.category_id = gc.id
      WHERE mc.digital_menu_id = ${menuId}
      ORDER BY mc.order_index;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch menu categories for digital menu.")
  }
}

export async function applyTemplateToMenu(menuId: number, templateId: number) {
  try {
    // Get template details
    const { rows: templateRows } = await sql`
      SELECT * FROM menu_templates WHERE id = ${templateId};
    `
    if (templateRows.length === 0) {
      throw new Error("Template not found.")
    }
    const template = templateRows[0]

    // Update the digital menu with the template_id
    await sql`
      UPDATE digital_menus
      SET menu_template_id = ${templateId}
      WHERE id = ${menuId};
    `

    // Clear existing menu items and categories for this digital menu
    await sql`DELETE FROM menu_items WHERE menu_category_id IN (SELECT id FROM menu_categories WHERE digital_menu_id = ${menuId});`
    await sql`DELETE FROM menu_categories WHERE digital_menu_id = ${menuId};`

    // Insert categories from template
    const { rows: templateCategories } = await sql`
      SELECT * FROM template_categories WHERE menu_template_id = ${templateId} ORDER BY order_index;
    `

    for (const tc of templateCategories) {
      const { rows: newCategoryRows } = await sql`
        INSERT INTO menu_categories (digital_menu_id, category_id, order_index)
        VALUES (${menuId}, ${tc.category_id}, ${tc.order_index})
        RETURNING id;
      `
      const newMenuCategoryId = newCategoryRows[0].id

      // Insert menu items for this category from template
      const { rows: templateItems } = await sql`
        SELECT * FROM template_menu_items WHERE template_category_id = ${tc.id} ORDER BY order_index;
      `
      for (const ti of templateItems) {
        await sql`
          INSERT INTO menu_items (menu_category_id, name, description, price, image_url, order_index, reusable_menu_item_id)
          VALUES (${newMenuCategoryId}, ${ti.name}, ${ti.description}, ${ti.price}, ${ti.image_url}, ${ti.order_index}, ${ti.reusable_menu_item_id});
        `
      }
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath(`/menu/${menuId}`) // Revalidate public menu page
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to apply template to menu.")
  }
}
