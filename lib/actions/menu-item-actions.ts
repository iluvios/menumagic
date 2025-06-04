"use server"

import { db } from "@/lib/db"
import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { utapi } from "@/lib/utils/blob-helpers"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { z } from "zod"

// Define Zod schemas for validation
const CreateMenuItemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  price: z.number().min(0, "Price must be non-negative"),
  menu_category_id: z.number().optional().nullable(),
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
    const items = await db.menuItem.findMany({
      where: {
        DigitalMenu: {
          restaurant_id: restaurantId,
        }
      },
      include: { category: true, DigitalMenu: { select: { name: true } } },
      orderBy: { name: "asc" },
    })
    return items
  } catch (error) {
    console.error("Error fetching all menu items:", error)
    throw new Error("Failed to fetch menu items.")
  }
}

export async function getMenuItemById(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const menuItem = await db.menuItem.findFirst({
      where: { id, DigitalMenu: { restaurant_id: restaurantId } },
      include: { category: true },
    })
    return menuItem
  } catch (error) {
    console.error(`Error fetching menu item by ID ${id}:`, error)
    throw new Error("Failed to fetch menu item by ID.")
  }
}

export async function createMenuItem(
  data: z.infer<typeof CreateMenuItemSchema>,
  imageFile?: File | null
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const validatedFields = CreateMenuItemSchema.safeParse(data)
  if (!validatedFields.success) {
    console.error("Validation Errors (createMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(`Invalid menu item data: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`)
  }
  const { name, description, price, menu_category_id, digital_menu_id, isAvailable } = validatedFields.data

  const menuCheck = await db.digitalMenu.findFirst({
    where: { id: digital_menu_id, restaurant_id: restaurantId }
  })
  if (!menuCheck) throw new Error("Digital menu not found or does not belong to this restaurant.")

  let imageUrl: string | undefined = undefined
  if (imageFile && imageFile.size > 0) {
    try {
      const [res] = await utapi.uploadFiles([imageFile], { metadata: { digitalMenuId: digital_menu_id.toString() } })
      if (res.error) throw new Error(res.error.message)
      imageUrl = res.data?.url
    } catch (uploadError: any) {
      console.error("Error uploading image for menu item:", uploadError)
      throw new Error("Failed to upload image: " + uploadError.message)
    }
  }

  try {
    const lastMenuItem = await db.menuItem.findFirst({
      where: { digital_menu_id, categoryId: menu_category_id },
      orderBy: { orderIndex: "desc" },
    })
    const newOrderIndex = lastMenuItem ? lastMenuItem.orderIndex + 1 : 0

    const createdItem = await db.menuItem.create({
      data: {
        name,
        description,
        price,
        categoryId: menu_category_id,
        menuId: digital_menu_id,
        imageUrl,
        orderIndex: newOrderIndex,
        isAvailable: isAvailable ?? true,
      },
    })
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${digital_menu_id}`)
    return createdItem
  } catch (dbError: any) {
    console.error("Database Error (createMenuItem):", dbError)
    if (imageUrl) {
      const fileKey = imageUrl.split("/").pop()
      if (fileKey) await utapi.deleteFiles(fileKey).catch((e: any) => console.error("Failed to delete orphaned image:", e))
    }
    throw new Error("Database Error: Failed to Create Menu Item. " + dbError.message)
  }
}

export async function updateMenuItem(
  id: number,
  data: Partial<Omit<z.infer<typeof CreateMenuItemSchema>, 'digital_menu_id'> & { digital_menu_id?: number }>,
  imageFileOrNull?: File | null
) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const existingItem = await db.menuItem.findFirst({
    where: { id, DigitalMenu: { restaurant_id: restaurantId } },
    select: { imageUrl: true, menuId: true }
  })
  if (!existingItem) throw new Error("Menu item not found or not owned by this restaurant.")

  const validatedFields = UpdateMenuItemSchema.partial().extend({ id: z.number() }).safeParse({ ...data, id })
  if (!validatedFields.success) {
    console.error("Validation Errors (updateMenuItem):", validatedFields.error.flatten().fieldErrors)
    throw new Error(`Invalid menu item data for update: ${JSON.stringify(validatedFields.error.flatten().fieldErrors)}`)
  }
  
  const updateData = validatedFields.data
  let newImageUrl: string | undefined | null = undefined

  if (imageFileOrNull === null) {
    newImageUrl = null
    if (existingItem.imageUrl) {
      const fileKey = existingItem.imageUrl.split("/").pop()
      if (fileKey) await utapi.deleteFiles(fileKey).catch((e: any) => console.error("Failed to delete old image:", e))
    }
  } else if (imageFileOrNull && imageFileOrNull.size > 0) {
    if (existingItem.imageUrl) {
      const fileKey = existingItem.imageUrl.split("/").pop()
      if (fileKey) await utapi.deleteFiles(fileKey).catch((e: any) => console.error("Failed to delete old image before new upload:", e))
    }
    try {
      const [res] = await utapi.uploadFiles([imageFileOrNull], { metadata: { digitalMenuId: (updateData.digital_menu_id ?? existingItem.menuId).toString() } })
      if (res.error) throw new Error(res.error.message)
      newImageUrl = res.data?.url
    } catch (uploadError: any) {
      console.error("Error uploading new image for menu item:", uploadError)
      throw new Error("Failed to upload new image: " + uploadError.message)
    }
  }

  const { id: validatedId, ...dataToUpdate } = updateData
  const prismaUpdateData: any = { ...dataToUpdate }
  if (dataToUpdate.menu_category_id !== undefined) prismaUpdateData.categoryId = dataToUpdate.menu_category_id
  if (dataToUpdate.digital_menu_id !== undefined) prismaUpdateData.menuId = dataToUpdate.digital_menu_id
  if (newImageUrl !== undefined) prismaUpdateData.imageUrl = newImageUrl
  
  delete prismaUpdateData.menu_category_id
  delete prismaUpdateData.digital_menu_id

  try {
    const updatedItem = await db.menuItem.update({
      where: { id },
      data: prismaUpdateData,
    })
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    revalidatePath(`/dashboard/menus/dishes/${updatedItem.menuId}`)
    return updatedItem
  } catch (dbError: any) {
    console.error("Database Error (updateMenuItem):", dbError)
    throw new Error("Database Error: Failed to Update Menu Item. " + dbError.message)
  }
}

export async function deleteMenuItem(id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")

  const itemToDelete = await db.menuItem.findFirst({
    where: { id, DigitalMenu: { restaurant_id: restaurantId } },
    select: { imageUrl: true, menuId: true },
  })

  if (!itemToDelete) {
    throw new Error("Menu item not found or does not belong to this restaurant.")
  }

  try {
    await db.menuItem.delete({ where: { id } })
    if (itemToDelete.imageUrl) {
      const fileKey = itemToDelete.imageUrl.split("/").pop()
      if (fileKey) {
        await utapi.deleteFiles(fileKey).catch((e: any) => console.error("Failed to delete image on item delete:", e))
      }
    }
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    if (itemToDelete.menuId) revalidatePath(`/dashboard/menus/dishes/${itemToDelete.menuId}`)
    return { success: true, message: "Menu item deleted successfully." }
  } catch (dbError: any) {
    console.error("Database Error (deleteMenuItem):", dbError)
    throw new Error("Database Error: Failed to Delete Menu Item. " + dbError.message)
  }
}

export async function updateMenuItemImage(formData: FormData) {
  const id = Number.parseInt(formData.get("id") as string)
  const file = formData.get("image") as File
  const oldImageUrl = formData.get("oldImageUrl") as string
  const menuId = Number.parseInt(formData.get("menuId") as string)

  if (!id || !file) {
    return { error: "Missing ID or image file." }
  }

  try {
    let newImageUrl: string | undefined
    if (oldImageUrl) {
      const fileKey = oldImageUrl.split("/").pop()
      if (fileKey) {
        await utapi.deleteFiles(fileKey).catch((e: any) => console.warn("Failed to delete old image (updateMenuItemImage):", e))
      }
    }

    const [res] = await utapi.uploadFiles([file])
    if (!res || res.error) {
      throw new Error(res?.error?.message || "Failed to upload image.")
    }
    newImageUrl = res.data.url

    await db.menuItem.update({
      where: { id },
      data: { imageUrl: newImageUrl },
    })

    if (menuId) revalidatePath(`/dashboard/menus/dishes/${menuId}`)
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true, message: "Menu item image updated successfully.", imageUrl: newImageUrl }
  } catch (error: any) {
    console.error("Error updating menu item image:", error)
    return { error: "Failed to update menu item image: " + error.message }
  }
}

export async function getMenuItemsByMenuId(digital_menu_id: number) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  try {
    const menuItems = await db.menuItem.findMany({
      where: { menuId: digital_menu_id, DigitalMenu: { restaurant_id: restaurantId } },
      orderBy: { orderIndex: "asc" },
      include: { category: true },
    })
    return menuItems
  } catch (error: any) {
    console.error("Error fetching menu items by menu ID:", error)
    return []
  }
}

export async function updateMenuItemOrder(menuId: number, categoryId: number | null, orderedIds: number[]) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  const menu = await db.digitalMenu.findUnique({ where: { id: menuId } })
  if (!menu || menu.restaurant_id !== restaurantId) {
    throw new Error("Menu not found or does not belong to this restaurant.")
  }

  try {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.menuItem.update({
          where: { id },
          data: { orderIndex: index, categoryId: categoryId === 0 ? null : categoryId },
        }),
      ),
    )
    revalidatePath(`/dashboard/menus/dishes/${menuId}`)
    revalidatePath(`/dashboard/menu-studio/digital-menu`)
    return { success: true, message: "Menu item order updated successfully." }
  } catch (error: any) {
    console.error("Error updating menu item order:", error)
    return { success: false, error: "Failed to update menu item order." }
  }
}

export async function getMenuItemDetails(id: number) {
  console.warn("getMenuItemDetails is a stub and not fully implemented.")
  return getMenuItemById(id)
}

export async function getMenuItemIngredients(menuItemId: number) {
  console.warn("getMenuItemIngredients is a stub and not fully implemented.")
  return []
}

export async function updateMenuItemIngredients(menuItemId: number, ingredientsData: any) {
  console.warn("updateMenuItemIngredients is a stub and not fully implemented.")
  revalidatePath(`/dashboard/menus/dishes/${menuItemId}`)
  return { success: true, message: "(Stub) Ingredients updated." }
}

export async function getMenuItemCategories() {
  console.warn("getMenuItemCategories is a stub and not fully implemented. Consider using getCategoriesByType from category-actions.")
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) throw new Error("Authentication required.")
  return db.category.findMany({ where: { type: "menu_item", OR: [{ restaurant_id: restaurantId }, { restaurant_id: null }] } })
}

export async function getMenuItemReusableItems(menuItemId: number) {
  console.warn("getMenuItemReusableItems is a stub and not fully implemented.")
  return []
}

export async function updateMenuItemReusableItems(menuItemId: number, reusableItemsData: any) {
  console.warn("updateMenuItemReusableItems is a stub and not fully implemented.")
  revalidatePath(`/dashboard/menus/dishes/${menuItemId}`)
  return { success: true, message: "(Stub) Reusable items updated." }
}

