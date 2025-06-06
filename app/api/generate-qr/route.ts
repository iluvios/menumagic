import { type NextRequest, NextResponse } from "next/server"
import QRCode from "qrcode"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
    }

    // Generate QR code as base64 string
    const qrCodeBase64 = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })

    return NextResponse.json({ qrCodeBase64 })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json({ error: "Failed to generate QR code" }, { status: 500 })
  }
}
