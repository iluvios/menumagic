import { put, del } from "@vercel/blob"

export async function uploadBase64ImageToBlob(base64Image: string, filename: string): Promise<string> {
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")

  const { url } = await put(filename, buffer, {
    access: "public",
    addRandomSuffix: false, // We want predictable filenames for QR codes
  })
  return url
}

// Re-export put and del for direct use in other actions
export { put, del }
