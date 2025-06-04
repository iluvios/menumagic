"use server"
import { revalidatePath } from "next/cache"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { sql } from "@vercel/postgres"

interface MenuItem {
  name: string
  description: string
  price: number
  image_url?: string
}

interface MenuCategory {
  name: string
  items: MenuItem[]
}

interface ParsedMenu {
  restaurantName: string
  menu: MenuCategory[]
}

export async function processMenuImage(base64Image: string): Promise<ParsedMenu> {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extract the menu items, their descriptions, and prices from this image. Group them by category. If an item has no description, use an empty string. If an item has no price, use 0.00. Return the data as a JSON object with a 'restaurantName' (string) and 'menu' (array of objects with 'name' and 'items' properties). Each item in 'items' should have 'name', 'description', and 'price'. Ensure prices are numbers. If no restaurant name is found, use 'Unknown Restaurant'. If no menu items are found, return an empty menu array. Do not include any other text or markdown outside the JSON object.",
            },
            { type: "image", image: base64Image },
          ],
        },
      ],
      temperature: 0, // Keep it deterministic for data extraction
    })

    console.log("AI Response Text:", text)

    // Attempt to parse the JSON. The AI might sometimes include markdown.
    let jsonString = text.trim()
    if (jsonString.startsWith("```json")) {
      jsonString = jsonString.substring(7, jsonString.lastIndexOf("```")).trim()
    }

    const parsedData: ParsedMenu = JSON.parse(jsonString)

    // Basic validation and type coercion
    if (typeof parsedData.restaurantName !== "string") {
      parsedData.restaurantName = "Unknown Restaurant"
    }
    if (!Array.isArray(parsedData.menu)) {
      parsedData.menu = []
    }

    parsedData.menu = parsedData.menu.map((category: any) => ({
      name: typeof category.name === "string" ? category.name : "Uncategorized",
      items: Array.isArray(category.items)
        ? category.items.map((item: any) => ({
            name: typeof item.name === "string" ? item.name : "Unnamed Item",
            description: typeof item.description === "string" ? item.description : "",
            price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0.0,
          }))
        : [],
    }))

    return parsedData
  } catch (error) {
    console.error("Error processing menu image with AI:", error)
    throw new Error("Failed to process menu image. Please try again.")
  }
}

export async function saveParsedMenuToDatabase(parsedMenu: ParsedMenu, imageUrl: string) {
  try {
    // Create a new digital menu entry
    const { rows: menuRows } = await sql`
      INSERT INTO digital_menus (name, status, qr_code_url)
      VALUES (${parsedMenu.restaurantName || "Imported Menu"}, 'draft', ${imageUrl})
      RETURNING id;
    `
    const digitalMenuId = menuRows[0].id

    // Process categories and menu items
    for (const category of parsedMenu.menu) {
      // Find or create global category
      let globalCategoryId: number
      const { rows: existingCategory } = await sql`
        SELECT id FROM global_categories WHERE name ILIKE ${category.name} LIMIT 1;
      `
      if (existingCategory.length > 0) {
        globalCategoryId = existingCategory[0].id
      } else {
        const { rows: newCategory } = await sql`
          INSERT INTO global_categories (name, type, order_index)
          VALUES (${category.name}, 'menu', (SELECT COALESCE(MAX(order_index), -1) + 1 FROM global_categories WHERE type = 'menu'))
          RETURNING id;
        `
        globalCategoryId = newCategory[0].id
      }

      // Create menu_category for the digital menu
      const { rows: menuCategoryRows } = await sql`
        INSERT INTO menu_categories (digital_menu_id, category_id, order_index)
        VALUES (${digitalMenuId}, ${globalCategoryId}, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM menu_categories WHERE digital_menu_id = ${digitalMenuId}))
        RETURNING id;
      `
      const menuCategoryId = menuCategoryRows[0].id

      // Insert menu items
      for (const item of category.items) {
        await sql`
          INSERT INTO menu_items (menu_category_id, name, description, price, image_url, order_index)
          VALUES (${menuCategoryId}, ${item.name}, ${item.description}, ${item.price}, ${item.image_url || null}, (SELECT COALESCE(MAX(order_index), -1) + 1 FROM menu_items WHERE menu_category_id = ${menuCategoryId}));
        `
      }
    }

    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/upload-menu/review")
    return { success: true, digitalMenuId }
  } catch (error) {
    console.error("Error saving parsed menu to database:", error)
    throw new Error("Failed to save parsed menu to database.")
  }
}
