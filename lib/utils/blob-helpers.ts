import { put, del } from "@vercel/blob"

export async function uploadImageToBlob(file: File): Promise<string> {
  const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
  const blob = await put(filename, file, {
    access: "public",
  })
  return blob.url
}

export async function uploadBase64ImageToBlob(base64Data: string, filename: string): Promise<string> {
  const buffer = Buffer.from(base64Data, "base64")
  const blob = await put(filename, buffer, {
    access: "public",
  })
  return blob.url
}

export async function deleteImageFromBlob(url: string): Promise<void> {
  try {
    await del(url)
  } catch (error) {
    console.error("Error deleting blob:", error)
  }
}

// Re-export put and del for direct use in other actions
export { put, del }
