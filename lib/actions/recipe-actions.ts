"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { getReusableMenuItems } from "./reusable-menu-item-actions" // Corrected import path

interface Recipe {
  id: number
  name: string
  description: string
  instructions: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  category_id: number
  category_name?: string
  cost_per_serving?: number
}

interface ReusableDishIngredient {
  id: number
  reusable_menu_item_id: number
  ingredient_id: number
  ingredient_name: string
  quantity_used: number
  unit_used: string
  cost_per_unit: number
  total_cost: number
  ingredient_base_unit: string
}

// Legacy recipe functions (keeping for backward compatibility)
export async function getRecipes() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }
    const result = await sql`
      SELECT r.id, r.name, r.description, r.instructions, r.prep_time_minutes, r.cook_time_minutes, r.servings, r.category_id, c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.restaurant_id = ${restaurantId}
      ORDER BY r.created_at DESC
    `
    return result || []
  } catch (error) {
    console.error("Error fetching recipes:", error)
    throw new Error("Failed to fetch recipes.")
  }
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return null
    }
    const result = await sql`
      SELECT r.id, r.name, r.description, r.instructions, r.prep_time_minutes, r.cook_time_minutes, r.servings, r.category_id, c.name as category_name
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ${id} AND r.restaurant_id = ${restaurantId}
    `
    return result[0] || null
  } catch (error) {
    console.error(`Error fetching recipe with ID ${id}:`, error)
    throw new Error("Failed to fetch recipe.")
  }
}

export async function createRecipe(data: Omit<Recipe, "id" | "category_name" | "cost_per_serving">) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create recipe.")
    }
    const result = await sql`
      INSERT INTO recipes (name, description, instructions, prep_time_minutes, cook_time_minutes, servings, category_id, restaurant_id)
      VALUES (${data.name}, ${data.description}, ${data.instructions}, ${data.prep_time_minutes}, ${data.cook_time_minutes}, ${data.servings}, ${data.category_id}, ${restaurantId})
      RETURNING id, name
    `
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw new Error("Failed to create recipe.")
  }
}

export async function updateRecipe(
  id: number,
  data: Partial<Omit<Recipe, "id" | "category_name" | "cost_per_serving">>,
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update recipe.")
    }
    const result = await sql`
      UPDATE recipes
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        instructions = COALESCE(${data.instructions}, instructions),
        prep_time_minutes = COALESCE(${data.prep_time_minutes}, prep_time_minutes),
        cook_time_minutes = COALESCE(${data.cook_time_minutes}, cook_time_minutes),
        servings = COALESCE(${data.servings}, servings),
        category_id = COALESCE(${data.category_id}, category_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name
    `
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error) {
    console.error("Error updating recipe:", error)
    throw new Error("Failed to update recipe.")
  }
}

export async function deleteRecipe(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to delete recipe.")
    }
    await sql`
      DELETE FROM recipes
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `
    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true }
  } catch (error) {
    console.error("Error deleting recipe:", error)
    throw new Error("Failed to delete recipe.")
  }
}

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
    throw new Error("Failed to fetch categories.")
  }
}

// REUSABLE MENU ITEMS (GLOBAL DISHES) FUNCTIONS
export async function getReusableMenuItemsForRecipesPage() {
  return getReusableMenuItems()
}

// REUSABLE DISH INGREDIENTS FUNCTIONS
export async function getIngredientsForReusableDish(reusableMenuItemId: number): Promise<ReusableDishIngredient[]> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }

    // Verify the reusable menu item belongs to the restaurant
    const itemCheck = await sql`
      SELECT id FROM reusable_menu_items WHERE id = ${reusableMenuItemId} AND restaurant_id = ${restaurantId}
    `
    if (itemCheck.length === 0) {
      throw new Error("Platillo no encontrado o no pertenece a este restaurante.")
    }

    const result = await sql`
      SELECT
        rdi.id,
        rdi.reusable_menu_item_id,
        rdi.ingredient_id,
        i.name as ingredient_name,
        rdi.quantity_used,
        rdi.unit_used,
        i.unit_of_measure as ingredient_base_unit,
        COALESCE(isl.cost_per_storage_unit, 0) as cost_per_unit,
        (rdi.quantity_used * COALESCE(isl.cost_per_storage_unit, 0)) as total_cost
      FROM reusable_dish_ingredients rdi
      JOIN ingredients i ON rdi.ingredient_id = i.id
      LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id AND isl.restaurant_id = ${restaurantId}
      WHERE rdi.reusable_menu_item_id = ${reusableMenuItemId}
      ORDER BY i.name ASC
    `
    return result || []
  } catch (error) {
    console.error(`Error fetching ingredients for reusable dish ${reusableMenuItemId}:`, error)
    throw new Error("No se pudieron obtener los ingredientes para este platillo.")
  }
}

