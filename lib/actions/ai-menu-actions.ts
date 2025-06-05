"use server"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { GoogleGenerativeAI } from "@google/generative-ai"

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!)

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

    // Convert file to base64 for processing
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString("base64")

    // Process with AI
    const extractedData = await processMenuWithAI(base64, file.type)

    return {
      success: true,
      data: extractedData,
    }
  } catch (error: any) {
    console.error("Error in mockAiMenuUpload:", error)
    return {
      success: false,
      error: error.message || "Failed to process menu",
    }
  }
}

export async function processMenuWithAI(base64Image: string, mimeType: string) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured")
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

    const prompt = `
      Analyze this menu image and extract the following information in JSON format:
      {
        "restaurant_name": "string",
        "categories": [
          {
            "name": "string",
            "items": [
              {
                "name": "string",
                "description": "string",
                "price": number,
                "ingredients": ["string"]
              }
            ]
          }
        ]
      }
      
      Please ensure:
      - Extract all visible menu items with their names, descriptions, and prices
      - Group items by categories (appetizers, mains, desserts, etc.)
      - Convert prices to numbers (remove currency symbols)
      - Include ingredients when mentioned in descriptions
      - Return only valid JSON, no additional text
    `

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType,
        },
      },
    ])

    const response = await result.response
    const text = response.text()

    // Clean the response to extract JSON
    let jsonText = text.trim()
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/, "").replace(/\n?```$/, "")
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/, "").replace(/\n?```$/, "")
    }

    try {
      const extractedData = JSON.parse(jsonText)

      // Validate and clean the data
      if (!extractedData.categories || !Array.isArray(extractedData.categories)) {
        throw new Error("Invalid data structure: categories not found or not an array")
      }

      // Clean and validate the data
      const cleanedData = {
        restaurant_name: extractedData.restaurant_name || "Extracted Menu",
        categories: extractedData.categories.map((category: any) => ({
          name: category.name || "Uncategorized",
          items: (category.items || []).map((item: any) => ({
            name: item.name || "Unnamed Item",
            description: item.description || "",
            price: typeof item.price === "number" ? item.price : Number.parseFloat(item.price) || 0,
            ingredients: Array.isArray(item.ingredients) ? item.ingredients : [],
          })),
        })),
      }

      return cleanedData
    } catch (parseError) {
      console.error("JSON parsing error:", parseError)
      console.error("Raw response:", text)
      throw new Error("Failed to parse AI response as JSON")
    }
  } catch (error: any) {
    console.error("Error in processMenuWithAI:", error)
    throw new Error(`AI processing failed: ${error.message}`)
  }
}

export async function generateMenuDescription(menuData: any) {
  try {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
      throw new Error("Google AI API key not configured")
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" })

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
