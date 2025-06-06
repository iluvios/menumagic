"use server"

import { neon } from "@neondatabase/serverless"
import { unstable_noStore as noStore } from "next/cache"
import { revalidatePath } from "next/cache"
import { getRestaurantIdFromSession } from "@/lib/auth"

const sql = neon(process.env.DATABASE_URL!)

interface Ingredient {
  id: number
  name: string
  description?: string
  unit_of_measure: string // This is the base unit for the ingredient
  cost_per_unit: number
  category_id: number
  category_name?: string
  supplier_id?: number
  supplier_name?: string
  restaurant_id: number
  current_stock?: number // Added for inventory context
  low_stock_threshold?: number // Added for inventory context
  sku?: string
}

interface Category {
  id: number
  name: string
  type: string
}

export async function getIngredients(): Promise<Ingredient[]> {
  noStore()
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return []
    }

    const ingredients = await sql<Ingredient[]>`
      SELECT
        i.id,
        i.name,
        i.description,
        COALESCE(i.unit, 'unit') AS unit_of_measure,
        i.cost_per_unit,
        i.category_id,
        c.name AS category_name,
        s.name AS supplier_name,
        COALESCE(isl.current_quantity_in_storage_units, 0) AS current_stock,
        COALESCE(isl.low_stock_threshold_quantity, 0) AS low_stock_threshold,
        i.sku
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id AND isl.restaurant_id = ${restaurantId}
      WHERE i.restaurant_id = ${restaurantId}
      ORDER BY i.name ASC;
    `
    return ingredients
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch ingredients.")
  }
}

export async function getIngredientById(id: number): Promise<Ingredient | null> {
  noStore()
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      return null
    }

    const [ingredient] = await sql<Ingredient[]>`
      SELECT
        i.id,
        i.name,
        i.description,
        COALESCE(i.unit, 'unit') AS unit_of_measure,
        i.cost_per_unit,
        i.category_id,
        c.name AS category_name,
        s.name AS supplier_name,
        COALESCE(isl.current_quantity_in_storage_units, 0) AS current_stock,
        COALESCE(isl.low_stock_threshold_quantity, 0) AS low_stock_threshold,
        i.sku
      FROM ingredients i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id AND isl.restaurant_id = ${restaurantId}
      WHERE i.id = ${id} AND i.restaurant_id = ${restaurantId};
    `
    return ingredient || null
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch ingredient by ID.")
  }
}

export async function createIngredient(data: {
  name: string
  description?: string
  unit_of_measure: string
  cost_per_unit: number
  category_id: number
  supplier_id?: number
}) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to create ingredient.")
    }

    const [newIngredient] = await sql<Ingredient[]>`
      INSERT INTO ingredients (name, description, unit, cost_per_unit, category_id, supplier_id, restaurant_id, sku)
      VALUES (
        ${data.name}, 
        ${data.description || ""}, 
        ${data.unit_of_measure}, 
        ${data.cost_per_unit}, 
        ${data.category_id}, 
        ${data.supplier_id || null}, 
        ${restaurantId},
        ''
      )
      RETURNING id, name, description, unit, cost_per_unit, category_id, supplier_id, restaurant_id, sku;
    `

    // Initialize inventory stock level for the new ingredient
    await sql`
      INSERT INTO inventory_stock_levels (restaurant_id, ingredient_id, storage_unit, current_quantity_in_storage_units, low_stock_threshold_quantity, cost_per_storage_unit)
      VALUES (${restaurantId}, ${newIngredient.id}, ${data.unit_of_measure}, 0, 0, ${data.cost_per_unit})
      ON CONFLICT (restaurant_id, ingredient_id) DO NOTHING;
    `

    revalidatePath("/dashboard/operations-hub/ingredients")
    revalidatePath("/dashboard/operations-hub/inventory")
    return newIngredient
  } catch (error: any) {
    console.error("Database Error:", error)
    if (error.message?.includes("unique_ingredient_name_per_restaurant")) {
      throw new Error(`Ya existe un ingrediente con el nombre "${data.name}".`)
    }
    throw new Error("Failed to create ingredient.")
  }
}

export async function updateIngredient(
  id: number,
  data: {
    name?: string
    description?: string
    unit_of_measure?: string
    cost_per_unit?: number
    category_id?: number
    supplier_id?: number
  },
) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to update ingredient.")
    }

    const [updatedIngredient] = await sql<Ingredient[]>`
      UPDATE ingredients
      SET
        name = COALESCE(${data.name}, name),
        description = COALESCE(${data.description}, description),
        unit = COALESCE(${data.unit_of_measure}, unit),
        cost_per_unit = COALESCE(${data.cost_per_unit}, cost_per_unit),
        category_id = COALESCE(${data.category_id}, category_id),
        supplier_id = COALESCE(${data.supplier_id}, supplier_id),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id} AND restaurant_id = ${restaurantId}
      RETURNING id, name, description, unit, cost_per_unit, category_id, supplier_id, restaurant_id, sku;
    `
    if (!updatedIngredient) {
      throw new Error("Ingredient not found or does not belong to this restaurant.")
    }

    // If unit of measure or cost per unit changed, update in inventory_stock_levels as well
    if (data.unit_of_measure || data.cost_per_unit) {
      await sql`
        UPDATE inventory_stock_levels
        SET
          storage_unit = COALESCE(${data.unit_of_measure}, storage_unit),
          cost_per_storage_unit = COALESCE(${data.cost_per_unit}, cost_per_storage_unit)
        WHERE ingredient_id = ${id} AND restaurant_id = ${restaurantId};
      `
    }

    revalidatePath("/dashboard/operations-hub/ingredients")
    revalidatePath("/dashboard/operations-hub/inventory")
    return updatedIngredient
  } catch (error: any) {
    console.error("Database Error:", error)
    if (error.message?.includes("unique_ingredient_name_per_restaurant")) {
      throw new Error(`Ya existe un ingrediente con el nombre "${data.name}".`)
    }
    throw new Error("Failed to update ingredient.")
  }
}

export async function deleteIngredient(id: number) {
  try {
    const restaurantId = await getRestaurantIdFromSession()
    if (!restaurantId) {
      console.error("No restaurant ID found for session.")
      throw new Error("Authentication required to delete ingredient.")
    }

    // Delete associated inventory stock level first
    await sql`
      DELETE FROM inventory_stock_levels
      WHERE ingredient_id = ${id} AND restaurant_id = ${restaurantId};
    `

    const result = await sql`
      DELETE FROM ingredients
      WHERE id = ${id} AND restaurant_id = ${restaurantId};
    `
    if (result.count === 0) {
      throw new Error("Ingredient not found or does not belong to this restaurant.")
    }

    revalidatePath("/dashboard/operations-hub/ingredients")
    revalidatePath("/dashboard/operations-hub/inventory")
    return { success: true }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete ingredient.")
  }
}
