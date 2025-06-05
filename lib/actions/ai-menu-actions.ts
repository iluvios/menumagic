"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

// Initialize the Google Generative AI client
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "")

// Mock function for testing without actual AI processing
export async function mockAiMenuUpload(imageUrl: string) {
  // This is a mock function that returns predefined data
  // In a real implementation, this would call an AI service

  await new Promise((resolve) => setTimeout(resolve, 2000)) // Simulate processing time

  return {
    success: true,
    menuItems: [
      {
        name: "Classic Burger",
        description: "Juicy beef patty with lettuce, tomato, and special sauce",
        price: 12.99,
        category: "Burgers",
      },
      {
        name: "Caesar Salad",
        description: "Crisp romaine lettuce with parmesan, croutons and Caesar dressing",
        price: 9.99,
        category: "Salads",
      },
      {
        name: "Margherita Pizza",
        description: "Fresh mozzarella, tomatoes, and basil on thin crust",
        price: 14.99,
        category: "Pizzas",
      },
      {
        name: "Chocolate Brownie",
        description: "Warm chocolate brownie with vanilla ice cream",
        price: 6.99,
        category: "Desserts",
      },
    ],
  }
}

// Process menu image with AI
export async function processMenuWithAI(imageUrl: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to process menu.")
    }

    // Use Google's Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Prepare the prompt for the AI
    const prompt = `
      You are a menu extraction expert. Analyze this menu image and extract all menu items.
      For each item, provide:
      1. Name of the dish
      2. Description (if available)
      3. Price (in numeric format, e.g., 12.99)
      4. Category (infer from context if not explicitly stated)

      Format your response as a clean JSON array of objects with these fields:
      [
        {
          "name": "Item Name",
          "description": "Item description",
          "price": 12.99,
          "category": "Category Name"
        },
        ...
      ]
      
      Only include the JSON array in your response, no other text.
      If you cannot read or extract information clearly, make your best guess.
      If price is not available, use null.
      If description is not available, use a brief generic description based on the item name.
    `

    // Call the Gemini API with the image
    const imageParts = await fetch(imageUrl).then((r) => r.arrayBuffer())
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: Buffer.from(imageParts).toString("base64"),
        },
      },
    ])

    const response = result.response
    const text = response.text()

    // Clean and parse the response
    let cleanedText = text.trim()

    // Remove any markdown code block markers
    cleanedText = cleanedText.replace(/```json/g, "").replace(/```/g, "")

    // Try to extract just the JSON array if there's surrounding text
    const jsonMatch = cleanedText.match(/\[\s*\{.*\}\s*\]/s)
    if (jsonMatch) {
      cleanedText = jsonMatch[0]
    }

    // Parse the JSON
    let menuItems
    try {
      menuItems = JSON.parse(cleanedText)

      // Validate the structure
      if (!Array.isArray(menuItems)) {
        throw new Error("Response is not an array")
      }

      // Clean and validate each item
      menuItems = menuItems.map((item) => ({
        name: String(item.name || "Unnamed Item").trim(),
        description: String(item.description || "").trim(),
        price: item.price !== null && !isNaN(Number(item.price)) ? Number(item.price) : null,
        category: String(item.category || "Uncategorized").trim(),
      }))
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      console.error("Raw response:", text)
      throw new Error("Failed to parse menu items from AI response.")
    }

    // Store the processed menu in the database
    const menuId = await sql`
      INSERT INTO ai_processed_menus (restaurant_id, image_url, processed_data_json)
      VALUES (${restaurantId}, ${imageUrl}, ${JSON.stringify(menuItems)})
      RETURNING id
    `

    revalidatePath("/upload-menu/review")
    return {
      success: true,
      menuId: menuId[0].id,
      menuItems,
    }
  } catch (error) {
    console.error("Error processing menu with AI:", error)
    throw new Error("Failed to process menu with AI.")
  }
}

// Generate a description for a menu using AI
export async function generateMenuDescription(menuName: string, menuItems: any[]) {
  try {
    // Use Google's Gemini model
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    // Create a summary of menu items to include in the prompt
    const itemsSummary = menuItems
      .slice(0, 5)
      .map((item) => `- ${item.name}: ${item.price ? `$${item.price}` : "Price varies"}`)
      .join("\n")

    // Prepare the prompt
    const prompt = `
      Generate a brief, engaging description for a restaurant menu named "${menuName}".
      The menu includes items such as:
      ${itemsSummary}
      ${menuItems.length > 5 ? `\n...and ${menuItems.length - 5} more items.` : ""}

      The description should be 2-3 sentences, highlight the cuisine style, and be appealing to customers.
      Do not include specific prices in the description.
    `

    // Call the Gemini API
    const result = await model.generateContent(prompt)
    const description = result.response.text().trim()

    return {
      success: true,
      description,
    }
  } catch (error) {
    console.error("Error generating menu description:", error)
    return {
      success: false,
      description: `Menu featuring a variety of delicious options.`, // Fallback description
    }
  }
}
