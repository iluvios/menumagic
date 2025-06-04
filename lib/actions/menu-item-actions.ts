"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { utapi } from "@/lib/utils/blob-helpers"
import { z } from "zod"

// Define Zod schemas for validation
const MenuItemSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  price: z.number().min(0, "Price must be non-negative"),
  categoryId: z.number().optional(),
  menuId: z.number(),
  imageUrl: z.string().optional(),
  orderIndex: z.number().optional(),
  isAvailable: z.boolean().optional(),
})

const DeleteMenuItemSchema = z.object({
  id: z.number(),
  imageUrl: z.string().optional(),
})

export async function createMenuItem(formData: FormData) {
  const data = {
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number.parseFloat(formData.get("price") as string),
    categoryId: formData.get("categoryId") ? Number.parseInt(formData.get("categoryId") as string) : undefined,
    menuId: Number.parseInt(formData.get("menuId") as string),
    isAvailable: formData.get("isAvailable") === "on",
  }

  const validatedFields = MenuItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Create Menu Item.",
    }
  }

  const { name, description, price, categoryId, menuId, isAvailable } = validatedFields.data

  try {
    const lastMenuItem = await db.menuItem.findFirst({
      where: { menuId, categoryId },
      orderBy: { orderIndex: "desc" },
    })
    const newOrderIndex = lastMenuItem ? lastMenuItem.orderIndex + 1 : 0

    await db.menuItem.create({
      data: {
        name,
        description,
        price,
        categoryId,
        menuId,
        orderIndex: newOrderIndex,
        isAvailable,
      },
    })
  } catch (error) {
    return {
      message: "Database Error: Failed to Create Menu Item.",
    }
  }

  revalidatePath(`/dashboard/menus/dishes/${menuId}`)
  return { message: "Menu item created successfully." }
}

export async function updateMenuItem(formData: FormData) {
  const data = {
    id: Number.parseInt(formData.get("id") as string),
    name: formData.get("name"),
    description: formData.get("description"),
    price: Number.parseFloat(formData.get("price") as string),
    categoryId: formData.get("categoryId") ? Number.parseInt(formData.get("categoryId") as string) : undefined,
    menuId: Number.parseInt(formData.get("menuId") as string),
    isAvailable: formData.get("isAvailable") === "on",
  }

  const validatedFields = MenuItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Update Menu Item.",
    }
  }

  const { id, name, description, price, categoryId, menuId, isAvailable } = validatedFields.data

  try {
    await db.menuItem.update({
      where: { id },
      data: {
        name,
        description,
        price,
        categoryId,
        menuId,
        isAvailable,
      },
    })
  } catch (error) {
    return {
      message: "Database Error: Failed to Update Menu Item.",
    }
  }

  revalidatePath(`/dashboard/menus/dishes/${menuId}`)
  return { message: "Menu item updated successfully." }
}

export async function deleteMenuItem(formData: FormData) {
  const data = {
    id: Number.parseInt(formData.get("id") as string),
    imageUrl: formData.get("imageUrl") as string,
  }

  const validatedFields = DeleteMenuItemSchema.safeParse(data)

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Missing Fields. Failed to Delete Menu Item.",
    }
  }

  const { id, imageUrl } = validatedFields.data

  try {
    await db.menuItem.delete({
      where: { id },
    })

    if (imageUrl) {
      const fileKey = imageUrl.split("/").pop()
      if (fileKey) {
        await utapi.deleteFiles(fileKey)
      }
    }
  } catch (error) {
    return {
      message: "Database Error: Failed to Delete Menu Item.",
    }
  }

  revalidatePath(`/dashboard/menus/dishes`)
  return { message: "Menu item deleted successfully." }
}

export async function updateMenuItemImage(formData: FormData) {
  const id = Number.parseInt(formData.get("id") as string)
  const file = formData.get("image") as File
  const oldImageUrl = formData.get("oldImageUrl") as string

  if (!id || !file) {
    return { message: "Missing ID or image file." }
  }

  try {
    if (oldImageUrl) {
      const fileKey = oldImageUrl.split("/").pop()
      if (fileKey) {
        await utapi.deleteFiles(fileKey)
      }
    }

    const [res] = await utapi.uploadFiles([file])
    if (!res || res.error) {
      throw new Error(res?.error?.message || "Failed to upload image.")
    }

    await db.menuItem.update({
      where: { id },
      data: { imageUrl: res.data.url },
    })
  } catch (error) {
    console.error("Error updating menu item image:", error)
    return { message: "Failed to update menu item image." }
  }

  revalidatePath(`/dashboard/menus/dishes`)
  return { message: "Menu item image updated successfully." }
}

export async function getMenuItemsByMenuId(menuId: number) {
  try {
    const menuItems = await db.menuItem.findMany({
      where: { menuId },
      orderBy: { orderIndex: "asc" },
      include: {
        category: true,
      },
    })
    return menuItems
  } catch (error) {
    console.error("Error fetching menu items by menu ID:", error)
    return []
  }
}

export async function updateMenuItemOrder(menuId: number, categoryId: number | null, orderedIds: number[]) {
  try {
    await db.$transaction(
      orderedIds.map((id, index) =>
        db.menuItem.update({
          where: { id },
          data: { orderIndex: index, categoryId: categoryId },
        }),
      ),
    )
    revalidatePath(`/dashboard/menus/dishes/${menuId}`)
    return { success: true, message: "Menu item order updated successfully." }
  } catch (error) {
    console.error("Error updating menu item order:", error)
    return { success: false, message: "Failed to update menu item order." }
  }
}
