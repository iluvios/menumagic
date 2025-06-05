"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, ImageIcon } from "lucide-react"
// Remove any utapi imports if they exist
import { uploadImageToBlob } from "@/lib/utils/blob-helpers" // Use this instead of utapi

export default function UploadMenuPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0]

      // Check file type
      if (!selectedFile.type.startsWith("image/")) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file (JPEG, PNG, etc.)",
          variant: "destructive",
        })
        return
      }

      // Check file size (limit to 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 10MB",
          variant: "destructive",
        })
        return
      }

      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a menu image to upload",
        variant: "destructive",
      })
      return
    }

    try {
      setIsUploading(true)

      // Upload the file using Vercel Blob
      const imageUrl = await uploadImageToBlob(file)

      // Store the image URL in session storage for the next step
      sessionStorage.setItem("uploadedMenuImageUrl", imageUrl)

      // Navigate to the processing page
      router.push("/upload-menu/processing")
    } catch (error) {
      console.error("Upload error:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your menu. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Upload Menu</CardTitle>
          <CardDescription>Upload a photo of your physical menu to convert it to a digital menu</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => document.getElementById("menu-upload")?.click()}
            >
              <input id="menu-upload" type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {file ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">{file.name}</p>
                  <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-center">
                    <Upload className="h-8 w-8 text-gray-400" />
                  </div>
                  <p className="text-sm font-medium">Click to upload or drag and drop</p>
                  <p className="text-xs text-gray-500">Supported formats: JPEG, PNG, GIF</p>
                </div>
              )}
            </div>

            <div className="text-sm text-gray-500">
              <p className="font-medium">Tips for best results:</p>
              <ul className="list-disc pl-5 mt-1 space-y-1">
                <li>Ensure the menu is well-lit and the text is clearly visible</li>
                <li>Avoid glare or shadows on the menu</li>
                <li>Capture the entire menu in one shot if possible</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleUpload} disabled={!file || isUploading} className="w-full">
            {isUploading ? "Uploading..." : "Continue"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
