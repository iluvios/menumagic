import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { SESSION_COOKIE_NAME, type UserSession } from "@/lib/session"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for /menu/[id] routes - these should be public
  if (pathname.startsWith("/menu/")) {
    return NextResponse.next()
  }

  // READ THE SESSION COOKIE DIRECTLY FROM THE REQUEST
  // Do NOT use server-only helpers here.
  let session: UserSession | null = null
  const cookieValue = request.cookies.get(SESSION_COOKIE_NAME)?.value
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue) as UserSession
      if (typeof parsed.userId === "number" && typeof parsed.restaurantId === "number") {
        session = parsed
      }
    } catch {
      session = null
    }
  }

  // Define paths that require authentication
  const protectedPaths = [
    "/dashboard",
    "/dashboard/analytics",
    "/dashboard/costs",
    "/dashboard/growth-insights",
    "/dashboard/menu-studio",
    "/dashboard/menu-studio/brand-kit",
    "/dashboard/menu-studio/digital-menu",
    "/dashboard/menu-studio/print-designer",
    "/dashboard/menu-studio/templates",
    "/dashboard/menu-studio/website-builder",
    "/dashboard/menu",
    "/dashboard/menu/recipes",
    "/dashboard/menu/recipes/[id]",
    "/dashboard/menus/dishes",
    "/dashboard/menus/templates",
    "/dashboard/operations-hub",
    "/dashboard/operations-hub/ingredients",
    "/dashboard/operations-hub/inventory",
    "/dashboard/operations-hub/recipes",
    "/dashboard/order-hub",
    "/dashboard/orders/suppliers",
    "/dashboard/orders/suppliers/[id]",
    "/dashboard/qr/generate",
    "/dashboard/seed",
    "/dashboard/settings",
    "/dashboard/settings/categories",
    "/dashboard/settings/profile",
    "/dashboard/smart-accounting",
    "/dashboard/smart-accounting/cost-sales-tracker",
    "/upload-menu",
    "/upload-menu/processing",
    "/upload-menu/review",
    "/upload-menu/editor",
    "/upload-menu/template",
  ]

  // Redirect authenticated users away from register/login
  if (session && pathname === "/register") {
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Check if the current path is a protected path
  const isProtected = protectedPaths.some((path) => {
    if (path.includes("[id]")) {
      const base = path.split("[id]")[0]
      return pathname.startsWith(base.replace(/\/$/, ""))
    }
    return pathname === path || (pathname.startsWith(path) && pathname.charAt(path.length) === "/")
  })

  if (isProtected && !session) {
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|terms|privacy|placeholder.svg).*)",
  ],
}
