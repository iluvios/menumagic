"use server"

import { GoogleGenerativeAI } from "@google/generative-ai"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { sql } from "@/lib/db"
import { createDish } from "./menu-studio-actions"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

export async function mockAiMenuUpload(formData: FormData) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const file = formData.get("menu") as File
    if (!file) {
      throw new Error("No file provided")
    }

    // Process with AI
    const result = await processMenuWithAI(file)

    return result
  } catch (error: any) {
    console.error("Error in mockAiMenuUpload:", error)
    return {
      success: false,
      error: error.message || "Failed to process menu",
    }
  }
}

export async function processMenuWithAI(imageFile: File) {
  try {
    console.log("Starting AI menu processing...")

    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required.")
    }

    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured")
    }

    // Convert the file to a base64 string
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Image = buffer.toString("base64")
    const mimeType = imageFile.type

    console.log(`Processing image: ${imageFile.name}, size: ${imageFile.size}, type: ${mimeType}`)

    // Get all categories for this restaurant
    const categories = await sql`
      SELECT id, name FROM categories 
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name ASC
    `

    if (!categories || categories.length === 0) {
      throw new Error("Please create at least one category before using AI extraction.")
    }

    const defaultCategoryId = categories[0].id

    // Use the Gemini model - try different models if one fails
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

      // Prepare the prompt
      const prompt = `
        Extract all menu items from this image. For each item, provide:
        - name: the dish name
        - description: brief description if available
        - price: numeric price without currency symbols
        
        Return ONLY a JSON array like this:
        [
          {"name": "Dish Name", "description": "Description", "price": 12.99},
          {"name": "Another Dish", "description": "Description", "price": 8.50}
        ]
        
        Do not include any other text, just the JSON array.
      `

      console.log("Sending request to Gemini...")

      // Process with Gemini
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType,
            data: base64Image,
          },
        },
      ])

      const response = result.response
      const text = response.text()

      console.log("Received response from Gemini:", text.substring(0, 200) + "...")

      // Extract JSON from the response
      let jsonText = text.trim()

      // Remove markdown code blocks if present
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "")
      } else if (jsonText.startsWith("```")) {
        jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "")
      }

      // Find JSON array in the text
      const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        jsonText = jsonMatch[0]
      }

      let extractedItems = []
      try {
        extractedItems = JSON.parse(jsonText)
        console.log(`Successfully parsed ${extractedItems.length} items`)
      } catch (e) {
        console.error("Failed to parse JSON:", e)
        console.error("Raw text:", text)
        throw new Error("Failed to parse menu items from AI response. Please try again with a clearer image.")
      }

      if (!Array.isArray(extractedItems)) {
        throw new Error("AI response was not in the expected format.")
      }

      // Map the extracted items to the correct format with category IDs
      const mappedItems = extractedItems.map((item, index) => {
        const price = typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0

        return {
          id: 1000 + index, // Temporary ID for UI purposes
          name: item.name || "Unnamed Item",
          description: item.description || "",
          price: price,
          menu_category_id: defaultCategoryId,
          category_name: categories[0].name,
          is_available: true,
          order_index: index,
        }
      })

      console.log(`Mapped ${mappedItems.length} items successfully`)

      return {
        success: true,
        extractedItems: mappedItems,
      }
    } catch (error) {
      console.error("Error with gemini-1.5-flash, trying gemini-pro-vision:", error)

      // Fallback to gemini-pro-vision if the first model fails
      try {
        const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" })

        // Prepare the prompt
        const prompt = `
          Extract all menu items from this image. For each item, provide:
          - name: the dish name
          - description: brief description if available
          - price: numeric price without currency symbols
          
          Return ONLY a JSON array like this:
          [
            {"name": "Dish Name", "description": "Description", "price": 12.99},
            {"name": "Another Dish", "description": "Description", "price": 8.50}
          ]
          
          Do not include any other text, just the JSON array.
        `

        console.log("Sending request to Gemini Pro Vision...")

        // Process with Gemini
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
        ])

        const response = result.response
        const text = response.text()

        console.log("Received response from Gemini Pro Vision:", text.substring(0, 200) + "...")

        // Extract JSON from the response
        let jsonText = text.trim()

        // Remove markdown code blocks if present
        if (jsonText.startsWith("```json")) {
          jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "")
        } else if (jsonText.startsWith("```")) {
          jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "")
        }

        // Find JSON array in the text
        const jsonMatch = jsonText.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          jsonText = jsonMatch[0]
        }

        let extractedItems = []
        try {
          extractedItems = JSON.parse(jsonText)
          console.log(`Successfully parsed ${extractedItems.length} items`)
        } catch (e) {
          console.error("Failed to parse JSON:", e)
          console.error("Raw text:", text)
          throw new Error("Failed to parse menu items from AI response. Please try again with a clearer image.")
        }

        if (!Array.isArray(extractedItems)) {
          throw new Error("AI response was not in the expected format.")
        }

        // Map the extracted items to the correct format with category IDs
        const mappedItems = extractedItems.map((item, index) => {
          const price = typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0

          return {
            id: 1000 + index, // Temporary ID for UI purposes
            name: item.name || "Unnamed Item",
            description: item.description || "",
            price: price,
            menu_category_id: defaultCategoryId,
            category_name: categories[0].name,
            is_available: true,
            order_index: index,
          }
        })

        console.log(`Mapped ${mappedItems.length} items successfully`)

        return {
          success: true,
          extractedItems: mappedItems,
        }
      } catch (fallbackError) {
        console.error("Both models failed:", fallbackError)
        throw error // Throw the original error
      }
    }
  } catch (error) {
    console.error("Error in processMenuWithAI:", error)
    return {
      success: false,
      error: error.message || "Failed to process menu with AI",
    }
  }
}

export async function addAiItemToMenu(digitalMenuId: number, item: any) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required.")
    }

    // Create the dish in the global database
    const newDish = await createDish({
      name: item.name,
      description: item.description || "",
      price: item.price,
      menu_category_id: item.menu_category_id,
      is_available: true,
    })

    // Add the dish to the menu
    await sql`
      INSERT INTO menu_items (digital_menu_id, dish_id, order_index)
      VALUES (${digitalMenuId}, ${newDish.id}, 
        (SELECT COALESCE(MAX(order_index), -1) + 1 FROM menu_items WHERE digital_menu_id = ${digitalMenuId})
      )
    `

    return { success: true }
  } catch (error: any) {
    console.error("Error adding AI item to menu:", error)
    throw new Error(error.message || "Failed to add item to menu")
  }
}

export async function generateMenuDescription(menuData: any) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured")
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

    const prompt = `
      Based on this menu data, generate a compelling restaurant description in Spanish:
      ${JSON.stringify(menuData, null, 2)}
      
      Create a 2-3 sentence description that highlights:
      - The type of cuisine
      - Key specialties or standout dishes
      - The dining experience
      
      Keep it professional and appetizing. Return only the description text, no additional formatting.
    `

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text().trim()
  } catch (error: any) {
    console.error("Error generating menu description:", error)
    return "Deliciosa experiencia culinaria con platillos únicos y sabores auténticos."
  }
}
