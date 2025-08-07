export const SESSION_COOKIE_NAME = "menumagic_session"

export type UserSession = {
  userId: number
  restaurantId: number
}

/**
 * Parse a specific cookie from a Cookie header string.
 */
export function getCookieValue(cookieHeader: string | undefined, name: string): string | null {
  if (!cookieHeader) return null
  const cookies = cookieHeader.split(";")
  for (const part of cookies) {
    const [k, ...rest] = part.split("=")
    if (!k) continue
    if (k.trim() === name) {
      return decodeURIComponent(rest.join("=") ?? "").trim() || null
    }
  }
  return null
}

/**
 * Safely parses a session cookie JSON value into a UserSession.
 */
export function parseSession(value: string | undefined | null): UserSession | null {
  if (!value) return null
  try {
    const parsed = JSON.parse(value) as UserSession
    if (typeof parsed?.userId === "number" && typeof parsed?.restaurantId === "number") {
      return parsed
    }
    return null
  } catch {
    return null
  }
}
