"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// --- Brand Kit Actions ---

export async function getBrandKit() {
  try {
    // TODO: Filter by restaurant_id once authentication is implemented
    const brandKitResult = await sql`
      SELECT id, logo_url, primary_color_hex, secondary_colors_json_array, font_family_main, font_family_secondary
      FROM brand_kits
      LIMIT 1
    `

    const assetsResult = await sql`
      SELECT id, asset_name, asset_url, asset_type
      FROM brand_assets
      WHERE brand_kit_id = ${brandKitResult[0]?.id || null}
      ORDER BY created_at DESC
    `

    if (brandKitResult.length === 0) {
      // If no brand kit exists, create a default one
      const newBrandKit = await sql`
        INSERT INTO brand_kits (logo_url, primary_color_hex, font_family_main, font_family_secondary)
        VALUES ('/placeholder.svg?height=100&width=100', '#F59E0B', 'Inter', 'Lora')
        RETURNING id, logo_url, primary_color_hex, secondary_colors_json_array, font_family_main, font_family_secondary
      `
      return { brandKit: newBrandKit[0], assets: [] }
    }

    return { brandKit: brandKitResult[0], assets: assetsResult || [] }
  } catch (error) {
    console.error("Error fetching brand kit:", error)
    return { brandKit: {}, assets: [] }
  }
}

export async function updateBrandKit(
  id: number | undefined,
  data: {
    logo_url?: string
    primary_color_hex?: string
    secondary_colors_json_array?: string[]
    font_family_main?: string
    font_family_secondary?: string
  },
) {
  try {
    if (!id) {
      // If no ID, try to create one (should ideally be handled by getBrandKit)
      const newBrandKit = await sql`
        INSERT INTO brand_kits (logo_url, primary_color_hex, secondary_colors_json_array, font_family_main, font_family_secondary)
        VALUES (
          ${data.logo_url || "/placeholder.svg?height=100&width=100"}, 
          ${data.primary_color_hex || "#F59E0B"}, 
          ${JSON.stringify(data.secondary_colors_json_array || [])}, 
          ${data.font_family_main || "Inter"}, 
          ${data.font_family_secondary || "Lora"}
        )
        RETURNING id
      `
      id = newBrandKit[0].id
    }

    await sql`
      UPDATE brand_kits
      SET 
        logo_url = COALESCE(${data.logo_url}, logo_url),
        primary_color_hex = COALESCE(${data.primary_color_hex}, primary_color_hex),
        secondary_colors_json_array = COALESCE(${JSON.stringify(data.secondary_colors_json_array || [])}, secondary_colors_json_array),
        font_family_main = COALESCE(${data.font_family_main}, font_family_main),
        font_family_secondary = COALESCE(${data.font_family_secondary}, font_family_secondary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error) {
    console.error("Error updating brand kit:", error)
    return { success: false, error: "Failed to update brand kit" }
  }
}

// --- Brand Assets Actions ---

export async function uploadBrandAsset(
  brandKitId: number | undefined,
  data: { asset_name: string; asset_url: string; asset_type: string },
) {
  try {
    if (!brandKitId) {
      // Attempt to get or create a brand kit if ID is missing
      const existingBrandKit = await getBrandKit()
      brandKitId = existingBrandKit.brandKit?.id
      if (!brandKitId) {
        const newBrandKit = await sql`
          INSERT INTO brand_kits (logo_url, primary_color_hex, font_family_main, font_family_secondary)
          VALUES ('/placeholder.svg?height=100&width=100', '#F59E0B', 'Inter', 'Lora')
          RETURNING id
        `
        brandKitId = newBrandKit[0].id
      }
    }

    await sql`
      INSERT INTO brand_assets (brand_kit_id, asset_name, asset_url, asset_type)
      VALUES (${brandKitId}, ${data.asset_name}, ${data.asset_url}, ${data.asset_type})
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error) {
    console.error("Error uploading brand asset:", error)
    return { success: false, error: "Failed to upload brand asset" }
  }
}

export async function deleteBrandAsset(id: number) {
  try {
    await sql`
      DELETE FROM brand_assets
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error) {
    console.error("Error deleting brand asset:", error)
    return { success: false, error: "Failed to delete brand asset" }
  }
}
