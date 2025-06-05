"use server"

import { generateText } from "ai"
import { google } from "@ai-sdk/google"
import { createMenuItem, getAllGlobalCategories, createCategory, getAllDishes } from "@/lib/actions/menu-studio-actions"
import { put } from "@vercel/blob"
import { getRestaurantIdFromSession } from "@/lib/auth"

interface ExtractedMenuItem {
  name: string
  description: string
  price: string // Price as string from AI, will be parsed later
  category: string
}

// Helper to clean and validate AI extracted data
function cleanExtractedData(data: any): ExtractedMenuItem[] {
  if (!Array.isArray(data)) {
    console.warn("AI response is not an array:", data)
    return []
  }

  return data
    .map((item) => {
      // Ensure item is an object and has required properties
      if (typeof item !== "object" || item === null) return null
      if (!item.name || !item.price || !item.category) return null

      // Basic cleaning and type conversion
      const name = String(item.name).trim()
      const description = item.description ? String(item.description).trim() : ""
      const price = String(item.price)
        .trim()
        .replace(/[^0-9.]/g, "") // Remove non-numeric chars except dot
      const category = String(item.category).trim()

      // Validate price can be converted to a number
      if (isNaN(Number.parseFloat(price))) return null

      return { name, description, price, category }
    })
    .filter(Boolean) as ExtractedMenuItem[] // Filter out nulls
}

// Helper to clean AI response and extract JSON
function extractJsonFromResponse(text: string): string {
  // Remove markdown code block markers if present
  let cleanedText = text.trim()

  // Check if response is wrapped in markdown code blocks
  if (cleanedText.startsWith("```json")) {
    cleanedText = cleanedText.replace(/^```json\s*/, "")
  }
  if (cleanedText.startsWith("```")) {
    cleanedText = cleanedText.replace(/^```\s*/, "")
  }
  if (cleanedText.endsWith("```")) {
    cleanedText = cleanedText.replace(/\s*```$/, "")
  }

  return cleanedText.trim()
}

// Helper to delay execution (for throttling)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function processMenuWithAI(
  imageFile: File,
  onProgress?: (progress: number) => void,
): Promise<{ success: boolean; extractedItems?: ExtractedMenuItem[]; error?: string }> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return { success: false, error: "Authentication required." }
    }

    // Upload image to Vercel Blob for AI processing
    const filename = `ai-menus/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
    const { url: imageUrl } = await put(filename, imageFile, { access: "public" })

    onProgress?.(20)

    const prompt = `
      You are an expert menu extractor. Your task is to extract menu items (dishes) and their categories, descriptions, and prices from an image of a restaurant menu.
      
      IMPORTANT: Return ONLY a valid JSON array. Do not wrap your response in markdown code blocks or add any other text.
      
      The output should be a JSON array of objects, where each object represents a menu item.
      Each object MUST have the following properties:
      - "name": (string) The name of the dish.
      - "description": (string, optional) A brief description of the dish. If no description is present, use an empty string.
      - "price": (string) The price of the dish. Extract the numeric value, do not include currency symbols.
      - "category": (string) The category the dish belongs to (e.g., "Appetizers", "Main Courses", "Desserts", "Drinks"). If a category is not explicitly stated, infer it from context or group similar items.

      Example output format:
      [
        {
          "name": "Margherita Pizza",
          "description": "Classic pizza with tomato, mozzarella, and basil.",
          "price": "12.50",
          "category": "Pizzas"
        },
        {
          "name": "Caesar Salad",
          "description": "Fresh romaine lettuce with Caesar dressing and croutons.",
          "price": "9.00",
          "category": "Salads"
        }
      ]

      Return ONLY the JSON array, no markdown formatting, no code blocks, no additional text.
    `

    const model = google("gemini-2.0-flash-exp") // Using Gemini 2.0 Flash as requested

    const { text } = await generateText({
      model: model,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image", image: imageUrl },
          ],
        },
      ],
      temperature: 0.2, // Keep it low for more factual extraction
    })

    onProgress?.(80)

    // Clean the response to extract JSON
    const cleanedResponse = extractJsonFromResponse(text)
    console.log("Raw AI response:", text)
    console.log("Cleaned AI response:", cleanedResponse)

    let parsedData: any
    try {
      parsedData = JSON.parse(cleanedResponse)
    } catch (jsonError) {
      console.error("Failed to parse AI response JSON:", jsonError)
      console.error("Raw AI response:", text)
      console.error("Cleaned response:", cleanedResponse)
      return { success: false, error: "AI response was not valid JSON. Please try again with a clearer image." }
    }

    const extractedItems = cleanExtractedData(parsedData)

    onProgress?.(100)

    return { success: true, extractedItems }
  } catch (error: any) {
    console.error("Error in processMenuWithAI:", error)
    return { success: false, error: error.message || "An unexpected error occurred during AI processing." }
  }
}

export async function addAiItemToMenu(
  digitalMenuId: number,
  item: ExtractedMenuItem,
): Promise<{ success: boolean; error?: string; message?: string }> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return { success: false, error: "Authentication required." }
    }

    // Check if dish already exists
    try {
      const existingDishes = await getAllDishes()
      const existingDish = existingDishes.find((dish) => dish.name.toLowerCase() === item.name.toLowerCase())

      if (existingDish) {
        return {
          success: false,
          error: `Dish "${item.name}" already exists in your global dishes.`,
          message: "already_exists",
        }
      }
    } catch (dishError: any) {
      console.error("Error checking existing dishes:", dishError)
      // Continue with the process even if we can't check for duplicates
    }

    // Find or create category with better error handling
    let categoryId: number | undefined
    try {
      const globalCategories = await getAllGlobalCategories()
      const existingCategory = globalCategories.find((cat) => cat.name.toLowerCase() === item.category.toLowerCase())

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        // Create new category if it doesn't exist
        try {
          const newCategory = await createCategory({
            name: item.category,
            type: "menu_item",
            order_index: globalCategories.length + 1,
          })
          categoryId = newCategory.id
        } catch (categoryError: any) {
          console.error("Error creating category:", categoryError)
          return {
            success: false,
            error: `Failed to create category "${item.category}". ${categoryError.message || "Please try again or create the category manually first."}`,
          }
        }
      }
    } catch (categoriesError: any) {
      console.error("Error fetching categories:", categoriesError)
      return {
        success: false,
        error: `Failed to fetch categories. ${categoriesError.message || "Please check your database connection and try again."}`,
      }
    }

    if (!categoryId) {
      return {
        success: false,
        error: `Could not determine or create category "${item.category}".`,
      }
    }

    // Create menu item with better error handling
    try {
      await createMenuItem({
        digital_menu_id: digitalMenuId,
        name: item.name,
        description: item.description,
        price: Number.parseFloat(item.price),
        menu_category_id: categoryId,
        isAvailable: true,
      })

      return { success: true, message: `Successfully added "${item.name}" to menu.` }
    } catch (menuItemError: any) {
      console.error("Error creating menu item:", menuItemError)
      return {
        success: false,
        error: `Failed to add "${item.name}" to menu. ${menuItemError.message || "Please try again."}`,
      }
    }
  } catch (error: any) {
    console.error("Error adding AI item to menu:", error)
    return {
      success: false,
      error: `Unexpected error adding "${item.name}": ${error.message || "Please try again."}`,
    }
  }
}

// Export the real function under the required name to satisfy the import
// This is just an alias to the real processMenuWithAI function
export const mockAiMenuUpload = processMenuWithAI
