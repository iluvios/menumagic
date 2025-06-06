"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

interface MenuItemIngredient {
  id: number
  menu_item_id: number
  ingredient_id: number
  ingredient_name: string
  quantity_used: number
  unit_used: string
  cost_per_unit: number
  total_cost: number
  ingredient_base_unit: string
}

interface Ingredient {
  id: number
  name: string
  unit: string
  current_stock?: number
}

interface Dish {
  id: number
  name: string
  description: string
  price: number
  category_id: number | null
  category_name: string | null
  image_url: string | null
  is_available: boolean
  digital_menu_id: number
  restaurant_id: number
}

// Get all dishes (using dishes table as single source of truth)
export async function getAllDishes() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const dishes = await sql`
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        d.price, 
        d.menu_category_id, 
        c.name as category_name,
        d.image_url
      FROM dishes d
      LEFT JOIN categories c ON d.menu_category_id = c.id
      WHERE d.restaurant_id = ${restaurantId}
      ORDER BY d.name ASC
    `
    return dishes
  } catch (error) {
    console.error("Error fetching dishes:", error)
    throw new Error("Failed to fetch dishes")
  }
}

// Get a single dish by ID
export async function getDishById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const [dish] = await sql`
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        d.price, 
        d.menu_category_id, 
        c.name as category_name,
        d.image_url
      FROM dishes d
      LEFT JOIN categories c ON d.menu_category_id = c.id
      WHERE d.id = ${id} AND d.restaurant_id = ${restaurantId}
    `
    return dish
  } catch (error) {
    console.error(`Error fetching dish with ID ${id}:`, error)
    throw new Error("Failed to fetch dish")
  }
}

// Create a new dish
export async function createDish(data: {
  name: string
  description: string
  price: number
  menu_category_id: number
  image_url?: string
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const [newDish] = await sql`
      INSERT INTO dishes (
        name, 
        description, 
        price, 
        menu_category_id, 
        image_url, 
        restaurant_id
      )
      VALUES (
        ${data.name}, 
        ${data.description}, 
        ${data.price}, 
        ${data.menu_category_id}, 
        ${data.image_url || null}, 
        ${restaurantId}
      )
      RETURNING id, name, description, price, menu_category_id, image_url
    `

    revalidatePath("/dashboard/operations-hub/recipes")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return newDish
  } catch (error) {
    console.error("Error creating dish:", error)
    throw new Error("Failed to create dish")
  }
}

// Update an existing dish
export async function updateDish(
  id: number,
  data: {
    name?: string
    description?: string
    price?: number
    menu_category_id?: number
    image_url?: string | null
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const [updatedDish] = await sql`
      UPDATE dishes
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        price = COALESCE(${data.price}, price),
        menu_category_id = COALESCE(${data.menu_category_id}, menu_category_id),
        image_url = COALESCE(${data.image_url}, image_url),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, description, price, menu_category_id, image_url
    `

    revalidatePath("/dashboard/operations-hub/recipes")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return updatedDish
  } catch (error) {
    console.error(`Error updating dish with ID ${id}:`, error)
    throw new Error("Failed to update dish")
  }
}

