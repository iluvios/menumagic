"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"

interface Dish {
 id: number
 name: string
 description: string
 price: number
 menu_category_id: number
 category_name?: string
 image_url?: string | null
 is_available: boolean
 cost_per_serving?: number
}

interface Category {
 id: number
 name: string
 type: string
 order_index: number
 restaurant_id?: number
}

interface DigitalMenuCategory {
 id: number
 digital_menu_id: number
 category_id: number
 category_name: string
 order_index: number
}

interface DigitalMenuCategoryUpdate {
 id: number
 order_index: number
}

interface DigitalMenuWithTemplate {
 id: number
 name: string
 status: string
 template_id: number | null
 qr_code_url: string | null
 created_at: Date
 updated_at: Date
 template_name: string | null
 template_description: string | null
 template_preview_image_url: string | null
}

// Category Actions
export async function getAllGlobalCategories(): Promise<Category[]> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     return []
   }
   const categories = await sql<Category[]>`
     SELECT id, name, type, order_index, restaurant_id
     FROM categories
     WHERE restaurant_id = ${restaurantId}
     ORDER BY name ASC
   `
   return categories
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to fetch all global categories.")
 }
}

export async function getCategoriesByType(type: string): Promise<Category[]> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     return []
   }
   const categories = await sql<Category[]>`
     SELECT id, name, type, order_index, restaurant_id
     FROM categories
     WHERE type = ${type} AND restaurant_id = ${restaurantId}
     ORDER BY name ASC
   `
   return categories
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to fetch categories by type.")
 }
}

export async function getMenuCategoriesForDigitalMenu(digitalMenuId: number): Promise<DigitalMenuCategory[]> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     return []
   }
   const menuCheck =
     await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
   if (menuCheck.length === 0) {
     throw new Error("Digital menu not found or does not belong to this restaurant.")
   }

   const menuCategories = await sql<DigitalMenuCategory[]>`
     SELECT
       dmc.id,
       dmc.digital_menu_id,
       dmc.category_id,
       c.name AS category_name,
       dmc.order_index
     FROM digital_menu_categories dmc
     JOIN categories c ON dmc.category_id = c.id
     WHERE dmc.digital_menu_id = ${digitalMenuId}
     ORDER BY dmc.order_index ASC
   `
   return menuCategories
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to fetch menu-specific categories.")
 }
}

export async function createCategory(data: { name: string; type: string; order_index: number }): Promise<Category> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to create category.")
   }

   const result = await sql<Category[]>`
     INSERT INTO categories (name, type, order_index, restaurant_id)
     VALUES (${data.name}, ${data.type}, ${data.order_index}, ${restaurantId})
     RETURNING id, name, type, order_index, restaurant_id
   `
   revalidatePath("/dashboard/settings/categories")
   return result[0]
 } catch (error) {
   console.error("Error creating category:", error)
   throw new Error("Failed to create category.")
 }
}

