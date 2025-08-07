"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"

// Types for clarity
export type Category = {
  id: number
  name: string
  type: string | null
  order_index: number | null
}

export type DigitalMenu = {
  id: number
  name: string
  status: string | null
  template_id: number | null
  qr_code_url: string | null
  created_at?: Date
  updated_at?: Date
}

export type DigitalMenuWithTemplate = {
  id: number
  name: string
  status: string | null
  template_id: number | null
  qr_code_url: string | null
  created_at: Date
  updated_at: Date
  template_name: string | null
  template_description: string | null
  template_preview_image_url: string | null
}

export type Dish = {
  id: number
  name: string
  description: string | null
  price: number
  menu_category_id: number | null
  image_url: string | null
}

export type DigitalMenuCategory = {
  id: number
  digital_menu_id: number
  category_id: number
  category_name: string
  order_index: number
}

export type DigitalMenuCategoryUpdate = {
  id: number
  order_index: number
}

export type MenuItemForUI = {
  id: number // menu_items.id
  digital_menu_id: number
  dish_id: number
  order_index: number | null
  name: string
  description: string | null
  price: number
  image_url: string | null
  menu_category_id: number | null
  category_name: string
  is_available: boolean
}

// -----------------------------
// Categories
// -----------------------------

export async function getAllGlobalCategories(): Promise<Category[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return []
  const rows = await sql<Category[]>`
    SELECT id, name, type, order_index
    FROM categories
    WHERE restaurant_id = ${restaurantId}
    ORDER BY name ASC
  `
  return rows
}

export async function getCategoriesByType(type: string): Promise<Category[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return []
  const rows = await sql<Category[]>`
    SELECT id, name, type, order_index
    FROM categories
    WHERE type = ${type} AND restaurant_id = ${restaurantId}
    ORDER BY name ASC
  `
  return rows
}

export async function createCategory(data: { name: string; type?: string | null; order_index?: number | null }) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to create category.")

  const type = data.type ?? "menu_item"
  const orderIndex = data.order_index ?? 0

  const [row] = await sql<Category[]>`
    INSERT INTO categories (name, type, order_index, restaurant_id)
    VALUES (${data.name}, ${type}, ${orderIndex}, ${restaurantId})
    RETURNING id, name, type, order_index
  `
  revalidatePath("/dashboard/settings/categories")
  return row
}

export async function updateCategory(
  id: number,
  data: { name?: string; type?: string; order_index?: number },
): Promise<Category> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to update category.")

  const [updated] = await sql<Category[]>`
    UPDATE categories
    SET
      name = COALESCE(${data.name}, name),
      type = COALESCE(${data.type}, type),
      order_index = COALESCE(${data.order_index}, order_index),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id, name, type, order_index
  `
  if (!updated) throw new Error("Category not found or does not belong to this restaurant.")
  revalidatePath("/dashboard/settings/categories")
  return updated
}

export async function deleteCategory(id: number): Promise<{ success: boolean }> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to delete category.")

  await sql`DELETE FROM categories WHERE id = ${id} AND restaurant_id = ${restaurantId}`
  revalidatePath("/dashboard/settings/categories")
  return { success: true }
}

// Link categories to a digital menu
export async function getMenuCategoriesForDigitalMenu(digitalMenuId: number): Promise<DigitalMenuCategory[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return []

  const menuCheck =
    await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to this restaurant.")
  }

  const rows = await sql<
    { id: number; digital_menu_id: number; category_id: number; category_name: string; order_index: number }[]
  >`
    SELECT
      dmc.id,
      dmc.digital_menu_id,
      dmc.category_id,
      COALESCE(c.name, 'Uncategorized') AS category_name,
      COALESCE(dmc.order_index, 0) AS order_index
    FROM digital_menu_categories dmc
    JOIN categories c ON c.id = dmc.category_id
    WHERE dmc.digital_menu_id = ${digitalMenuId}
    ORDER BY dmc.order_index ASC, dmc.id ASC
  `
  return rows
}

