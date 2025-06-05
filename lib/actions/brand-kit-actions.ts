"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"

export async function uploadBrandAsset(file: File | undefined | null, folder: string) {
  if (!file) return null
  if (file.size === 0) return null

  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const { url } = await put(filename, file, { access: "public" })
  return url
}

export async function deleteBrandAsset(url: string | undefined | null) {
  if (!url) return
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting blob:", error)
  }
}

export async function getBrandKit(restaurantId?: number) {
  let targetRestaurantId = restaurantId
  if (!targetRestaurantId) {
    const sessionRestaurantId = await getRestaurantIdFromSession()
    if (sessionRestaurantId) {
      targetRestaurantId = sessionRestaurantId
    }
  }

  if (!targetRestaurantId) {
    console.warn("No restaurant ID provided or found in session for getBrandKit.")
    return { brandKit: null }
  }

  try {
    const result = await sql`
      SELECT 
        id, restaurant_id, logo_url, primary_color_hex, 
        secondary_colors_json_array, font_family_main, font_family_secondary
      FROM brand_kits
      WHERE restaurant_id = ${targetRestaurantId}
    `
    return { brandKit: result[0] || null }
  } catch (error) {
    console.error("Error fetching brand kit:", error)
    return { brandKit: null }
  }
}

export async function updateBrandKit(id: number, data: any, logoFile?: File | null) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update brand kit.")
    }

    const brandKitCheck = await sql`
      SELECT id FROM brand_kits WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    if (brandKitCheck.length === 0) {
      throw new Error("Brand kit not found or does not belong to this restaurant.")
    }

    let logoUrlToUpdate: string | undefined | null = undefined
    const currentBrandKit = await sql`SELECT logo_url FROM brand_kits WHERE id = ${id}`
    const existingLogoUrl = currentBrandKit[0]?.logo_url

    if (logoFile === null) {
      logoUrlToUpdate = null
      if (existingLogoUrl) {
        await deleteBrandAsset(existingLogoUrl)
      }
    } else if (logoFile instanceof File) {
      logoUrlToUpdate = await uploadBrandAsset(logoFile, "brand-logos")
      if (existingLogoUrl) {
        await deleteBrandAsset(existingLogoUrl)
      }
    }

    await sql`
      UPDATE brand_kits
      SET 
        logo_url = COALESCE(${logoUrlToUpdate}, logo_url),
        primary_color_hex = COALESCE(${data.primary_color_hex}, primary_color_hex),
        secondary_colors_json_array = COALESCE(${JSON.stringify(data.secondary_colors_json_array)}, secondary_colors_json_array),
        font_family_main = COALESCE(${data.font_family_main}, font_family_main),
        font_family_secondary = COALESCE(${data.font_family_secondary}, font_family_secondary),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error) {
    console.error("Error updating brand kit:", error)
    throw new Error("Failed to update brand kit.")
  }
}

export async function createBrandKit(data: any, logoFile?: File) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create brand kit.")
    }

    const existingBrandKit = await sql`
      SELECT id FROM brand_kits WHERE restaurant_id = ${restaurantId}
    `
    if (existingBrandKit.length > 0) {
      throw new Error("A brand kit already exists for this restaurant. Please update it instead.")
    }

    let logoUrl: string | null = null
    if (logoFile) {
      logoUrl = await uploadBrandAsset(logoFile, "brand-logos")
    }

    await sql`
      INSERT INTO brand_kits (
        restaurant_id, logo_url, primary_color_hex, 
        secondary_colors_json_array, font_family_main, font_family_secondary
      )
      VALUES (
        ${restaurantId}, ${logoUrl}, ${data.primary_color_hex}, 
        ${JSON.stringify(data.secondary_colors_json_array || [])}, ${data.font_family_main}, ${data.font_family_secondary}
      )
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error) {
    console.error("Error creating brand kit:", error)
    throw new Error("Failed to create brand kit.")
  }
}
