"use server"

import { sql } from "@/lib/db" // Import sql from lib/db
import { revalidatePath } from "next/cache"
import { put } from "@vercel/blob"
import type { PutBlobResult } from "@vercel/blob"

// Removed redundant neon initialization and DATABASE_URL check from here

export interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image_url?: string
  template_data_json: {
    primary_color?: string
    secondary_color?: string
    accent_color?: string
    background_color?: string
    background_image_url?: string
    border_radius?: string
    font_family_primary?: string
    font_family_secondary?: string
    layout_style?: string
    card_style?: string
    spacing?: string
    show_images?: boolean
    show_descriptions?: boolean
    show_prices?: boolean
    header_style?: string
    footer_style?: string
  }
  is_default?: boolean
  created_at?: string
  updated_at?: string
}

// Get all templates for a restaurant
export async function getMenuTemplates() {
  try {
    const templates = await sql`
      SELECT id, name, description, preview_image_url
      FROM menu_templates
      ORDER BY id ASC;
    `
    return templates
  } catch (error) {
    console.error("Error fetching menu templates:", error)
    return []
  }
}

// Get a specific template by ID
export async function getMenuTemplateById(id: number) {
  try {
    const result = await sql`
      SELECT id, name, description, preview_image_url, template_data_json, is_default,
             created_at::text, updated_at::text
      FROM menu_templates
      WHERE id = ${id}
    `
    return result[0]
  } catch (error) {
    console.error("Error fetching menu template:", error)
    throw new Error("Failed to fetch menu template.")
  }
}

// Create a new template
export async function createMenuTemplate(
  data: {
    name: string
    description: string
    template_data_json: MenuTemplate["template_data_json"]
    restaurant_id?: number
  },
  thumbnailFile?: File,
) {
  let thumbnailUrl: string | undefined = undefined
  if (thumbnailFile) {
    try {
      const blob: PutBlobResult = await put(`templates/${thumbnailFile.name}`, thumbnailFile, {
        access: "public",
      })
      thumbnailUrl = blob.url
    } catch (uploadError) {
      console.error("Error uploading thumbnail:", uploadError)
      throw new Error("Failed to upload template thumbnail.")
    }
  }

  try {
    const result = await sql`
      INSERT INTO menu_templates (restaurant_id, name, description, preview_image_url, template_data_json)
      VALUES (${data.restaurant_id || 1}, ${data.name}, ${data.description}, ${thumbnailUrl}, ${JSON.stringify(data.template_data_json)})
      RETURNING id, name
    `
    revalidatePath("/dashboard/menu-studio/templates")
    return { success: true, id: result[0].id, name: result[0].name }
  } catch (error) {
    console.error("Error creating menu template:", error)
    throw new Error("Failed to create menu template.")
  }
}

// Update an existing template
export async function updateMenuTemplate(
  id: number,
  data: {
    name?: string
    description?: string
    template_data_json?: MenuTemplate["template_data_json"]
  },
  thumbnailFile?: File,
) {
  let thumbnailUrlUpdate = ""
  if (thumbnailFile) {
    try {
      const blob: PutBlobResult = await put(`templates/${thumbnailFile.name}`, thumbnailFile, {
        access: "public",
      })
      thumbnailUrlUpdate = `, preview_image_url = '${blob.url}'`
    } catch (uploadError) {
      console.error("Error uploading thumbnail:", uploadError)
      throw new Error("Failed to upload template thumbnail.")
    }
  }

  try {
    await sql`
      UPDATE menu_templates
      SET 
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        template_data_json = COALESCE(${JSON.stringify(data.template_data_json)}, template_data_json),
        updated_at = CURRENT_TIMESTAMP
        ${thumbnailUrlUpdate ? sql`${sql.unsafe(thumbnailUrlUpdate)}` : sql``}
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/templates")
    return { success: true }
  } catch (error) {
    console.error("Error updating menu template:", error)
    throw new Error("Failed to update menu template.")
  }
}

// Delete a template
export async function deleteMenuTemplate(id: number) {
  try {
    // First, unlink any digital menus using this template
    await sql`
      UPDATE digital_menus
      SET template_id = NULL
      WHERE template_id = ${id}
    `

    // Then delete the template
    await sql`
      DELETE FROM menu_templates
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/templates")
    return { success: true }
  } catch (error) {
    console.error("Error deleting menu template:", error)
    throw new Error("Failed to delete menu template.")
  }
}