export async function addCategoryToDigitalMenu(
  digitalMenuId: number,
  categoryId: number,
): Promise<DigitalMenuCategory | null> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to link category to menu.")

  const menuCheck =
    await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to this restaurant.")
  }

  const categoryCheck =
    await sql`SELECT id FROM categories WHERE id = ${categoryId} AND restaurant_id = ${restaurantId}`
  if (categoryCheck.length === 0) {
    throw new Error("Category not found or does not belong to this restaurant.")
  }

  const existingLink = await sql<DigitalMenuCategory[]>`
    SELECT dmc.id,
           dmc.digital_menu_id,
           dmc.category_id,
           c.name AS category_name,
           COALESCE(dmc.order_index, 0) AS order_index
    FROM digital_menu_categories dmc
    JOIN categories c ON c.id = dmc.category_id
    WHERE dmc.digital_menu_id = ${digitalMenuId} AND dmc.category_id = ${categoryId}
  `
  if (existingLink.length > 0) {
    return existingLink[0]
  }

  const [maxOrder] = await sql<{ max_order: number }[]>`
    SELECT COALESCE(MAX(order_index), 0) as max_order
    FROM digital_menu_categories
    WHERE digital_menu_id = ${digitalMenuId}
  `
  const nextOrder = (maxOrder?.max_order ?? 0) + 1

  const [newLink] = await sql<{ id: number; digital_menu_id: number; category_id: number; order_index: number }[]>`
    INSERT INTO digital_menu_categories (digital_menu_id, category_id, order_index)
    VALUES (${digitalMenuId}, ${categoryId}, ${nextOrder})
    RETURNING id, digital_menu_id, category_id, order_index
  `
  const [cat] = await sql<{ name: string }[]>`SELECT name FROM categories WHERE id = ${categoryId}`
  return {
    id: newLink.id,
    digital_menu_id: newLink.digital_menu_id,
    category_id: newLink.category_id,
    order_index: newLink.order_index,
    category_name: cat?.name ?? "Uncategorized",
  }
}

export async function removeCategoryFromDigitalMenu(digitalMenuId: number, digitalMenuCategoryId: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to remove category from menu.")

  const menuCheck =
    await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) {
    throw new Error("Digital menu not found or does not belong to this restaurant.")
  }

  await sql`DELETE FROM digital_menu_categories WHERE id = ${digitalMenuCategoryId} AND digital_menu_id = ${digitalMenuId}`

  // Resequence
  const remaining = await sql<{ id: number; order_index: number }[]>`
    SELECT id, COALESCE(order_index, 0) as order_index
    FROM digital_menu_categories
    WHERE digital_menu_id = ${digitalMenuId}
    ORDER BY order_index ASC, id ASC
  `
  for (let i = 0; i < remaining.length; i++) {
    const desired = i + 1
    if (remaining[i].order_index !== desired) {
      await sql`UPDATE digital_menu_categories SET order_index = ${desired} WHERE id = ${remaining[i].id}`
    }
  }
  return { success: true }
}

// -----------------------------
// Dishes (global) and reusable aliases
// -----------------------------

export async function getAllDishes(): Promise<Dish[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return []
  const rows = await sql<Dish[]>`
    SELECT id, name, description, price, menu_category_id, image_url
    FROM dishes
    WHERE restaurant_id = ${restaurantId}
    ORDER BY name ASC
  `
  return rows
}

