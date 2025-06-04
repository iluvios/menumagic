"use server"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { uploadBase64ImageToBlob } from "@/lib/utils/blob-helpers"
import { sql } from "@/lib/db"

interface MenuItemData {
  name: string
  description: string
  price: number
  category: string
}

interface ParsedMenuData {
  menuName: string
  menuItems: MenuItemData[]
}

interface CategoryData {
  name: string
  items: MenuItemData[]
}

interface MockResponse {
  menuName: string
  status: string
  categories: CategoryData[]
}

export async function mockAiMenuUpload(base64Image: string, menuName: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required for AI menu upload.")
    }

    // Simulate AI processing time
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Mock AI response for menu items and categories
    const mockResponse: MockResponse = {
      menuName: menuName,
      status: "draft",
      categories: [
        {
          name: "Appetizers",
          items: [
            { name: "Spring Rolls", description: "Crispy rolls with vegetables", price: 7.99 },
            { name: "Garlic Bread", description: "Toasted bread with garlic butter", price: 5.5 },
          ],
        },
        {
          name: "Main Courses",
          items: [
            { name: "Chicken Curry", description: "Spicy chicken curry with rice", price: 14.99 },
            { name: "Vegetable Lasagna", description: "Layers of pasta, vegetables, and cheese", price: 12.5 },
          ],
        },
      ],
    }

    // Create a new digital menu
    const newMenuResult = await sql`
      INSERT INTO digital_menus (name, status, restaurant_id)
      VALUES (${mockResponse.menuName}, ${mockResponse.status}, ${restaurantId})
      RETURNING id
    `
    const digitalMenuId = newMenuResult[0].id

    // Insert categories and menu items
    for (const categoryData of mockResponse.categories) {
      // Find or create global category
      let globalCategory = await sql`
        SELECT id FROM global_categories WHERE name = ${categoryData.name} AND (restaurant_id = ${restaurantId} OR restaurant_id IS NULL)
      `
      if (globalCategory.length === 0) {
        const newGlobalCategory = await sql`
          INSERT INTO global_categories (name, type, order_index, restaurant_id)
          VALUES (${categoryData.name}, 'food', 0, ${restaurantId})
          RETURNING id
        `
        globalCategory = newGlobalCategory
      }
      const categoryId = globalCategory[0].id

      for (const itemData of categoryData.items) {
        await sql`
          INSERT INTO menu_items (name, description, price, digital_menu_id, category_id, order_index)
          VALUES (${itemData.name}, ${itemData.description}, ${itemData.price}, ${digitalMenuId}, ${categoryId}, 0)
        `
      }
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true, message: "Menu uploaded and processed by AI successfully!", digitalMenuId }
  } catch (error) {
    console.error("Error in mockAiMenuUpload:", error)
    throw new Error("Failed to process AI menu upload.")
  }
}

export async function processMenuWithAI(base64Image: string): Promise<ParsedMenuData> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to process menu with AI.")
    }

    // Upload the image to Vercel Blob storage
    const imageUrl = await uploadBase64ImageToBlob(base64Image, `ai-menu-upload-${Date.now()}.png`)

    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract menu items from this image. Provide the menu name, and for each item: name, description, price, and category. Respond in JSON format only, like this: { menuName: 'Menu Title', menuItems: [{ name: 'Dish Name', description: 'Dish Description', price: 12.34, category: 'Category Name' }] }.",
            },
            { type: "image", image: imageUrl },
          ],
        },
      ],
    })

    const parsedData: ParsedMenuData = JSON.parse(text)

    // You might want to save this parsed data to your database here
    // For now, we'll just return it.

    revalidatePath("/dashboard/upload-menu/review") // Revalidate the review page
    return parsedData
  } catch (error) {
    console.error("Error processing menu with AI:", error)
    throw new Error("Failed to process menu with AI.")
  }
}

export async function generateMenuDescription(dishName: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a short, enticing, and concise menu description for a dish named "${dishName}". Keep it under 20 words.`,
    })
    return text
  } catch (error) {
    console.error("Error generating menu description:", error)
    return "A delicious dish." // Fallback description
  }
}