export async function addCategoryToDigitalMenu(
 digitalMenuId: number,
 categoryId: number,
): Promise<DigitalMenuCategory | null> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     throw new Error("Authentication required to link category to menu.")
   }

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
     SELECT id, digital_menu_id, category_id, order_index FROM digital_menu_categories
     WHERE digital_menu_id = ${digitalMenuId} AND category_id = ${categoryId}
   `
   if (existingLink.length > 0) {
     console.log(`Category ${categoryId} is already linked to menu ${digitalMenuId}. Returning existing link.`)
     return existingLink[0]
   }

   const maxOrderResult = await sql<{ max_order: number }[]>`
     SELECT COALESCE(MAX(order_index), 0) as max_order
     FROM digital_menu_categories
     WHERE digital_menu_id = ${digitalMenuId}
   `
   const nextMenuOrderIndex = maxOrderResult[0].max_order + 1

   const [newLink] = await sql<DigitalMenuCategory[]>`
     INSERT INTO digital_menu_categories (digital_menu_id, category_id, order_index)
     VALUES (${digitalMenuId}, ${categoryId}, ${nextMenuOrderIndex})
     RETURNING id, digital_menu_id, category_id, order_index
   `
   const [categoryNameResult] = await sql<{ name: string }[]>`
     SELECT name FROM categories WHERE id = ${newLink.category_id}
   `
   return { ...newLink, category_name: categoryNameResult.name }
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to add category to digital menu.")
 }
}

export async function removeCategoryFromDigitalMenu(
 digitalMenuId: number,
 digitalMenuCategoryId: number,
): Promise<void> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     throw new Error("Authentication required to remove category from menu.")
   }

   const menuCheck =
     await sql`SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}`
   if (menuCheck.length === 0) {
     throw new Error("Digital menu not found or does not belong to this restaurant.")
   }

   await sql`
     DELETE FROM digital_menu_categories
     WHERE id = ${digitalMenuCategoryId} AND digital_menu_id = ${digitalMenuId}
   `

   const remainingCategories = await sql<DigitalMenuCategory[]>`
     SELECT id, order_index FROM digital_menu_categories
     WHERE digital_menu_id = ${digitalMenuId}
     ORDER BY order_index ASC
   `
   for (let i = 0; i < remainingCategories.length; i++) {
     if (remainingCategories[i].order_index !== i + 1) {
       await sql`
         UPDATE digital_menu_categories
         SET order_index = ${i + 1}
         WHERE id = ${remainingCategories[i].id}
       `
     }
   }
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to remove category from digital menu.")
 }
}

export async function updateCategory(
 id: number,
 data: { name?: string; type?: string; order_index?: number },
): Promise<Category> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     throw new Error("Authentication required to update category.")
   }

   const [updatedCategory] = await sql<Category[]>`
     UPDATE categories
     SET
       name = COALESCE(${data.name}, name),
       type = COALESCE(${data.type}, type),
       order_index = COALESCE(${data.order_index}, order_index),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ${id} AND restaurant_id = ${restaurantId}
     RETURNING id, name, type, order_index, restaurant_id
   `
   if (!updatedCategory) {
     throw new Error("Category not found or does not belong to this restaurant.")
   }
   revalidatePath("/dashboard/settings/categories")
   return updatedCategory
 } catch (error) {
   console.error("Error updating category:", error)
   throw new Error("Failed to update category.")
 }
}

export async function updateDigitalMenuCategoryOrder(updates: DigitalMenuCategoryUpdate[]): Promise<void> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to update category order.")
   }

   for (const update of updates) {
     const checkOwnership = await sql`
       SELECT dmc.id
       FROM digital_menu_categories dmc
       JOIN digital_menus dm ON dmc.digital_menu_id = dm.id
       WHERE dmc.id = ${update.id} AND dm.restaurant_id = ${restaurantId}
     `
     if (checkOwnership.length === 0) {
       throw new Error(`Digital menu category with ID ${update.id} not found or does not belong to this restaurant.`)
     }

     await sql`
       UPDATE digital_menu_categories
       SET order_index = ${update.order_index}
       WHERE id = ${update.id}
     `
   }
 } catch (error) {
   console.error("Database Error:", error)
   throw new Error("Failed to update digital menu category order.")
 }
}

export async function deleteCategory(id: number): Promise<{ success: boolean }> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to delete category.")
   }

   await sql`
     DELETE FROM categories
     WHERE id = ${id} AND restaurant_id = ${restaurantId}
   `
   revalidatePath("/dashboard/settings/categories")
   return { success: true }
 } catch (error) {
   console.error("Error deleting category:", error)
   throw new Error("Failed to delete category.")
 }
}

// GLOBAL DISHES - Single source of truth
export async function getAllDishes(): Promise<Dish[]> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     return []
   }
   const result = await sql`
     SELECT 
       d.id, 
       d.name, 
       d.description, 
       d.price, 
       d.menu_category_id, 
       c.name as category_name,
       d.image_url, 
       true as is_available,
       0 as cost_per_serving
     FROM dishes d
     LEFT JOIN categories c ON d.menu_category_id = c.id
     WHERE d.restaurant_id = ${restaurantId}
     ORDER BY d.created_at DESC
   `
   return result || []
 } catch (error) {
   console.error("Error fetching dishes:", error)
   throw new Error("Failed to fetch dishes.")
 }
}

// Menu Items - References to dishes
export async function getMenuItemsByMenuId(digitalMenuId: number) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   const menuItems = await sql`
     SELECT 
       mi.id, 
       mi.digital_menu_id,
       mi.dish_id,
       mi.order_index,
       d.name,
       d.description,
       d.price,
       d.image_url,
       d.menu_category_id,
       c.name as category_name,
       true as is_available
     FROM menu_items mi
     JOIN dishes d ON mi.dish_id = d.id
     LEFT JOIN categories c ON d.menu_category_id = c.id
     JOIN digital_menus dm ON mi.digital_menu_id = dm.id
     WHERE mi.digital_menu_id = ${digitalMenuId} 
       AND dm.restaurant_id = ${restaurantId}
     ORDER BY mi.order_index ASC, mi.id ASC
   `

   return menuItems
 } catch (error) {
   console.error("Error fetching menu items by menu ID:", error)
   return []
 }
}

export async function addDishToMenu(digitalMenuId: number, dishId: number) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   const menuCheck = await sql`
     SELECT id FROM digital_menus WHERE id = ${digitalMenuId} AND restaurant_id = ${restaurantId}
   `
   if (menuCheck.length === 0) {
     throw new Error("Digital menu not found or does not belong to this restaurant.")
   }

   const dishCheck = await sql`
     SELECT id FROM dishes WHERE id = ${dishId} AND restaurant_id = ${restaurantId}
   `
   if (dishCheck.length === 0) {
     throw new Error("Dish not found or does not belong to this restaurant.")
   }

   // Check if dish is already on this menu
   const existingItem = await sql`
     SELECT id FROM menu_items WHERE digital_menu_id = ${digitalMenuId} AND dish_id = ${dishId}
   `
   if (existingItem.length > 0) {
     throw new Error("This dish is already on the menu.")
   }

   // Get the max order_index for this menu
   const maxOrderResult = await sql`
     SELECT COALESCE(MAX(order_index), -1) as max_order
     FROM menu_items
     WHERE digital_menu_id = ${digitalMenuId}
   `
   const nextOrderIndex = maxOrderResult[0].max_order + 1

   const result = await sql`
     INSERT INTO menu_items (digital_menu_id, dish_id, order_index)
     VALUES (${digitalMenuId}, ${dishId}, ${nextOrderIndex})
     RETURNING id
   `

   revalidatePath(`/dashboard/menu-studio/digital-menu`)
   return result[0]
 } catch (error) {
   console.error("Error adding dish to menu:", error)
   throw new Error(error.message || "Failed to add dish to menu.")
 }
}

export async function createMenuItem(data: {
 digital_menu_id: number
 dish_id?: number
 name?: string
 description?: string
 price?: number
 menu_category_id?: number
 isAvailable?: boolean
}) {
 try {
   if (data.dish_id) {
     // Adding existing dish to menu
     return await addDishToMenu(data.digital_menu_id, data.dish_id)
   } else {
     // Creating new dish and adding to menu
     if (!data.name || !data.price || !data.menu_category_id) {
       throw new Error("Name, price, and category are required to create a new dish.")
     }

     const restaurantId = await getRestaurantIdFromSession()
     if (!restaurantId) {
       throw new Error("Authentication required.")
     }

     // Create the dish first
     const [newDish] = await sql`
       INSERT INTO dishes (
         name, 
         description, 
         price, 
         menu_category_id, 
         restaurant_id
       )
       VALUES (
         ${data.name}, 
         ${data.description || ""}, 
         ${data.price}, 
         ${data.menu_category_id}, 
         ${restaurantId}
       )
       RETURNING id
     `

     // Then add it to the menu
     return await addDishToMenu(data.digital_menu_id, newDish.id)
   }
 } catch (error) {
   console.error("Error creating menu item:", error)
   throw new Error(error.message || "Failed to create menu item.")
 }
}

export async function updateMenuItem(
 id: number,
 data: {
   name?: string
   description?: string
   price?: number
   menu_category_id?: number
   isAvailable?: boolean
   orderIndex?: number
 },
 imageFile?: File | null,
) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   const menuItemCheck = await sql`
     SELECT mi.id, mi.digital_menu_id, mi.dish_id
     FROM menu_items mi
     JOIN digital_menus dm ON mi.digital_menu_id = dm.id
     WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
   `
   if (menuItemCheck.length === 0) {
     throw new Error("Menu item not found or does not belong to this restaurant.")
   }

   const menuItem = menuItemCheck[0]
   const dishId = menuItem.dish_id

   // Update the dish
   if (
     data.name ||
     data.description ||
     data.price ||
     data.menu_category_id ||
     data.isAvailable ||
     imageFile !== undefined
   ) {
     let imageUrl: string | null | undefined = undefined

     if (imageFile !== undefined) {
       if (imageFile === null) {
         imageUrl = null
       } else if (imageFile instanceof File) {
         try {
           const filename = `dishes/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
           const { url } = await put(filename, imageFile, { access: "public" })
           imageUrl = url
         } catch (uploadError) {
           console.error("Error uploading image:", uploadError)
           throw new Error("Failed to upload image.")
         }
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
       WHERE id = ${dishId}
     `
   }

   // Update order index if provided
   if (data.orderIndex !== undefined) {
     await sql`
       UPDATE menu_items
       SET order_index = ${data.orderIndex}
       WHERE id = ${id}
     `
   }

   revalidatePath(`/dashboard/menu-studio/digital-menu`)
   return { success: true }
 } catch (error) {
   console.error("Error updating menu item:", error)
   throw new Error(error.message || "Failed to update menu item.")
 }
}

export async function deleteMenuItem(id: number) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   const menuItemCheck = await sql`
     SELECT mi.id, mi.digital_menu_id
     FROM menu_items mi
     JOIN digital_menus dm ON mi.digital_menu_id = dm.id
     WHERE mi.id = ${id} AND dm.restaurant_id = ${restaurantId}
   `
   if (menuItemCheck.length === 0) {
     throw new Error("Menu item not found or does not belong to this restaurant.")
   }

   // Only remove from menu, don't delete the dish
   await sql`
     DELETE FROM menu_items
     WHERE id = ${id}
   `

   revalidatePath(`/dashboard/menu-studio/digital-menu`)
   return { success: true }
 } catch (error) {
   console.error("Error deleting menu item:", error)
   throw new Error("Failed to delete menu item.")
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
   const menus = await sql`
     SELECT id, name, status, template_id, qr_code_url, created_at, updated_at
     FROM digital_menus
     WHERE restaurant_id = ${restaurantId}
     ORDER BY created_at DESC
   `
   return menus
 } catch (error) {
   console.error("Error fetching digital menus:", error)
   throw new Error("Failed to fetch digital menus.")
 }
}

export async function getDigitalMenuWithTemplate(menuId: number): Promise<DigitalMenuWithTemplate | null> {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     console.error("No restaurant ID found for session.")
     return null
   }

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
 } catch (error) {
   console.error("Error fetching digital menu with template:", error)
   throw new Error("Failed to fetch digital menu with template.")
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
     RETURNING id, name, status, template_id, qr_code_url, created_at, updated_at
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
     RETURNING id, name, status, template_id, qr_code_url, created_at, updated_at
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

   const menuCheck = await sql`
     SELECT qr_code_url FROM digital_menus WHERE id = ${id} AND restaurant_id = ${restaurantId}
   `
   if (menuCheck.length === 0) {
     throw new Error("Digital menu not found or does not belong to this restaurant.")
   }

   if (menuCheck[0].qr_code_url) {
     try {
       await del(menuCheck[0].qr_code_url)
     } catch (e) {
       console.error("Failed to delete QR code image:", e)
     }
   }

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

   const menuCheck = await sql`
     SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}
   `
   if (menuCheck.length === 0) {
     throw new Error("Digital menu not found or does not belong to this restaurant.")
   }

   const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
   const buffer = Buffer.from(base64Data, "base64")
   const blob = new Blob([buffer])

   const filename = `qr-codes/menu-${menuId}-${Date.now()}.png`
   const { url } = await put(filename, blob, { access: "public" })

   await sql`
     UPDATE digital_menus
     SET qr_code_url = ${url}
     WHERE id = ${menuId}
   `

   return { success: true, qrCodeUrl: url }
 } catch (error) {
   console.error("Error uploading QR code:", error)
   throw new Error("Failed to upload QR code.")
 }
}

// Menu Templates
export async function getMenuTemplates() {
 try {
   const templates = await sql`
     SELECT id, name, description, preview_image_url
     FROM menu_templates
     ORDER BY name ASC
   `
   return templates
 } catch (error) {
   console.error("Error fetching menu templates:", error)
   throw new Error("Failed to fetch menu templates.")
 }
}

export async function applyTemplateToMenu(menuId: number, templateId: number) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   const menuCheck = await sql`
     SELECT id FROM digital_menus WHERE id = ${menuId} AND restaurant_id = ${restaurantId}
   `
   if (menuCheck.length === 0) {
     throw new Error("Menu not found or does not belong to this restaurant.")
   }

   await sql`
     UPDATE digital_menus
     SET template_id = ${templateId}
     WHERE id = ${menuId}
   `

   revalidatePath(`/dashboard/menu-studio/digital-menu`)
   revalidatePath(`/menu/${menuId}`)

   return { success: true }
 } catch (error: any) {
   console.error("Error applying template to menu:", error)
   throw new Error(`Failed to apply template: ${error.message}`)
 }
}

// AI Item Addition Function
export async function addAiItemToMenu(digitalMenuId: number, item: any) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   // Find or create category
   let categoryId: number | undefined
   const globalCategories = await getAllGlobalCategories()
   const existingCategory = globalCategories.find((cat) => cat.name.toLowerCase() === item.category?.toLowerCase())

   if (existingCategory) {
     categoryId = existingCategory.id
   } else {
     // Create new category if it doesn't exist
     const newCategory = await createCategory({
       name: item.category || "Uncategorized",
       type: "menu_item",
       order_index: globalCategories.length + 1,
     })
     categoryId = newCategory.id
   }

   if (!categoryId) {
     throw new Error("Could not determine category ID for AI item.")
   }

   // Create menu item (which also creates a global dish if it doesn't exist)
   await createMenuItem({
     digital_menu_id: digitalMenuId,
     name: item.name,
     description: item.description || "",
     price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0,
     menu_category_id: categoryId,
     isAvailable: true,
   })

   return { success: true }
 } catch (error: any) {
   console.error("Error adding AI item to menu:", error)
   throw new Error(error.message || "Failed to add AI item to menu.")
 }
}

// Legacy aliases for backward compatibility - now they all point to the dishes table
export const getReusableMenuItems = getAllDishes
export const createReusableMenuItem = createDish
export const updateReusableMenuItem = updateDish
export const deleteReusableMenuItem = deleteDish

// Create dish function
export async function createDish(data: {
 name: string
 description: string
 price: number
 menu_category_id: number
 image_file?: File | null
 is_available?: boolean
}) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to create dish.")
   }

   // Check if a dish with this name already exists for this restaurant
   const existingDish = await sql`
     SELECT id FROM dishes 
     WHERE name = ${data.name} AND restaurant_id = ${restaurantId}
   `

   if (existingDish.length > 0) {
     throw new Error(`A dish named "${data.name}" already exists. Please use a different name.`)
   }

   let imageUrl: string | null = null
   if (data.image_file) {
     try {
       const filename = `dishes/${Date.now()}-${data.image_file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
       const { url } = await put(filename, data.image_file, { access: "public" })
       imageUrl = url
     } catch (uploadError) {
       console.error("Error uploading image:", uploadError)
       throw new Error("Failed to upload image.")
     }
   }

   const result = await sql`
     INSERT INTO dishes (
       name, 
       description, 
       price, 
       menu_category_id, 
       image_url, 
       restaurant_id
     )
     VALUES (
       ${data.name}, 
       ${data.description}, 
       ${data.price}, 
       ${data.menu_category_id}, 
       ${imageUrl}, 
       ${restaurantId}
     )
     RETURNING id, name
   `
   revalidatePath("/dashboard/menu-studio/digital-menu")
   revalidatePath("/dashboard/menu-studio/recipes")
   revalidatePath("/dashboard/operations-hub/recipes")
   return result[0]
 } catch (error) {
   console.error("Error creating dish:", error)
   throw new Error(error.message || "Failed to create dish.")
 }
}