export async function createDish(data: {
  name: string
  description?: string | null
  price: number
  menu_category_id?: number | null
  image_file?: File | null
  is_available?: boolean
}) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to create dish.")

  const existing = await sql`SELECT id FROM dishes WHERE name = ${data.name} AND restaurant_id = ${restaurantId}`
  if (existing.length > 0) {
    throw new Error(`A dish named "${data.name}" already exists. Please use a different name.`)
  }

  let imageUrl: string | null = null
  if (data.image_file && data.image_file.size > 0) {
    const filename = `dishes/${Date.now()}-${data.image_file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
    const { url } = await put(filename, data.image_file, { access: "public" })
    imageUrl = url
  }

  const [row] = await sql<{ id: number; name: string }[]>`
    INSERT INTO dishes (name, description, price, menu_category_id, image_url, restaurant_id, created_at, updated_at)
    VALUES (${data.name}, ${data.description ?? ""}, ${data.price}, ${data.menu_category_id ?? null}, ${imageUrl}, ${restaurantId}, NOW(), NOW())
    RETURNING id, name
  `
  revalidatePath("/dashboard/menu-studio/digital-menu")
  revalidatePath("/dashboard/menu-studio/recipes")
  revalidatePath("/dashboard/operations-hub/recipes")
  return row
}

export async function updateDish(
  id: number,
  data: {
    name?: string
    description?: string | null
    price?: number
    menu_category_id?: number | null
    image_file?: File | null
    image_url?: string | null
    is_available?: boolean
  },
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to update dish.")

  const dishCheck = await sql`SELECT id, image_url FROM dishes WHERE id = ${id} AND restaurant_id = ${restaurantId}`
  if (dishCheck.length === 0) throw new Error("Dish not found or does not belong to this restaurant.")
  const currentImage: string | null = dishCheck[0].image_url

  let imageUrl: string | null | undefined = data.image_url
  if (typeof data.image_file !== "undefined") {
    if (data.image_file === null) {
      imageUrl = null
      if (currentImage) {
        try {
          await del(currentImage)
        } catch {
          // ignore
        }
      }
    } else if (data.image_file instanceof File) {
      if (currentImage) {
        try {
          await del(currentImage)
        } catch {
          // ignore
        }
      }
      const filename = `dishes/${Date.now()}-${data.image_file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
      const { url } = await put(filename, data.image_file, { access: "public" })
      imageUrl = url
    }
  }

  await sql`
    UPDATE dishes
    SET
      name = COALESCE(${data.name}, name),
      description = COALESCE(${data.description}, description),
      price = COALESCE(${data.price}, price),
      menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
      image_url = COALESCE(${imageUrl}, image_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  revalidatePath("/dashboard/menu-studio/digital-menu")
  revalidatePath("/dashboard/menu-studio/recipes")
  revalidatePath("/dashboard/operations-hub/recipes")
  return { id, name: data.name }
}

export async function deleteDish(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to delete dish.")

  const dishCheck = await sql<{ id: number; image_url: string | null }[]>`
    SELECT id, image_url FROM dishes WHERE id = ${id} AND restaurant_id = ${restaurantId}
  `
  if (dishCheck.length === 0) throw new Error("Dish not found or does not belong to this restaurant.")

  if (dishCheck[0].image_url) {
    try {
      await del(dishCheck[0].image_url!)
    } catch {
      // ignore best effort
    }
  }

  await sql`DELETE FROM menu_items WHERE dish_id = ${id}`
  // Some legacy schemas used this table; ignore if it doesn't exist
  try {
    await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${id}`
  } catch {
    // ignore
  }
  await sql`DELETE FROM dishes WHERE id = ${id}`

  revalidatePath("/dashboard/menu-studio/digital-menu")
  revalidatePath("/dashboard/menu-studio/recipes")
  revalidatePath("/dashboard/operations-hub/recipes")
  return { success: true }
}

// Legacy aliases for compatibility
export const getReusableMenuItems = getAllDishes
export const createReusableMenuItem = createDish
export const updateReusableMenuItem = updateDish
export const deleteReusableMenuItem = deleteDish

// -----------------------------
// Menu Items (link dishes to a digital menu)
// -----------------------------

export async function getMenuItemsByMenuId(digitalMenuId: number): Promise<MenuItemForUI[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const rows = await sql<
    {
      id: number
      digital_menu_id: number
      dish_id: number
      order_index: number | null
      name: string
      description: string | null
      price: number
      image_url: string | null
      menu_category_id: number | null
      category_name: string | null
    }[]
  >`
    SELECT mi.id,
           mi.digital_menu_id,
           mi.dish_id,
           mi.order_index,
           d.name,
           d.description,
           d.price,
           d.image_url,
           d.menu_category_id,
           COALESCE(c.name, 'Uncategorized') AS category_name
    FROM menu_items mi
    JOIN dishes d ON d.id = mi.dish_id
    LEFT JOIN categories c ON c.id = d.menu_category_id
    WHERE mi.digital_menu_id = ${digitalMenuId}
    ORDER BY COALESCE(mi.order_index, 999999), mi.id
  `
  return rows.map((r) => ({
    id: r.id,
    digital_menu_id: r.digital_menu_id,
    dish_id: r.dish_id,
    order_index: r.order_index,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    image_url: r.image_url,
    menu_category_id: r.menu_category_id,
    category_name: r.category_name ?? "Uncategorized",
    is_available: true,
  }))
}

export async function addDishToMenu(digitalMenuId: number, dishId: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const menuCheck =
    await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) throw new Error("Digital menu not found or does not belong to this restaurant.")

  const dishCheck = await sql`SELECT id FROM dishes WHERE id = ${dishId} AND restaurant_id = ${restaurantId}`
  if (dishCheck.length === 0) throw new Error("Dish not found or does not belong to this restaurant.")

  const existing = await sql`SELECT id FROM menu_items WHERE digital_menu_id = ${digitalMenuId} AND dish_id = ${dishId}`
  if (existing.length > 0) throw new Error("This dish is already on the menu.")

  const [maxOrder] = await sql<{ max_order: number | null }[]>`
    SELECT COALESCE(MAX(order_index), -1) as max_order
    FROM menu_items
    WHERE digital_menu_id = ${digitalMenuId}
  `
  const nextOrder = (maxOrder?.max_order ?? -1) + 1

  const [inserted] = await sql<{ id: number }[]>`
    INSERT INTO menu_items (digital_menu_id, dish_id, order_index)
    VALUES (${digitalMenuId}, ${dishId}, ${nextOrder})
    RETURNING id
  `
  revalidatePath(`/dashboard/menu-studio/digital-menu`)
  return inserted
}

