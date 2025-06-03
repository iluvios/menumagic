"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Menu, Upload, Camera, ArrowLeft, ArrowRight, ImageIcon } from "lucide-react"
import Link from "next/link"
import { createDigitalMenu, mockAiMenuUpload } from "@/lib/actions/menu-studio-actions"
import { getCurrentUserAndRestaurant } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function UploadMenuPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) {
      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)

    try {
      const { user, restaurant } = await getCurrentUserAndRestaurant()
      if (!user || !restaurant) {
        alert("Debes iniciar sesión para subir un menú.")
        router.push("/login")
        return
      }

      // 1. Create a new digital menu entry
      const newMenu = await createDigitalMenu({
        name: `Menú de ${restaurant.name} - ${new Date().toLocaleDateString()}`,
        status: "draft",
      })

      if (!newMenu.success || !newMenu.id) {
        throw new Error("Failed to create digital menu entry.")
      }

      // 2. Simulate AI processing and get mock items
      const mockItems = await mockAiMenuUpload(selectedFile, newMenu.id)

      // In a real scenario, you would save these items to the database
      // For now, we'll just log them and redirect to a review page
      console.log("AI Processed Mock Items:", mockItems)

      // Redirect to the processing page, passing the new menu ID
      router.push(`/upload-menu/processing?menuId=${newMenu.id}`)
    } catch (error) {
      console.error("Error during menu upload process:", error)
      alert(`Error al subir el menú: ${(error as Error).message}`)
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/dashboard"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver al panel</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MenuMagic</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-medium">
              1
            </div>
            <div className="w-12 h-1 bg-gray-200" />
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              2
            </div>
            <div className="w-12 h-1 bg-gray-200" />
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div className="w-12 h-1 bg-gray-200" />
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              4
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Sube tu menú</h2>
          <p className="text-gray-600">Fotografía o sube una imagen de tu menú actual y nuestra IA lo digitalizará</p>
        </div>

        <Card className="shadow-lg border-0 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Paso 1: Subir imagen del menú</CardTitle>
          </CardHeader>
          <CardContent>
            {!previewUrl ? (
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-orange-400 transition-colors cursor-pointer"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex flex-col items-center space-y-4">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Arrastra tu imagen aquí o haz clic para seleccionar
                    </p>
                    <p className="text-gray-500">Formatos soportados: JPG, PNG, HEIC</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
              </div>
            ) : (
              <div className="space-y-6">
                <div className="relative">
                  <img
                    src={previewUrl || "/placeholder.svg"}
                    alt="Preview del menú"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="absolute top-2 right-2 bg-white"
                    onClick={() => {
                      setSelectedFile(null)
                      setPreviewUrl(null)
                    }}
                  >
                    Cambiar imagen
                  </Button>
                </div>

                <div className="text-center">
                  <p className="text-gray-600 mb-4">
                    Imagen seleccionada: <span className="font-medium">{selectedFile?.name}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex justify-between mt-8">
              <div className="flex space-x-4">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center space-x-2"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>Seleccionar archivo</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    // Simular captura de cámara
                    fileInputRef.current?.click()
                  }}
                  className="flex items-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>Tomar foto</span>
                </Button>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!selectedFile || isUploading}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Subiendo...</span>
                  </div>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <div className="mt-8 max-w-2xl mx-auto">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <h3 className="font-semibold text-blue-900 mb-3">💡 Consejos para mejores resultados:</h3>
              <ul className="space-y-2 text-blue-800 text-sm">
                <li>• Asegúrate de que el texto sea legible y esté bien iluminado</li>
                <li>• Evita sombras o reflejos sobre el menú</li>
                <li>• Incluye toda la información: nombres, descripciones y precios</li>
                <li>• Si tu menú tiene varias páginas, súbelas una por una</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