export async function addReusableDishIngredient(data: {
  reusable_menu_item_id: number
  ingredient_id: number
  quantity_used: number
  unit_used: string
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Se requiere autenticación para añadir ingredientes.")
    }

    // Verify the reusable menu item belongs to this restaurant
    const menuItemCheck = await sql`
      SELECT id FROM reusable_menu_items 
      WHERE id = ${data.reusable_menu_item_id} AND restaurant_id = ${restaurantId}
    `
    if (menuItemCheck.length === 0) {
      throw new Error("Platillo no encontrado o no pertenece a este restaurante.")
    }

    // Verify the ingredient belongs to this restaurant
    const ingredientCheck = await sql`
      SELECT id FROM ingredients 
      WHERE id = ${data.ingredient_id} AND restaurant_id = ${restaurantId}
    `
    if (ingredientCheck.length === 0) {
      throw new Error("Ingrediente no encontrado o no pertenece a este restaurante.")
    }

    // Check if this ingredient is already in the recipe
    const existingCheck = await sql`
      SELECT id FROM reusable_dish_ingredients 
      WHERE reusable_menu_item_id = ${data.reusable_menu_item_id} AND ingredient_id = ${data.ingredient_id}
    `
    if (existingCheck.length > 0) {
      throw new Error("Este ingrediente ya está en la receta. Actualiza la cantidad en lugar de añadirlo de nuevo.")
    }

    const result = await sql`
      INSERT INTO reusable_dish_ingredients (
        reusable_menu_item_id, ingredient_id, quantity_used, unit_used
      )
      VALUES (
        ${data.reusable_menu_item_id}, ${data.ingredient_id}, ${data.quantity_used}, ${data.unit_used}
      )
      RETURNING id
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error: any) {
    console.error("Error adding ingredient to reusable dish:", error)
    throw error
  }
}

export async function updateReusableDishIngredient(
  id: number,
  data: {
    quantity_used?: number
    unit_used?: string
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Se requiere autenticación para actualizar ingredientes.")
    }

    // Verify the dish ingredient belongs to a reusable menu item owned by this restaurant
    const linkCheck = await sql`
      SELECT rdi.id 
      FROM reusable_dish_ingredients rdi
      JOIN reusable_menu_items rmi ON rdi.reusable_menu_item_id = rmi.id
      WHERE rdi.id = ${id} AND rmi.restaurant_id = ${restaurantId}
    `
    if (linkCheck.length === 0) {
      throw new Error("Ingrediente no encontrado o no pertenece a este restaurante.")
    }

    const result = await sql`
      UPDATE reusable_dish_ingredients
      SET 
        quantity_used = COALESCE(${data.quantity_used}, quantity_used),
        unit_used = COALESCE(${data.unit_used}, unit_used),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING id
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/operations-hub/recipes")
    return result[0]
  } catch (error) {
    console.error(`Error updating reusable dish ingredient ${id}:`, error)
    throw error
  }
}

export async function removeReusableDishIngredient(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Se requiere autenticación para eliminar ingredientes.")
    }

    // Verify the dish ingredient belongs to a reusable menu item owned by this restaurant
    const linkCheck = await sql`
      SELECT rdi.id 
      FROM reusable_dish_ingredients rdi
      JOIN reusable_menu_items rmi ON rdi.reusable_menu_item_id = rmi.id
      WHERE rdi.id = ${id} AND rmi.restaurant_id = ${restaurantId}
    `
    if (linkCheck.length === 0) {
      throw new Error("Ingrediente no encontrado o no pertenece a este restaurante.")
    }

    await sql`
      DELETE FROM reusable_dish_ingredients
      WHERE id = ${id}
    `
    revalidatePath("/dashboard/menu-studio/digital-menu")
    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true }
  } catch (error) {
    console.error(`Error removing ingredient from reusable dish (ID: ${id}):`, error)
    throw error
  }
}