type CreateMenuItemInput =
  | { digital_menu_id: number; dish_id: number }
  | { digital_menu_id: number; name: string; description?: string | null; price: number; menu_category_id?: number | null; isAvailable?: boolean }

export async function createMenuItem(data: CreateMenuItemInput) {
  if ("dish_id" in data) {
    return await addDishToMenu(data.digital_menu_id, data.dish_id)
  } else {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) throw new Error("Authentication required.")
    if (!data.name || typeof data.price !== "number") throw new Error("Name and price are required.")

    const [newDish] = await sql<{ id: number }[]>`
      INSERT INTO dishes (name, description, price, menu_category_id, restaurant_id, created_at, updated_at)
      VALUES (${data.name}, ${data.description ?? ""}, ${data.price}, ${data.menu_category_id ?? null}, ${restaurantId}, NOW(), NOW())
      RETURNING id
    `
    return await addDishToMenu(data.digital_menu_id, newDish.id)
  }
}

export async function updateMenuItem(
  id: number,
  data: {
    name?: string
    description?: string | null
    price?: number
    menu_category_id?: number | null
    isAvailable?: boolean
    orderIndex?: number
  },
  imageFile?: File | null,
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const menuItemRow = await sql<{ dish_id: number }[]>`
    SELECT mi.dish_id
    FROM menu_items mi
    JOIN digital_menus dm ON dm.id = mi.digital_menu_id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
  `
  if (menuItemRow.length === 0) throw new Error("Menu item not found or does not belong to this restaurant.")
  const dishId = menuItemRow[0].dish_id

  // Handle image upload/clear
  let imageUrl: string | null | undefined = undefined
  if (imageFile === null) {
    imageUrl = null
    const [curr] = await sql<{ image_url: string | null }[]>`SELECT image_url FROM dishes WHERE id = ${dishId}`
    if (curr?.image_url) {
      try {
        await del(curr.image_url)
      } catch {
        // ignore
      }
    }
  } else if (imageFile instanceof File) {
    const filename = `dishes/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
    const { url } = await put(filename, imageFile, { access: "public" })
    imageUrl = url
  }

  await sql`
    UPDATE dishes
    SET
      name = COALESCE(${data.name}, name),
      description = COALESCE(${data.description}, description),
      price = COALESCE(${data.price}, price),
      menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
      image_url = COALESCE(${imageUrl}, image_url),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${dishId}
  `

  if (typeof data.orderIndex === "number") {
    await sql`UPDATE menu_items SET order_index = ${data.orderIndex} WHERE id = ${id}`
  }

  revalidatePath(`/dashboard/menu-studio/digital-menu`)
  return { success: true }
}

export async function deleteMenuItem(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const check = await sql`
    SELECT mi.id
    FROM menu_items mi
    JOIN digital_menus dm ON dm.id = mi.digital_menu_id
    WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
  `
  if (check.length === 0) throw new Error("Menu item not found or does not belong to this restaurant.")

  await sql`DELETE FROM menu_items WHERE id = ${id}`

  revalidatePath(`/dashboard/menu-studio/digital-menu`)
  return { success: true }
}

export async function updateMenuItemOrder(updates: { id: number; order_index: number }[]) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  await sql.begin(async (tx) => {
    for (const u of updates) {
      await tx`UPDATE menu_items SET order_index = ${u.order_index} WHERE id = ${u.id}`
    }
  })

  revalidatePath(`/dashboard/menu-studio/digital-menu`)
  return { success: true }
}

// -----------------------------
// Digital Menus + Templates
// -----------------------------

export async function getDigitalMenus(): Promise<DigitalMenu[]> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return []
  const rows = await sql<DigitalMenu[]>`
    SELECT id, name, status, template_id, qr_code_url
    FROM digital_menus
    WHERE restaurant_id = ${restaurantId}
    ORDER BY created_at DESC
  `
  return rows
}

export async function getDigitalMenuWithTemplate(menuId: number): Promise<DigitalMenuWithTemplate | null> {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) return null

  const [menu] = await sql<DigitalMenuWithTemplate[]>`
    SELECT 
      dm.id, 
      dm.name, 
      dm.status, 
      dm.template_id, 
      dm.qr_code_url, 
      dm.created_at, 
      dm.updated_at,
      mt.name AS template_name,
      mt.description AS template_description,
      mt.preview_image_url AS template_preview_image_url
    FROM digital_menus dm
    LEFT JOIN menu_templates mt ON dm.template_id = mt.id
    WHERE dm.id = ${menuId} AND dm.restaurant_id = ${restaurantId}
  `
  return menu || null
}

export async function createDigitalMenu(data: { name: string; status: string }) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to create digital menu.")

  const [row] = await sql<DigitalMenu[]>`
    INSERT INTO digital_menus (name, status, restaurant_id)
    VALUES (${data.name}, ${data.status}, ${restaurantId})
    RETURNING id, name, status, template_id, qr_code_url, created_at, updated_at
  `
  revalidatePath("/dashboard/menu-studio/digital-menu")
  return row
}

export async function updateDigitalMenu(id: number, data: { name?: string; status?: string; template_id?: number }) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to update digital menu.")

  const [row] = await sql<DigitalMenu[]>`
    UPDATE digital_menus
    SET
      name = COALESCE(${data.name}, name),
      status = COALESCE(${data.status}, status),
      template_id = COALESCE(${data.template_id}, template_id),
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id} AND restaurant_id = ${restaurantId}
    RETURNING id, name, status, template_id, qr_code_url, created_at, updated_at
  `
  revalidatePath("/dashboard/menu-studio/digital-menu")
  return row
}

export async function deleteDigitalMenu(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to delete digital menu.")

  const menuCheck = await sql<{ qr_code_url: string | null }[]>`
    SELECT qr_code_url FROM digital_menus WHERE id = ${id} AND restaurant_id = ${restaurantId}
  `
  if (menuCheck.length === 0) throw new Error("Digital menu not found or does not belong to this restaurant.")

  if (menuCheck[0].qr_code_url) {
    try {
      await del(menuCheck[0].qr_code_url!)
    } catch {
      // ignore
    }
  }

  await sql`DELETE FROM digital_menu_categories WHERE digital_menu_id = ${id}`
  await sql`DELETE FROM menu_items WHERE digital_menu_id = ${id}`
  await sql`DELETE FROM digital_menus WHERE id = ${id} AND restaurant_id = ${restaurantId}`

  revalidatePath("/dashboard/menu-studio/digital-menu")
  return { success: true }
}

export async function uploadQrCodeForDigitalMenu(menuId: number, base64Image: string) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required to upload QR code.")

  const menuCheck = await sql`SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) throw new Error("Digital menu not found or does not belong to this restaurant.")

  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")
  const blob = new Blob([buffer])

  const filename = `qr-codes/menu-${menuId}-${Date.now()}.png`
  const { url } = await put(filename, blob, { access: "public" })

  await sql`UPDATE digital_menus SET qr_code_url = ${url} WHERE id = ${menuId}`

  return { success: true, qrCodeUrl: url }
}

