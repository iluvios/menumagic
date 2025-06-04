import { put } from "@vercel/blob"
import { customAlphabet } from "nanoid"

const nanoid = customAlphabet("abcdefghijklmnopqrstuvwxyz0123456789", 10)

export async function uploadImageToBlob(file: File): Promise<string> {
  const filename = `${nanoid()}-${file.name}`
  const blob = await put(filename, file, {
    access: "public",
  })
  return blob.url
}

export async function uploadBase64ImageToBlob(base64Data: string, filename: string): Promise<string> {
  // Decode base64 string to a Buffer
  const buffer = Buffer.from(base64Data, "base64")

  // Create a Blob from the Buffer
  const blob = await put(filename, buffer, {
    access: "public",
  })
  return blob.url
}

// Placeholder export for utapi to resolve build error.
// If you are using UploadThing, replace this with your actual utapi client.
export const utapi = {}
