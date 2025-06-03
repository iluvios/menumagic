"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getSuppliers() {
  try {
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.email,
        s.phone,
        s.address,
        s.tax_id,
        s.total_orders,
        s.pending_orders,
        s.delivered_orders,
        s.cancelled_orders,
        s.total_invoiced,
        s.pending_payment,
        s.status,
        s.created_at::text,
        COUNT(sp.id)::int as products_count
      FROM suppliers s
      LEFT JOIN supplier_products sp ON s.id = sp.supplier_id
      GROUP BY s.id
      ORDER BY s.name
    `

    return result || []
  } catch (error) {
    console.error("Error fetching suppliers:", error)
    return []
  }
}

export async function getSupplierById(id: number) {
  try {
    const result = await sql`
      SELECT 
        s.id,
        s.name,
        s.category,
        s.email,
        s.phone,
        s.address,
        s.tax_id,
        s.total_orders,
        s.pending_orders,
        s.delivered_orders,
        s.cancelled_orders,
        s.total_invoiced,
        s.pending_payment,
        s.status,
        s.created_at::text
      FROM suppliers s
      WHERE s.id = ${id}
    `

    if (!result || result.length === 0) {
      return null
    }

    // Get supplier products
    const productsResult = await sql`
      SELECT 
        sp.id,
        sp.sku,
        sp.name,
        sp.category,
        sp.quantity,
        sp.unit,
        sp.cost_per_unit,
        sp.total_cost,
        sp.variation_percentage,
        i.name as ingredient_name
      FROM supplier_products sp
      LEFT JOIN ingredients i ON sp.ingredient_id = i.id
      WHERE sp.supplier_id = ${id}
      ORDER BY sp.name
    `

    const supplier = result[0]
    supplier.products = productsResult || []

    return supplier
  } catch (error) {
    console.error("Error fetching supplier:", error)
    return null
  }
}

export async function createSupplier(data: any) {
  try {
    const result = await sql`
      INSERT INTO suppliers (
        name, category, email, phone, address, tax_id, status
      )
      VALUES (
        ${data.name}, 
        ${data.category}, 
        ${data.email}, 
        ${data.phone}, 
        ${data.address}, 
        ${data.tax_id}, 
        ${data.status || "active"}
      )
      RETURNING id
    `

    revalidatePath("/dashboard/orders/suppliers")
    return { success: true, id: result[0].id }
  } catch (error) {
    console.error("Error creating supplier:", error)
    return { success: false, error: "Failed to create supplier" }
  }
}

export async function updateSupplier(id: number, data: any) {
  try {
    await sql`
      UPDATE suppliers
      SET 
        name = COALESCE(${data.name}, name),
        category = COALESCE(${data.category}, category),
        email = COALESCE(${data.email}, email),
        phone = COALESCE(${data.phone}, phone),
        address = COALESCE(${data.address}, address),
        tax_id = COALESCE(${data.tax_id}, tax_id),
        status = COALESCE(${data.status}, status),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `

    revalidatePath(`/dashboard/orders/suppliers/${id}`)
    revalidatePath("/dashboard/orders/suppliers")
    return { success: true }
  } catch (error) {
    console.error("Error updating supplier:", error)
    return { success: false, error: "Failed to update supplier" }
  }
}

export async function deleteSupplier(id: number) {
  try {
    // First delete supplier products
    await sql`
      DELETE FROM supplier_products
      WHERE supplier_id = ${id}
    `

    // Then delete the supplier
    await sql`
      DELETE FROM suppliers
      WHERE id = ${id}
    `

    revalidatePath("/dashboard/orders/suppliers")
    return { success: true }
  } catch (error) {
    console.error("Error deleting supplier:", error)
    return { success: false, error: "Failed to delete supplier" }
  }
}