// Delete a dish
export async function deleteDish(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    // First delete any ingredients associated with this dish
    await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${id}`

    // Then delete the dish itself
    await sql`DELETE FROM dishes WHERE id = ${id} AND restaurant_id = ${restaurantId}`

    revalidatePath("/dashboard/operations-hub/recipes")
    revalidatePath("/dashboard/menu-studio/digital-menu")
    return { success: true }
  } catch (error) {
    console.error(`Error deleting dish with ID ${id}:`, error)
    throw new Error("Failed to delete dish")
  }
}

// Get ingredients for a dish
export async function getIngredientsForDish(dishId: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const ingredients = await sql`
      SELECT 
        mii.id,
        mii.menu_item_id,
        mii.ingredient_id,
        mii.quantity_used as quantity,
        mii.unit_used as unit,
        i.name as ingredient_name,
        i.unit as ingredient_unit
      FROM menu_item_ingredients mii
      JOIN ingredients i ON mii.ingredient_id = i.id
      JOIN dishes d ON mii.menu_item_id = d.id
      WHERE mii.menu_item_id = ${dishId}
      AND d.restaurant_id = ${restaurantId}
    `
    return ingredients
  } catch (error) {
    console.error(`Error fetching ingredients for dish ${dishId}:`, error)
    throw new Error("Failed to fetch ingredients for dish")
  }
}

// Get all ingredients (for dropdown selection)
export async function getAllIngredients() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const ingredients = await sql`
      SELECT 
        id, 
        name, 
        unit,
        category_id
      FROM ingredients
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name ASC
    `
    return ingredients
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    throw new Error("Failed to fetch ingredients")
  }
}

// Update ingredients for a dish
export async function updateDishIngredients(dishId: number, ingredients: any[]) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    // Verify the dish belongs to this restaurant
    const dishCheck = await sql`
      SELECT id FROM dishes WHERE id = ${dishId} AND restaurant_id = ${restaurantId}
    `
    if (dishCheck.length === 0) {
      throw new Error("Dish not found or does not belong to this restaurant")
    }

    // Delete existing ingredients
    await sql`DELETE FROM menu_item_ingredients WHERE menu_item_id = ${dishId}`

    // Insert new ingredients
    if (ingredients && ingredients.length > 0) {
      for (const ingredient of ingredients) {
        await sql`
          INSERT INTO menu_item_ingredients (
            menu_item_id, 
            ingredient_id, 
            quantity_used, 
            unit_used
          )
          VALUES (
            ${dishId}, 
            ${ingredient.ingredient_id}, 
            ${ingredient.quantity}, 
            ${ingredient.unit}
          )
        `
      }
    }

    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true }
  } catch (error) {
    console.error(`Error updating ingredients for dish ${dishId}:`, error)
    throw new Error("Failed to update dish ingredients")
  }
}

// Get categories
export async function getCategoriesByType(type: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }
    const result = await sql`
      SELECT id, name FROM categories
      WHERE restaurant_id = ${restaurantId} AND type = ${type}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error(`Error fetching categories of type ${type}:`, error)
    return []
  }
}

// Get digital menus for the dropdown
export async function getDigitalMenus() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }
    const result = await sql`
      SELECT id, name FROM digital_menus
      WHERE restaurant_id = ${restaurantId}
      ORDER BY name ASC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching digital menus:", error)
    return []
  }
}

// Add getRecipes function
export async function getRecipes() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }

    const recipes = await sql`
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        d.price, 
        d.menu_category_id, 
        c.name as category_name,
        d.image_url
      FROM dishes d
      LEFT JOIN categories c ON d.menu_category_id = c.id
      WHERE d.restaurant_id = ${restaurantId}
      ORDER BY d.name ASC
    `
    return recipes || []
  } catch (error) {
    console.error("Error fetching recipes:", error)
    return []
  }
}

// Add getReusableMenuItemsForRecipesPage function (alias to getAllDishes)
export const getReusableMenuItemsForRecipesPage = getAllDishes

// Add getRecipeById function
export async function getRecipeById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required")
    }

    const [recipe] = await sql`
      SELECT 
        d.id, 
        d.name, 
        d.description, 
        d.price, 
        d.menu_category_id, 
        c.name as category_name,
        d.image_url
      FROM dishes d
      LEFT JOIN categories c ON d.menu_category_id = c.id
      WHERE d.id = ${id} AND d.restaurant_id = ${restaurantId}
    `
    return recipe
  } catch (error) {
    console.error(`Error fetching recipe with ID ${id}:`, error)
    throw new Error("Failed to fetch recipe")
  }
}

// Alias functions for the dialog component
export const getIngredientsForReusableDish = getIngredientsForDish
