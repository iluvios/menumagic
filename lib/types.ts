// This file defines common types used across the application.

export interface DigitalMenu {
  id: number
  name: string
  status: "active" | "inactive"
  qr_code_url: string | null
  template_id: number | null
  template_name?: string // Added for join in getDigitalMenus
  created_at: string // Assuming ISO string format from DB
  updated_at: string // Assuming ISO string format from DB
}

export interface MenuItem {
  id: number
  digital_menu_id: number
  dish_id: number
  order_index: number
  name: string
  description: string
  price: number
  image_url: string | null
  menu_category_id: number
  category_name: string
  is_available: boolean
}

export interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

export interface Dish {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  cost_per_serving?: number
}

export interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image_url?: string
  template_data_json?: any // JSON object for template specific data
}

export interface ExtractedItem {
  name: string
  description: string
  price: string
  category: string
}

export interface ExtractedItemWithStatus extends ExtractedItem {
  status?: "pending" | "added" | "error" | "exists"
  error?: string
}
