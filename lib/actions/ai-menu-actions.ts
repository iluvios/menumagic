"use server"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { uploadBase64ImageToBlob } from "@/lib/utils/blob-helpers"
import { sql } from "@/lib/db"

interface MenuItemDataForAi {
  name: string;
  description: string;
  price: number;
  category_name?: string; // Make category_name optional as AI might not always find it
  // id, menu_category_id will be handled when actually creating the item
  ai_extracted: boolean; // Flag for UI
}

// Removed ParsedMenuData, CategoryData, MockResponse as they were for the old mock structure

// Modified mockAiMenuUpload to align with frontend review flow
// It now accepts a File object (though not used in mock) and returns items for review.
export async function mockAiMenuUpload(file: File, digitalMenuId: number): Promise<MenuItemDataForAi[]> {
  console.log(`[mockAiMenuUpload] Received file: ${file.name} for menu ID: ${digitalMenuId} (Menu ID not used in this mock response)`);

  // Simulate AI processing delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1500));

  const extractedItems: MenuItemDataForAi[] = [
    {
      name: "Tacos al Pastor (AI Mock)",
      description: "Deliciosos tacos de cerdo marinado con achiote, servidos con piña, cebolla y cilantro.",
      price: Math.round((Math.random() * 10 + 10) * 100) / 100,
      category_name: "Platos Fuertes",
      ai_extracted: true,
    },
    {
      name: "Guacamole Fresco (AI Mock)",
      description: "Aguacate fresco machacado con cebolla, tomate, cilantro y un toque de limón.",
      price: Math.round((Math.random() * 5 + 5) * 100) / 100,
      category_name: "Entradas",
      ai_extracted: true,
    },
    {
      name: "Horchata Casera (AI Mock)",
      description: "Bebida refrescante de arroz con canela y vainilla.",
      price: Math.round((Math.random() * 3 + 2) * 100) / 100,
      category_name: "Bebidas",
      ai_extracted: true,
    },
    {
      name: "Sopa de Tortilla (AI Mock)",
      description: "Caldo de tomate con pollo deshebrado, tiras de tortilla frita, aguacate, queso y crema.",
      price: Math.round((Math.random() * 8 + 7) * 100) / 100,
      category_name: "Platos Fuertes",
      ai_extracted: true,
    },
  ];

  console.log(`[mockAiMenuUpload] Returning ${extractedItems.length} mock items for review.`);
  return extractedItems;
}

export async function processMenuWithAI(base64Image: string) { // : Promise<ParsedMenuData> - Type needs to be updated or function refactored
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

    // const parsedData: ParsedMenuData = JSON.parse(text) // ParsedMenuData is removed, this needs to be adapted
    // For now, let's assume text is the direct parsable data for extracted items or similar.
    // This function needs to be aligned with how you want to use real AI results.
    console.log("AI Response Text:", text);
    // TODO: Adapt this to return data in a structure expected by the caller
    // Potentially, it should return something similar to MenuItemDataForAi[]
    const parsedResult = JSON.parse(text); // This is a guess, actual parsing depends on AI output format


    revalidatePath("/dashboard/upload-menu/review") // Revalidate the review page
    return parsedResult; // Caller needs to handle this structure
  } catch (error) {
    console.error("Error processing menu with AI:", error)
    throw new Error("Failed to process menu with AI.")
  }
}

export async function generateMenuDescription(dishName: string) {
  try {
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `Generate a short, enticing, and concise menu description for a dish named \"${dishName}\". Keep it under 20 words.`,
    })
    return text
  } catch (error) {
    console.error("Error generating menu description:", error)
    return "A delicious dish." // Fallback description
  }
}
