"use server"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { generateText } from "ai"
import { google } from "@ai-sdk/google"
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
            { name: "Spring Rolls", description: "Crispy rolls with vegetables", price: 7.99, category: "Appetizers" },
            {
              name: "Garlic Bread",
              description: "Toasted bread with garlic butter",
              price: 5.5,
              category: "Appetizers",
            },
          ],
        },
        {
          name: "Main Courses",
          items: [
            {
              name: "Chicken Curry",
              description: "Spicy chicken curry with rice",
              price: 14.99,
              category: "Main Courses",
            },
            {
              name: "Vegetable Lasagna",
              description: "Layers of pasta, vegetables, and cheese",
              price: 12.5,
              category: "Main Courses",
            },
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
        SELECT id FROM categories WHERE name = ${categoryData.name} AND restaurant_id = ${restaurantId}
      `
      if (globalCategory.length === 0) {
        const newGlobalCategory = await sql`
          INSERT INTO categories (name, type, order_index, restaurant_id)
          VALUES (${categoryData.name}, 'food', 0, ${restaurantId})
          RETURNING id
        `
        globalCategory = newGlobalCategory
      }
      const categoryId = globalCategory[0].id

      for (const itemData of categoryData.items) {
        await sql`
          INSERT INTO menu_items (name, description, price, digital_menu_id, menu_category_id, order_index)
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

    // Convert base64 to data URL for Gemini
    const imageDataUrl = `data:image/jpeg;base64,${base64Image}`

    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this menu image and extract all menu items with their details. 

For each dish/item you find, extract:
- name: The exact dish name as written
- description: The description if provided, or create a brief appetizing description if none exists
- price: The price as a number (remove currency symbols, if no price is visible use 0)
- category: The section/category it belongs to (like "Appetizers", "Main Courses", "Desserts", etc.)

Please be thorough and extract ALL visible menu items. Pay attention to:
- Different sections of the menu
- Items that might be in smaller text
- Combo meals or special offers
- Beverages if present

Respond ONLY with valid JSON in this exact format:
{
  "menuName": "Name of the restaurant or menu",
  "menuItems": [
    {
      "name": "Dish Name",
      "description": "Brief description",
      "price": 12.99,
      "category": "Category Name"
    }
  ]
}`,
            },
            {
              type: "image",
              image: imageDataUrl,
            },
          ],
        },
      ],
    })

    let parsedData: ParsedMenuData
    try {
      // Clean the response text to ensure it's valid JSON
      const cleanedText = text
        .trim()
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
      parsedData = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      throw new Error("AI response was not valid JSON. Please try again.")
    }

    // Validate the parsed data
    if (!parsedData.menuItems || !Array.isArray(parsedData.menuItems)) {
      throw new Error("Invalid AI response format - no menu items found")
    }

    // Ensure all required fields are present and valid
    parsedData.menuItems = parsedData.menuItems
      .filter((item) => {
        return item.name && typeof item.name === "string" && item.name.trim().length > 0
      })
      .map((item) => ({
        name: item.name.trim(),
        description: item.description || `Delicious ${item.name.toLowerCase()}`,
        price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0,
        category: item.category || "General",
      }))

    if (parsedData.menuItems.length === 0) {
      throw new Error("No valid menu items could be extracted from the image")
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    return parsedData
  } catch (error) {
    console.error("Error processing menu with AI:", error)
    throw new Error(`Failed to process menu with AI: ${error.message}`)
  }
}

export async function generateMenuDescription(dishName: string) {
  try {
    const { text } = await generateText({
      model: google("gemini-2.0-flash"),
      prompt: `Generate a short, enticing, and concise menu description for a dish named "${dishName}". Keep it under 20 words and make it appetizing.`,
    })
    return text.trim()
  } catch (error) {
    console.error("Error generating menu description:", error)
    return "A delicious dish." // Fallback description
  }
}
