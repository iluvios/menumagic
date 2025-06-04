import { put } from "@vercel/blob"

export async function uploadImageToBlob(file: File): Promise<string> {
  const { url } = await put(file.name, file, { access: "public" })
  return url
}

export async function uploadBase64ImageToBlob(base64Image: string, filename: string): Promise<string> {
  // Decode base64 string to a Buffer
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "")
  const buffer = Buffer.from(base64Data, "base64")

  // Determine content type (e.g., image/png, image/jpeg)
  const matches = base64Image.match(/^data:(image\/\w+);base64,/)
  const contentType = matches ? matches[1] : "application/octet-stream"

  const { url } = await put(filename, buffer, {
    access: "public",
    contentType: contentType,
  })
  return url
}
