"use server"

import { sql } from "@/lib/db" // Ensure this import is correct
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const SESSION_COOKIE_NAME = "menumagic_session"

interface UserSession {
  userId: number
  restaurantId: number
}

// Helper to set session cookie
async function setSessionCookie(userId: number, restaurantId: number) {
  const sessionData: UserSession = { userId, restaurantId }
  cookies().set(SESSION_COOKIE_NAME, JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: "/",
  })
}

// Helper to get session data
export async function getSession(): Promise<UserSession | null> {
  const sessionCookie = cookies().get(SESSION_COOKIE_NAME)
  if (!sessionCookie) {
    return null
  }
  try {
    return JSON.parse(sessionCookie.value) as UserSession
  } catch (error) {
    console.error("Error parsing session cookie:", error)
    return null
  }
}

// Helper to get current user and restaurant details
export async function getCurrentUserAndRestaurant() {
  const session = await getSession()
  if (!session) {
    return { user: null, restaurant: null }
  }

  try {
    const userResult = await sql`
      SELECT id, name, email, restaurant_id
      FROM users
      WHERE id = ${session.userId}
    `
    const user = userResult[0] || null

    let restaurant = null
    if (user?.restaurant_id) {
      const restaurantResult = await sql`
        SELECT id, name, address_json, phone, email, cuisine_type, currency_code, timezone
        FROM restaurants
        WHERE id = ${user.restaurant_id}
      `
      restaurant = restaurantResult[0] || null
    }

    return { user, restaurant }
  } catch (error) {
    console.error("Error fetching current user and restaurant:", error)
    // Re-throw or return a specific error to indicate database connection failure
    throw new Error("Error connecting to database: " + (error as Error).message)
  }
}

// NEW: Helper to get restaurant ID from session
export async function getRestaurantIdFromSession(): Promise<number | null> {
  const session = await getSession()
  return session ? session.restaurantId : null
}

export async function registerUser(formData: FormData) {
  const name = formData.get("name") as string
  const email = formData.get("email") as string
  const phone = formData.get("phone") as string
  const password = formData.get("password") as string
  const acceptTerms = formData.get("acceptTerms") === "on"

  if (!acceptTerms) {
    return { success: false, error: "Debes aceptar los términos y condiciones." }
  }

  if (!name || !email || !phone || !password) {
    return { success: false, error: "Todos los campos son obligatorios." }
  }

  if (password.length < 8) {
    return { success: false, error: "La contraseña debe tener al menos 8 caracteres." }
  }

  try {
    // Check if user already exists
    const existingUser = await sql`SELECT id FROM users WHERE email = ${email}`
    if (existingUser.length > 0) {
      return { success: false, error: "Este correo electrónico ya está registrado." }
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    // Synchronize sequences before inserting
    await sql`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 0) FROM users) + 1, false)`
    await sql`SELECT setval('restaurants_id_seq', (SELECT COALESCE(MAX(id), 0) FROM restaurants) + 1, false)`

    // Execute queries sequentially
    // 1. Create the user (let the database auto-assign the ID)
    const newUser = await sql`
      INSERT INTO users (name, email, password_hash)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id
    `
    const userId = newUser[0].id

    // 2. Create a default restaurant for the new user
    const newRestaurant = await sql`
      INSERT INTO restaurants (name, owner_user_id, phone, email)
      VALUES (${name + "'s Restaurant"}, ${userId}, ${phone}, ${email})
      RETURNING id
    `
    const restaurantId = newRestaurant[0].id

    // 3. Link the restaurant to the user
    await sql`
      UPDATE users
      SET restaurant_id = ${restaurantId}
      WHERE id = ${userId}
    `

    // Set session cookie
    await setSessionCookie(userId, restaurantId)

    // Revalidate paths that depend on user/restaurant data
    revalidatePath("/")
  } catch (error) {
    console.error("Error during registration:", error)
    return { success: false, error: "Error al registrar la cuenta. Inténtalo de nuevo." }
  }

  // Redirect outside of try-catch to avoid catching the redirect error
  redirect("/onboarding")
}

export async function loginUser(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { success: false, error: "Correo electrónico y contraseña son obligatorios." }
  }

  try {
    const userResult = await sql`
      SELECT id, password_hash, restaurant_id
      FROM users
      WHERE email = ${email}
    `
    const user = userResult[0]

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return { success: false, error: "Credenciales inválidas." }
    }

    // Set session cookie
    await setSessionCookie(user.id, user.restaurant_id)

    // Revalidate paths that depend on user/restaurant data
    revalidatePath("/")
  } catch (error) {
    console.error("Error during login:", error)
    return { success: false, error: "Error al iniciar sesión. Inténtalo de nuevo." }
  }

  // Redirect outside of try-catch to avoid catching the redirect error
  redirect("/dashboard")
}

export async function logoutUser() {
  cookies().delete(SESSION_COOKIE_NAME)
  revalidatePath("/")
  redirect("/login")
}
