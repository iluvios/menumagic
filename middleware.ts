import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getSession } from "@/lib/auth" // Assuming getSession is in lib/auth.ts

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  console.log(`[MIDDLEWARE] Processing request for pathname: ${pathname}`)

  // Skip middleware for /menu/[id] routes - these should be public
  if (pathname.startsWith("/menu/")) {
    console.log(`[MIDDLEWARE] Skipping auth check for public menu route: ${pathname}`)
    return NextResponse.next()
  }

  const session = await getSession()
  console.log(`[MIDDLEWARE] Session status: ${session ? "AUTHENTICATED" : "NOT AUTHENTICATED"}`)

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
    "/upload-menu", // The initial upload page
    "/upload-menu/processing",
    "/upload-menu/review",
    "/upload-menu/editor",
    "/upload-menu/template",
  ]

  // Redirect to onboarding if user is logged in but hasn't completed onboarding
  // This assumes onboarding completion status is part of the user/restaurant data
  // For simplicity, we'll just check if they are on the onboarding page and logged in
  // If they are logged in and NOT on onboarding, but should be, redirect them.
  // This logic might need refinement based on how you track onboarding completion.
  if (session && pathname === "/register") {
    console.log(`[MIDDLEWARE] Redirecting authenticated user from /register to /onboarding`)
    return NextResponse.redirect(new URL("/onboarding", request.url))
  }
  if (session && pathname === "/login") {
    console.log(`[MIDDLEWARE] Redirecting authenticated user from /login to /dashboard`)
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // Check if the current path is a protected path
  const isProtected = protectedPaths.some((path) => {
    // Simple check for exact match or starts with for nested routes
    if (path.includes("[id]")) {
      const base = path.split("[id]")[0]
      return pathname.startsWith(base.replace(/\/$/, "")) // Remove trailing slash for comparison
    }
    return pathname === path || (pathname.startsWith(path) && pathname.charAt(path.length) === "/")
  })

  console.log(`[MIDDLEWARE] Path ${pathname} is protected: ${isProtected}`)

  if (isProtected && !session) {
    // If trying to access a protected path without a session, redirect to login
    console.log(`[MIDDLEWARE] Redirecting unauthenticated user to /login`)
    const loginUrl = new URL("/login", request.url)
    loginUrl.searchParams.set("callbackUrl", request.url) // Optional: add callback URL
    return NextResponse.redirect(loginUrl)
  }

  console.log(`[MIDDLEWARE] Allowing request to proceed to: ${pathname}`)
  return NextResponse.next()
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|terms|privacy|placeholder.svg).*)", // Removed 'menu' from exclusions so we can log it, but we'll skip auth for /menu routes
  ],
}