// Update dish function
export async function updateDish(
 id: number,
 data: {
   name?: string
   description?: string
   price?: number
   menu_category_id?: number
   image_file?: File | null
   image_url?: string | null
   is_available?: boolean
 },
) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to update dish.")
   }

   const dishCheck = await sql`
     SELECT id FROM dishes WHERE id = ${id} AND restaurant_id = ${restaurantId}
   `
   if (dishCheck.length === 0) {
     throw new Error("Dish not found or does not belong to this restaurant.")
   }

   let imageUrl: string | null | undefined = data.image_url
   if (data.image_file !== undefined) {
     if (data.image_file === null) {
       imageUrl = null
     } else if (data.image_file instanceof File) {
       try {
         const filename = `dishes/${Date.now()}-${data.image_file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
         const { url } = await put(filename, data.image_file, { access: "public" })
         imageUrl = url
       } catch (uploadError) {
         console.error("Error uploading image:", uploadError)
         throw new Error("Failed to upload image.")
       }
     }
   }

   const result = await sql`
     UPDATE dishes
     SET
       name = COALESCE(${data.name}, name),
       description = COALESCE(${data.description}, description),
       price = COALESCE(${data.price}, price),
       menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
       image_url = COALESCE(${imageUrl}, image_url),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ${id}
     RETURNING id, name
   `
   revalidatePath("/dashboard/menu-studio/digital-menu")
   revalidatePath("/dashboard/menu-studio/recipes")
   revalidatePath("/dashboard/operations-hub/recipes")
   return result[0]
 } catch (error) {
   console.error("Error updating dish:", error)
   throw new Error("Failed to update dish.")
 }
}

// Delete dish function
export async function deleteDish(id: number) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required to delete dish.")
   }

   const dishCheck = await sql`
     SELECT id, image_url FROM dishes WHERE id = ${id} AND restaurant_id = ${restaurantId}
   `
   if (dishCheck.length === 0) {
     throw new Error("Dish not found or does not belong to this restaurant.")
   }

   if (dishCheck[0].image_url) {
     try {
       await del(dishCheck[0].image_url)
     } catch (e) {
       console.error("Failed to delete image:", e)
     }
   }

   // First delete any menu items that reference this dish
   await sql`DELETE FROM menu_items WHERE dish_id = ${id}`

   // Then delete any ingredients associated with this dish
   await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${id}`

   // Finally delete the dish itself
   await sql`DELETE FROM dishes WHERE id = ${id}`

   revalidatePath("/dashboard/menu-studio/digital-menu")
   revalidatePath("/dashboard/menu-studio/recipes")
   revalidatePath("/dashboard/operations-hub/recipes")
   return { success: true }
 } catch (error) {
   console.error("Error deleting dish:", error)
   throw new Error("Failed to delete dish.")
 }
}

export async function updateMenuItemOrder(updates: { id: number; order_index: number }[]) {
 try {
   const restaurantId = await getRestaurantIdFromSession()
   if (!restaurantId) {
     throw new Error("Authentication required.")
   }

   for (const update of updates) {
     await sql`
       UPDATE menu_items
       SET order_index = ${update.order_index}
       WHERE id = ${update.id}
     `
   }

   revalidatePath(`/dashboard/menu-studio/digital-menu`)
   return { success: true }
 } catch (error) {
   console.error("Error updating menu item order:", error)
   throw new Error("Failed to update menu item order.")
 }
}
