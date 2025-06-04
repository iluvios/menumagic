"use server"

import { neon } from "@neondatabase/serverless"
import { unstable_noStore as noStore } from "next/cache"

const sql = neon(process.env.DATABASE_URL!)

interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

interface CategoryUpdate {
  id: number
  order_index: number
}

// New function to get all categories (if needed by other parts of the app)
export async function getCategories(): Promise<Category[]> {
  noStore()
  try {
    const categories = await sql<Category[]>`
      SELECT id, name, type, order_index
      FROM categories
      ORDER BY order_index ASC, name ASC;
    `
    return categories
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch all categories.")
  }
}

export async function getCategoriesByType(type: string): Promise<Category[]> {
  noStore()
  try {
    const categories = await sql<Category[]>`
      SELECT id, name, type, order_index
      FROM categories
      WHERE type = ${type}
      ORDER BY order_index ASC, name ASC;
    `
    return categories
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to fetch categories by type.")
  }
}

export async function createCategory(name: string, type: string): Promise<Category> {
  try {
    const maxOrderResult = await sql<{ max_order: number }[]>`
      SELECT COALESCE(MAX(order_index), 0) as max_order
      FROM categories
      WHERE type = ${type};
    `
    const nextOrderIndex = maxOrderResult[0].max_order + 1

    const [newCategory] = await sql<Category[]>`
      INSERT INTO categories (name, type, order_index)
      VALUES (${name}, ${type}, ${nextOrderIndex})
      RETURNING id, name, type, order_index;
    `
    return newCategory
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to create category.")
  }
}

export async function updateCategory(id: number, name: string): Promise<Category> {
  try {
    const [updatedCategory] = await sql<Category[]>`
      UPDATE categories
      SET name = ${name}
      WHERE id = ${id}
      RETURNING id, name, type, order_index;
    `
    return updatedCategory
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update category.")
  }
}

export async function deleteCategory(id: number): Promise<void> {
  try {
    await sql`
      DELETE FROM categories
      WHERE id = ${id};
    `
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to delete category.")
  }
}

export async function updateCategoryOrder(updates: CategoryUpdate[]): Promise<void> {
  try {
    for (const update of updates) {
      await sql`
        UPDATE categories
        SET order_index = ${update.order_index}
        WHERE id = ${update.id};
      `
    }
  } catch (error) {
    console.error("Database Error:", error)
    throw new Error("Failed to update category order.")
  }
}