export async function getMenuTemplates() {
  const rows = await sql`
    SELECT id, name, description, preview_image_url
    FROM menu_templates
    ORDER BY name ASC
  `
  return rows
}

export async function applyTemplateToMenu(menuId: number, templateId: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const menuCheck = await sql`SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}`
  if (menuCheck.length === 0) throw new Error("Menu not found or does not belong to this restaurant.")

  await sql`UPDATE digital_menus SET template_id = ${templateId} WHERE id = ${menuId}`

  revalidatePath(`/dashboard/menu-studio/digital-menu`)
  revalidatePath(`/menu/${menuId}`)

  return { success: true }
}

// -----------------------------
// AI: add item into a menu (category + dish + link)
// -----------------------------

export async function addAiItemToMenu(digitalMenuId: number, item: any) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  // find or create category
  const globalCategories = await getAllGlobalCategories()
  const existingCategory = globalCategories.find(
    (cat) => cat.name.toLowerCase() === (item.category || "").toLowerCase(),
  )

  let categoryId: number
  if (existingCategory) {
    categoryId = existingCategory.id
  } else {
    const newCategory = await createCategory({
      name: item.category || "Uncategorized",
      type: "menu_item",
      order_index: globalCategories.length + 1,
    })
    categoryId = newCategory.id
  }

  // create new dish and link to the menu
  await createMenuItem({
    digital_menu_id: digitalMenuId,
    name: item.name,
    description: item.description || "",
    price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0,
    menu_category_id: categoryId,
    isAvailable: true,
  })

  return { success: true }
}
