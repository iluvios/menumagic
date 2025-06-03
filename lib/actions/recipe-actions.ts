"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import {
  getCategoriesByType as getCategoriesByTypeAction,
  createCategory as createCategoryAction,
} from "@/lib/actions/category-actions"
import { getRestaurantIdFromSession } from "@/lib/auth"

// Re-exporting getCategoriesByType from category-actions.ts
// This line itself is not a function, so it doesn't need to be async.
// The function it re-exports (getCategoriesByType) IS async in category-actions.ts.
export { getCategoriesByType } from "@/lib/actions/category-actions"

export async function getRecipes() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const result = await sql`
      SELECT 
        r.id, 
        r.sku, 
        r.name, 
        c.name as category, 
        r.status,
        r.cost,
        r.selling_price,
        r.margin_percentage,
        r.image_url,
        r.created_at::text,
        COUNT(ri.id)::int as ingredients_count,
        COALESCE(r.margin_percentage, 0) as cost_percentage
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      WHERE r.type = 'recipe' AND r.restaurant_id = ${restaurantId}
      GROUP BY r.id, c.name
      ORDER BY r.created_at DESC
    `

    return result || []
  } catch (error) {
    console.error("Error fetching recipes:", error)
    throw new Error("Failed to fetch recipes.")
  }
}

export async function getRecipeById(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return null
    }

    const result = await sql`
      SELECT 
        r.id, 
        r.sku, 
        r.name, 
        c.name as category, 
        r.status,
        r.cost,
        r.selling_price,
        r.margin_percentage,
        r.image_url,
        r.created_at::text,
        r.allergens,
        r.yield_amount as yield,
        (r.selling_price - r.cost) as margin,
        r.selling_price as suggested_price,
        r.preparation_instructions
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      WHERE r.id = ${id} AND r.restaurant_id = ${restaurantId}
    `

    if (!result || result.length === 0) {
      return null
    }

    // Get recipe ingredients
    const ingredientsResult = await sql`
      SELECT 
        i.id,
        i.sku,
        i.name,
        c.name as category,
        ri.quantity,
        ri.unit,
        i.cost_per_unit,
        (ri.quantity * i.cost_per_unit) as cost
      FROM recipe_ingredients ri
      JOIN ingredients i ON ri.ingredient_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      WHERE ri.recipe_id = ${id}
    `

    const recipe = result[0]
    recipe.ingredients = ingredientsResult || []
    recipe.total_cost = recipe.ingredients.reduce((sum: number, ing: any) => sum + Number.parseFloat(ing.cost || 0), 0)

    return recipe
  } catch (error) {
    console.error("Error fetching recipe:", error)
    throw new Error("Failed to fetch recipe.")
  }
}

export async function createRecipe(data: any) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create recipe.")
    }

    // Find or create category
    let categoryId
    if (data.category) {
      const categoryResult = await getCategoriesByTypeAction("recipe", restaurantId)
      const existingCategory = categoryResult.find((cat) => cat.name === data.category)

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const newCategoryResult = await createCategoryAction({
          name: data.category,
          type: "recipe",
          restaurant_id: restaurantId,
        })
        categoryId = newCategoryResult.id
      }
    }

    // Create recipe
    const result = await sql`
      INSERT INTO recipes (
        restaurant_id, sku, name, category_id, type, image_url, 
        status, cost, selling_price, margin_percentage,
        yield_amount, yield_unit, allergens, preparation_instructions
      )
      VALUES (
        ${restaurantId},
        ${data.sku || `R${Math.floor(Math.random() * 10000)}`}, 
        ${data.name}, 
        ${categoryId}, 
        'recipe', 
        ${data.image_url}, 
        ${data.status || "active"}, 
        ${data.cost || 0}, 
        ${data.selling_price || 0}, 
        ${data.margin_percentage || 0}, 
        ${data.yield_amount || 0}, 
        ${data.yield_unit || "portion"}, 
        ${data.allergens || []},
        ${data.preparation_instructions || null}
      )
      RETURNING id
    `

    const recipeId = result[0].id

    // Add ingredients if provided
    if (data.ingredients && data.ingredients.length > 0) {
      for (const ingredient of data.ingredients) {
        await sql`
          INSERT INTO recipe_ingredients (
            recipe_id, ingredient_id, quantity, unit
          )
          VALUES (${recipeId}, ${ingredient.id}, ${ingredient.quantity}, ${ingredient.unit})
        `
      }
    }

    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true, id: recipeId }
  } catch (error) {
    console.error("Error creating recipe:", error)
    throw new Error("Failed to create recipe.")
  }
}

export async function updateRecipe(id: number, data: any) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update recipe.")
    }

    // Find or create category if provided
    let categoryId
    if (data.category) {
      const categoryResult = await getCategoriesByTypeAction("recipe", restaurantId)
      const existingCategory = categoryResult.find((cat) => cat.name === data.category)

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        const newCategoryResult = await createCategoryAction({
          name: data.category,
          type: "recipe",
          restaurant_id: restaurantId,
        })
        categoryId = newCategoryResult.id
      }
    }

    // Update recipe
    await sql`
      UPDATE recipes
      SET 
        name = COALESCE(${data.name}, name),
        category_id = COALESCE(${categoryId}, category_id),
        image_url = COALESCE(${data.image_url}, image_url),
        status = COALESCE(${data.status}, status),
        cost = COALESCE(${data.cost}, cost),
        selling_price = COALESCE(${data.selling_price}, selling_price),
        margin_percentage = COALESCE(${data.margin_percentage}, margin_percentage),
        yield_amount = COALESCE(${data.yield_amount}, yield_amount),
        yield_unit = COALESCE(${data.yield_unit}, yield_unit),
        allergens = COALESCE(${data.allergens}, allergens),
        preparation_instructions = COALESCE(${data.preparation_instructions}, preparation_instructions),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `

    // Update ingredients if provided
    if (data.ingredients) {
      // First remove existing ingredients
      await sql`
        DELETE FROM recipe_ingredients
        WHERE recipe_id = ${id}
      `

      // Then add new ingredients
      for (const ingredient of data.ingredients) {
        await sql`
          INSERT INTO recipe_ingredients (
            recipe_id, ingredient_id, quantity, unit
          )
          VALUES (${id}, ${ingredient.id}, ${ingredient.quantity}, ${ingredient.unit})
        `
      }
    }

    revalidatePath(`/dashboard/operations-hub/recipes/${id}`)
    revalidatePath("/dashboard/operations-hub/recipes")
    return { success: true }
  } catch (error) {
    console.error("Error updating recipe:", error)
    throw new Error("Failed to update recipe")
  }
}

export async function deleteRecipe(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete recipe.")
    }

    // First delete recipe ingredients
    await sql`
      DELETE FROM recipe_ingredients
      WHERE recipe_id = ${id}
    `

    // Then delete the recipe
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
