"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { put, del } from "@vercel/blob"

// Type definition for BrandAsset
export interface BrandAsset {
  id: number
  restaurant_id: number
  asset_name: string
  asset_url: string
  asset_type: string
  created_at: Date
  updated_at: Date
}

// Helper to upload image to Vercel Blob
export async function uploadBrandAsset(file: File | undefined | null, folder: string) {
  if (!file) return null // No file provided, return null
  if (file.size === 0) return null // Empty file, return null

  const filename = `${folder}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const { url } = await put(filename, file, { access: "public" })
  return url
}

// Helper to delete image from Vercel Blob
export async function deleteBrandAsset(url: string | undefined | null) {
  if (!url) return
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting blob:", error)
    // Don't throw, just log, as it shouldn't block the main operation
  }
}

// --- Brand Kit Actions ---

// Modified to accept restaurantId for public access and return assets
export async function getBrandKit(restaurantId?: number) {
  let targetRestaurantId = restaurantId
  if (!targetRestaurantId) {
    // If no restaurantId is provided, try to get it from session (for dashboard use)
    const sessionRestaurantId = await getRestaurantIdFromSession()
    if (sessionRestaurantId) {
      targetRestaurantId = sessionRestaurantId
    }
  }

  if (!targetRestaurantId) {
    console.warn("No restaurant ID provided or found in session for getBrandKit.")
    return { brandKit: null, assets: [] } // Return empty assets array
  }

  try {
    const brandKitResult = await sql`
      SELECT
        id, restaurant_id, logo_url, primary_color_hex,
        secondary_colors_json_array, font_family_main, font_family_secondary
      FROM brand_kits
      WHERE restaurant_id = ${targetRestaurantId}
    `
    const assetsResult = await sql`
      SELECT
        id, restaurant_id, asset_name, asset_url, asset_type, created_at, updated_at
      FROM brand_assets
      WHERE restaurant_id = ${targetRestaurantId}
      ORDER BY created_at DESC
    `
    return {
      brandKit: brandKitResult[0] || null,
      assets: assetsResult as BrandAsset[], // Cast to BrandAsset[]
    }
  } catch (error) {
    console.error("Error fetching brand kit and assets:", error)
    return { brandKit: null, assets: [] }
  }
}

export async function updateBrandKit(id: number, data: any, logoFile?: File | null) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update brand kit.")
    }

    // Verify brand kit belongs to the restaurant
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
      // Explicitly set to null (user removed logo)
      logoUrlToUpdate = null
      if (existingLogoUrl) {
        await deleteBrandAsset(existingLogoUrl) // Use renamed function
      }
    } else if (logoFile instanceof File) {
      // New file provided (user uploaded new logo)
      logoUrlToUpdate = await uploadBrandAsset(logoFile, "brand-logos") // Use renamed function
      if (existingLogoUrl) {
        await deleteBrandAsset(existingLogoUrl) // Delete old logo
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
  } catch (error: any) {
    console.error("Error updating brand kit:", error)
    return { success: false, error: error.message || "Failed to update brand kit." }
  }
}

export async function createBrandKit(data: any, logoFile?: File) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create brand kit.")
    }

    // Check if a brand kit already exists for this restaurant
    const existingBrandKit = await sql`
      SELECT id FROM brand_kits WHERE restaurant_id = ${restaurantId}
    `
    if (existingBrandKit.length > 0) {
      throw new Error("A brand kit already exists for this restaurant. Please update it instead.")
    }

    let logoUrl: string | null = null
    if (logoFile) {
      logoUrl = await uploadBrandAsset(logoFile, "brand-logos") // Use renamed function
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
  } catch (error: any) {
    console.error("Error creating brand kit:", error)
    return { success: false, error: error.message || "Failed to create brand kit." }
  }
}

export async function uploadLogo(file: File) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) {
    throw new Error("Authentication required to upload logo.")
  }
  const logoUrl = await uploadBrandAsset(file, "brand-logos")
  // You might want to update the brand_kits table here with the new logo_url
  // For now, just return the URL
  return { url: logoUrl }
}

export async function uploadFavicon(file: File) {
  const restaurantId = await getRestaurantIdFromSession()
  if (!restaurantId) {
    throw new Error("Authentication required to upload favicon.")
  }
  const faviconUrl = await uploadBrandAsset(file, "brand-favicons")
  // You might want to update the brand_kits table here with the new favicon_url
  // For now, just return the URL
  return { url: faviconUrl }
}

// New action: createBrandAssetRecord
export async function createBrandAssetRecord(file: File, assetType: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to upload brand asset.")
    }

    const assetUrl = await uploadBrandAsset(file, `brand-assets/${restaurantId}`) // Store in restaurant-specific folder

    if (!assetUrl) {
      throw new Error("Failed to upload asset to storage.")
    }

    await sql`
      INSERT INTO brand_assets (restaurant_id, asset_name, asset_url, asset_type)
      VALUES (${restaurantId}, ${file.name}, ${assetUrl}, ${assetType})
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true, url: assetUrl }
  } catch (error: any) {
    console.error("Error creating brand asset record:", error)
    return { success: false, error: error.message || "Failed to upload and record brand asset." }
  }
}

// New action: deleteBrandAssetRecord
export async function deleteBrandAssetRecord(assetId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to delete brand asset.")
    }

    // Fetch asset URL from DB to delete from blob storage
    const assetToDelete = await sql`
      SELECT asset_url FROM brand_assets WHERE id = ${assetId} AND restaurant_id = ${restaurantId}
    `
    if (assetToDelete.length === 0) {
      throw new Error("Asset not found or does not belong to this restaurant.")
    }

    const assetUrl = assetToDelete[0].asset_url
    await deleteBrandAsset(assetUrl) // Delete from blob storage

    await sql`
      DELETE FROM brand_assets WHERE id = ${assetId} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/menu-studio/brand-kit")
    return { success: true }
  } catch (error: any) {
    console.error("Error deleting brand asset record:", error)
    return { success: false, error: error.message || "Failed to delete brand asset." }
  }
}
