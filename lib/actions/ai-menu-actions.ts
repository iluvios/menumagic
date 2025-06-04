"use server"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { uploadBase64ImageToBlob } from "@/lib/utils/blob-helpers"

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

export async function mockAiMenuUpload(base64Image: string, menuName: string) {
  console.log("Mock AI Menu Upload called.")
  console.log(`Received base64 image (first 50 chars): ${base64Image.substring(0, 50)}...`)
  console.log(`Menu Name: ${menuName}`)

  // Simulate AI processing time
  await new Promise((resolve) => setTimeout(resolve, 3000))

  // Simulate successful upload and parsing
  const mockData: ParsedMenuData = {
    menuName: menuName,
    menuItems: [
      {
        name: "Mock Dish 1",
        description: "A delicious mock dish.",
        price: 12.99,
        category: "Appetizers",
      },
      {
        name: "Mock Dish 2",
        description: "Another tasty mock dish.",
        price: 18.5,
        category: "Main Courses",
      },
    ],
  }

  console.log("Mock AI Menu Upload successful. Returning mock data.")
  return { success: true, data: mockData }
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
