"use server"

import { sql } from "@vercel/postgres"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"
import { getReusableMenuItems } from "./reusable-menu-item-actions" // Corrected import path

interface Recipe {
  id: number
  name: string
  description: string
  category_id: number
  category_name?: string
}

interface RecipeIngredient {
  id: number
  recipe_id: number
  ingredient_id: number
  ingredient_name: string
  quantity: number
  unit: string
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
export async function getRecipes(): Promise<Recipe[]> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }
    const { rows } = await sql<Recipe>`
      SELECT
        r.id,
        r.name,
        r.description,
        r.category_id,
        gc.name AS category_name
      FROM recipes r
      JOIN global_categories gc ON r.category_id = gc.id
      WHERE r.restaurant_id = ${restaurantId}
      ORDER BY r.created_at DESC;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch recipes.")
  }
}

export async function getRecipeById(id: number): Promise<Recipe | null> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return null
    }
    const { rows } = await sql<Recipe>`
      SELECT
        r.id,
        r.name,
        r.description,
        r.category_id,
        gc.name AS category_name
      FROM recipes r
      JOIN global_categories gc ON r.category_id = gc.id
      WHERE r.id = ${id} AND r.restaurant_id = ${restaurantId};
    `
    return rows[0] || null
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error(`Failed to fetch recipe with ID ${id}.`)
  }
}

export async function getIngredientsForRecipe(recipeId: number): Promise<RecipeIngredient[]> {
  try {
    const { rows } = await sql<RecipeIngredient>`
      SELECT
        ri.id,
        ri.recipe_id,
        ri.ingredient_id,
        i.name AS ingredient_name,
        ri.quantity,
        ri.unit
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      WHERE ri.recipe_id = ${recipeId}
      ORDER BY i.name;
    `
    return rows
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch ingredients for recipe.")
  }
}

export async function createRecipe(
  recipeData: {
    name: string
    description: string
    category_id: number
  },
  ingredients: { ingredient_id: number; quantity: number; unit: string }[],
): Promise<Recipe> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to create recipe.")
    }
    const { rows } = await sql.begin(async (db) => {
      const { rows: recipeRows } = await db<Recipe>`
        INSERT INTO recipes (name, description, category_id, restaurant_id)
        VALUES (${recipeData.name}, ${recipeData.description}, ${recipeData.category_id}, ${restaurantId})
        RETURNING id, name, description, category_id;
      `
      const newRecipeId = recipeRows[0].id

      for (const ingredient of ingredients) {
        await db`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
          VALUES (${newRecipeId}, ${ingredient.ingredient_id}, ${ingredient.quantity}, ${ingredient.unit});
        `
      }
      return recipeRows
    })

    revalidatePath("/dashboard/operations-hub/recipes")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create recipe.")
  }
}

export async function updateRecipe(
  id: number,
  recipeData: {
    name?: string
    description?: string
    category_id?: number
  },
  ingredients: { ingredient_id: number; quantity: number; unit: string }[],
): Promise<Recipe> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to update recipe.")
    }
    const { rows } = await sql.begin(async (db) => {
      const fields = []
      const values = []
      let paramIndex = 1

      if (recipeData.name !== undefined) {
        fields.push(`name = $${paramIndex++}`)
        values.push(recipeData.name)
      }
      if (recipeData.description !== undefined) {
        fields.push(`description = $${paramIndex++}`)
        values.push(recipeData.description)
      }
      if (recipeData.category_id !== undefined) {
        fields.push(`category_id = $${paramIndex++}`)
        values.push(recipeData.category_id)
      }

      if (fields.length > 0) {
        values.push(id) // Add the ID for the WHERE clause
        const query = `
          UPDATE recipes
          SET ${fields.join(", ")}
          WHERE id = $${paramIndex} AND restaurant_id = ${restaurantId}
          RETURNING id, name, description, category_id;
        `
        await db.query(query, values)
      }

      // Update ingredients: delete existing and insert new ones
      await db`DELETE FROM recipe_ingredients WHERE recipe_id = ${id};`
      for (const ingredient of ingredients) {
        await db`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit)
          VALUES (${id}, ${ingredient.ingredient_id}, ${ingredient.quantity}, ${ingredient.unit});
        `
      }

      const { rows: updatedRecipeRows } = await db<Recipe>`
        SELECT id, name, description, category_id FROM recipes WHERE id = ${id} AND restaurant_id = ${restaurantId};
      `
      return updatedRecipeRows
    })

    if (rows.length === 0) {
      throw new Error(`Recipe with ID ${id} not found.`)
    }

    revalidatePath("/dashboard/operations-hub/recipes")
    return rows[0]
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update recipe.")
  }
}

export async function deleteRecipe(id: number): Promise<void> {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      throw new Error("Authentication required to delete recipe.")
    }
    await sql.begin(async (db) => {
      await db`DELETE FROM recipe_ingredients WHERE recipe_id = ${id};`
      await db`DELETE FROM recipes WHERE id = ${id} AND restaurant_id = ${restaurantId};`
    })
    revalidatePath("/dashboard/operations-hub/recipes")
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete recipe.")
  }
}

export async function getCategoriesByType(type: string) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      return []
    }
    const { rows } = await sql`
      SELECT id, name FROM categories
      WHERE restaurant_id = ${restaurantId} AND type = ${type}
      ORDER BY name ASC
    `
    return rows || []
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

    const { rows } = await sql<ReusableDishIngredient>`
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
    return rows || []
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

    const { rows } = await sql`
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
    return rows[0]
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

    const { rows } = await sql`
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
    return rows[0]
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
