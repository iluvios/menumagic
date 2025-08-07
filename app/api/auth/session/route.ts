import { NextResponse } from "next/server"
import { SESSION_COOKIE_NAME, parseSession } from "@/lib/session"

export async function GET(req: Request) {
  const cookieHeader = req.headers.get("cookie") ?? undefined
  const cookieValue = cookieHeader
    ?.split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${SESSION_COOKIE_NAME}=`))
    ?.slice(SESSION_COOKIE_NAME.length + 1)

  const session = parseSession(cookieValue ?? null)
  return NextResponse.json({ session })
}
