"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

export async function getCostAnalysis() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return { recipes: [], ingredients: [], summary: {} }
    }

    // Get recipe costs
    const recipeCosts = await sql`
      SELECT 
        r.id,
        r.name,
        r.sku,
        c.name as category,
        r.cost,
        r.selling_price,
        r.margin_percentage,
        (r.selling_price - r.cost) as profit,
        COUNT(ri.id)::int as ingredients_count
      FROM recipes r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON r.id = ri.recipe_id
      WHERE r.type = 'recipe' AND r.restaurant_id = ${restaurantId}
      GROUP BY r.id, c.name
      ORDER BY r.margin_percentage DESC
    `

    // Get ingredient costs
    const ingredientCosts = await sql`
      SELECT 
        i.id,
        i.name,
        i.sku,
        c.name as category,
        i.cost_per_unit,
        i.unit,
        COUNT(ri.id)::int as used_in_recipes
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      GROUP BY i.id, c.name
      ORDER BY i.cost_per_unit DESC
    `

    // Get cost summary
    const costSummary = await sql`
      SELECT 
        COUNT(DISTINCT r.id)::int as total_recipes,
        COUNT(DISTINCT i.id)::int as total_ingredients,
        AVG(r.cost)::numeric(10,2) as avg_recipe_cost,
        AVG(r.margin_percentage)::numeric(5,2) as avg_margin,
        SUM(r.cost)::numeric(10,2) as total_recipe_costs
      FROM recipes r
      CROSS JOIN ingredients i
      WHERE r.type = 'recipe'
    `

    return {
      recipes: recipeCosts || [],
      ingredients: ingredientCosts || [],
      summary: costSummary[0] || {},
    }
  } catch (error) {
    console.error("Error fetching cost analysis:", error)
    return {
      recipes: [],
      ingredients: [],
      summary: {},
    }
  }
}

export async function getRecipeCosts() {
  const { recipes } = await getCostAnalysis()
  return recipes
}

export async function getIngredients() {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const result = await sql`
      SELECT 
        i.id,
        i.sku,
        i.name,
        c.name as category,
        i.unit,
        i.cost_per_unit,
        s.name as supplier_name,
        COUNT(ri.id)::int as used_in_recipes
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN recipe_ingredients ri ON i.id = ri.ingredient_id
      WHERE i.restaurant_id = ${restaurantId}
      GROUP BY i.id, c.name, s.name
      ORDER BY i.name
    `

    return result || []
  } catch (error) {
    console.error("Error fetching ingredients:", error)
    return []
  }
}

export async function updateIngredientCost(id: number, cost: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return { success: false, error: "Authentication required." }
    }

    await sql`
      UPDATE ingredients
      SET cost_per_unit = ${cost}, updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
    `

    revalidatePath("/dashboard/costs")
    return { success: true }
  } catch (error) {
    console.error("Error updating ingredient cost:", error)
    return { success: false, error: "Failed to update ingredient cost" }
  }
}