// Apply a template to a digital menu
export async function applyTemplateToMenu(digitalMenuId: number, templateId: number) {
  try {
    await sql`
      UPDATE digital_menus
      SET template_id = ${templateId}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${digitalMenuId}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error("Error applying template to menu:", error)
    throw new Error("Failed to apply template to menu.")
  }
}

// Mock AI template generation
export async function generateTemplateWithAI(
  prompt: string,
  baseTemplateId?: number,
  brandKitData?: {
    primary_color?: string
    logo_url?: string
    font_family_main?: string
  },
) {
  console.log(`Mock AI template generation for prompt: ${prompt}`)
  // Simulate AI processing delay
  await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 3000))

  // Generate AI-inspired template data based on prompt and brand kit
  const aiGeneratedTemplate: MenuTemplate["template_data_json"] = {
    primary_color: brandKitData?.primary_color || "#F59E0B",
    secondary_color: "#FEF3C7",
    accent_color: "#D97706",
    background_color: "#FFFBEB",
    border_radius: prompt.includes("modern") ? "12px" : "6px",
    font_family_primary: brandKitData?.font_family_main || "Inter",
    font_family_secondary: "Lora",
    layout_style: prompt.includes("grid") ? "grid" : "list",
    card_style: prompt.includes("minimal") ? "minimal" : "elevated",
    spacing: prompt.includes("compact") ? "compact" : "comfortable",
    show_images: true,
    show_descriptions: true,
    show_prices: true,
    header_style: "centered",
    footer_style: "simple",
  }

  return aiGeneratedTemplate
}

// Seed default templates
export async function seedDefaultTemplates(restaurantId = 1) {
  try {
    // Check if default templates already exist
    const existingTemplates = await sql`
      SELECT COUNT(*) as count FROM menu_templates WHERE restaurant_id = ${restaurantId} AND is_default = true
    `

    if (Number(existingTemplates[0].count) > 0) {
      return { success: true, message: "Default templates already exist" }
    }

    // Template 1: Classic Elegant
    const classicTemplate = {
      primary_color: "#1F2937",
      secondary_color: "#F9FAFB",
      accent_color: "#D97706",
      background_color: "#FFFFFF",
      border_radius: "8px",
      font_family_primary: "Inter",
      font_family_secondary: "Lora",
      layout_style: "list",
      card_style: "elevated",
      spacing: "comfortable",
      show_images: true,
      show_descriptions: true,
      show_prices: true,
      header_style: "centered",
      footer_style: "simple",
    }

    await sql`
      INSERT INTO menu_templates (restaurant_id, name, description, template_data_json, is_default)
      VALUES (
        ${restaurantId}, 
        'Classic Elegant', 
        'A timeless and sophisticated design perfect for fine dining establishments.',
        ${JSON.stringify(classicTemplate)},
        true
      )
    `

    // Template 2: Modern Vibrant
    const modernTemplate = {
      primary_color: "#7C3AED",
      secondary_color: "#F3E8FF",
      accent_color: "#F59E0B",
      background_color: "#FEFEFE",
      background_image_url: "/placeholder.svg?height=800&width=1200",
      border_radius: "16px",
      font_family_primary: "Inter",
      font_family_secondary: "Poppins",
    }

    await sql`
      INSERT INTO menu_templates (restaurant_id, name, description, template_data_json, is_default)
      VALUES (
        ${restaurantId}, 
        'Modern Vibrant', 
        'A contemporary and colorful design ideal for casual dining and trendy cafes.',
        ${JSON.stringify(modernTemplate)},
        true
      )
    `

    revalidatePath("/dashboard/menu-studio/templates")
    return { success: true, message: "Default templates created successfully" }
  } catch (error) {
    console.error("Error seeding default templates:", error)
    throw new Error("Failed to seed default templates.")
  }
}
