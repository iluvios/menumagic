"use server"

// Changed from "./menu-studio-actions" to "@/lib/actions/menu-studio-actions"
import { getAllDishes, createDish, updateDish, deleteDish } from "@/lib/actions/menu-studio-actions"

export async function getReusableMenuItems() {
  return getAllDishes()
}

export async function createReusableMenuItem(data: any) {
  return createDish(data)
}

export async function updateReusableMenuItem(id: number, data: any, imageFile?: File | null) {
  return updateDish(id, data, imageFile)
}

export async function deleteReusableMenuItem(id: number) {
  return deleteDish(id)
}
