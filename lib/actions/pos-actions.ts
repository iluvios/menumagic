"use server"

import { sql } from "@/lib/db"
import { revalidatePath } from "next/cache"

// Types
export interface Order {
  id: number
  status: string
  subtotal: number
  tax: number
  discount: number
  total: number
  payment_method: string | null
  customer_name: string | null
  table_number: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface OrderItem {
  id: number
  order_id: number
  dish_id: number
  dish_name: string
  quantity: number
  price: number
  notes: string | null
}

export interface Payment {
  id: number
  order_id: number
  amount: number
  method: string
  status: string
  reference_number: string | null
  created_at: string
}

// Get all dishes for POS - simplified without categories
export async function getDishesForPOS() {
  try {
    // Simplified query without any category joins
    const dishes = await sql`
      SELECT id, name, description, price, image_url
      FROM dishes
      WHERE price IS NOT NULL AND price > 0
      ORDER BY name
    `
    return { dishes }
  } catch (error) {
    console.error("Error fetching dishes for POS:", error)
    return { error: "Failed to fetch dishes" }
  }
}

// Create a new order
export async function createOrder(orderData: {
  customer_name?: string
  table_number?: string
  notes?: string
  items: { dish_id: number; quantity: number; price: number; notes?: string }[]
}) {
  try {
    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
    const tax = subtotal * 0.16 // 16% tax
    const total = subtotal + tax

    // Create order
    const [order] = await sql`
      INSERT INTO orders (status, subtotal, tax, total, customer_name, table_number, notes)
      VALUES ('pending', ${subtotal}, ${tax}, ${total}, ${orderData.customer_name || null}, ${
        orderData.table_number || null
      }, ${orderData.notes || null})
      RETURNING *
    `

    // Create order items
    for (const item of orderData.items) {
      await sql`
        INSERT INTO order_items (order_id, dish_id, quantity, price, notes)
        VALUES (${order.id}, ${item.dish_id}, ${item.quantity}, ${item.price}, ${item.notes || null})
      `
    }

    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/pos/orders")
    return { order }
  } catch (error) {
    console.error("Error creating order:", error)
    return { error: "Failed to create order" }
  }
}

// Get order by ID with items
export async function getOrderById(orderId: number) {
  try {
    const [order] = await sql`
      SELECT * FROM orders WHERE id = ${orderId}
    `

    if (!order) {
      return { error: "Order not found" }
    }

    const orderItems = await sql`
      SELECT oi.*, d.name as dish_name
      FROM order_items oi
      JOIN dishes d ON oi.dish_id = d.id
      WHERE oi.order_id = ${orderId}
    `

    const payments = await sql`
      SELECT * FROM payments WHERE order_id = ${orderId}
    `

    return { order, orderItems, payments }
  } catch (error) {
    console.error("Error fetching order:", error)
    return { error: "Failed to fetch order" }
  }
}

// Update order status
export async function updateOrderStatus(orderId: number, status: string) {
  try {
    await sql`
      UPDATE orders SET status = ${status}, updated_at = NOW() WHERE id = ${orderId}
    `
    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/pos/orders")
    return { success: true }
  } catch (error) {
    console.error("Error updating order status:", error)
    return { error: "Failed to update order status" }
  }
}

// Process payment
export async function processPayment(
  orderId: number,
  paymentData: { amount: number; method: string; reference_number?: string },
) {
  try {
    // Create payment record
    const [payment] = await sql`
      INSERT INTO payments (order_id, amount, method, reference_number)
      VALUES (${orderId}, ${paymentData.amount}, ${paymentData.method}, ${paymentData.reference_number || null})
      RETURNING *
    `

    // Update order status to completed
    await sql`
      UPDATE orders SET status = 'completed', payment_method = ${paymentData.method}, updated_at = NOW() WHERE id = ${orderId}
    `

    revalidatePath("/dashboard/pos")
    revalidatePath("/dashboard/pos/orders")
    return { payment }
  } catch (error) {
    console.error("Error processing payment:", error)
    return { error: "Failed to process payment" }
  }
}

// Get recent orders
export async function getRecentOrders(limit = 10) {
  try {
    const orders = await sql`
      SELECT * FROM orders
      ORDER BY created_at DESC
      LIMIT ${limit}
    `
    return { orders }
  } catch (error) {
    console.error("Error fetching recent orders:", error)
    return { error: "Failed to fetch recent orders" }
  }
}

// Get orders with pagination
export async function getOrders(page = 1, limit = 20, status?: string) {
  try {
    const offset = (page - 1) * limit

    let orders
    let totalCount

    if (status) {
      orders = await sql`
        SELECT * FROM orders
        WHERE status = ${status}
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      const [result] = await sql`
        SELECT COUNT(*) FROM orders WHERE status = ${status}
      `
      totalCount = Number.parseInt(result.count)
    } else {
      orders = await sql`
        SELECT * FROM orders
        ORDER BY created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `

      const [result] = await sql`
        SELECT COUNT(*) FROM orders
      `
      totalCount = Number.parseInt(result.count)
    }

    return {
      orders,
      pagination: {
        total: totalCount,
        pages: Math.ceil(totalCount / limit),
        current: page,
      },
    }
  } catch (error) {
    console.error("Error fetching orders:", error)
    return { error: "Failed to fetch orders" }
  }
}

// Add sample dishes if none exist
export async function addSampleDishes() {
  try {
    // Check if we have any dishes
    const [count] = await sql`SELECT COUNT(*) FROM dishes`

    if (Number.parseInt(count.count) === 0) {
      // Add some sample dishes
      await sql`
        INSERT INTO dishes (name, description, price, image_url) VALUES
        ('Margherita Pizza', 'Classic pizza with tomato sauce, mozzarella, and basil', 12.99, null),
        ('Caesar Salad', 'Fresh romaine lettuce with caesar dressing and croutons', 8.99, null),
        ('Grilled Chicken', 'Juicy grilled chicken breast with herbs and spices', 15.99, null),
        ('Fish Tacos', 'Fresh fish tacos with cabbage slaw and lime', 11.99, null),
        ('Beef Burger', 'Classic beef burger with lettuce, tomato, and cheese', 13.99, null),
        ('Pasta Carbonara', 'Creamy pasta with bacon, eggs, and parmesan cheese', 14.99, null),
        ('Chocolate Cake', 'Rich chocolate cake with chocolate frosting', 6.99, null),
        ('Iced Coffee', 'Cold brew coffee served over ice', 3.99, null)
      `

      return { success: true, message: "Sample dishes added" }
    }

    return { success: true, message: "Dishes already exist" }
  } catch (error) {
    console.error("Error adding sample dishes:", error)
    return { error: "Failed to add sample dishes" }
  }
}
