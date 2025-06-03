"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Menu, ArrowLeft, ArrowRight, CheckCircle, Palette, Star } from "lucide-react"
import Link from "next/link"

interface Template {
  id: string
  name: string
  description: string
  preview: string
  category: string
  popular?: boolean
}

export default function TemplatePage() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)

  const templates: Template[] = [
    {
      id: "modern",
      name: "Moderno",
      description: "Diseño limpio y minimalista perfecto para restaurantes contemporáneos",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Moderno",
      popular: true,
    },
    {
      id: "classic",
      name: "Clásico",
      description: "Estilo tradicional elegante ideal para restaurantes formales",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Clásico",
    },
    {
      id: "colorful",
      name: "Colorido",
      description: "Vibrante y alegre, perfecto para restaurantes familiares",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Colorido",
      popular: true,
    },
    {
      id: "rustic",
      name: "Rústico",
      description: "Estilo campestre y acogedor para restaurantes tradicionales",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Rústico",
    },
    {
      id: "elegant",
      name: "Elegante",
      description: "Sofisticado y refinado para restaurantes de alta cocina",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Elegante",
    },
    {
      id: "casual",
      name: "Casual",
      description: "Relajado y amigable para cafeterías y restaurantes informales",
      preview: "/placeholder.svg?height=300&width=200",
      category: "Casual",
    },
  ]

  const handleContinue = () => {
    if (selectedTemplate) {
      window.location.href = `/upload-menu/editor?template=${selectedTemplate}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/upload-menu/review"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="w-12 h-1 bg-green-500" />
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="w-12 h-1 bg-green-500" />
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="w-12 h-1 bg-orange-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-medium">
              4
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Elige una plantilla</h2>
          <p className="text-gray-600">Selecciona el diseño que mejor represente el estilo de tu restaurante</p>
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-xl ${
                selectedTemplate === template.id
                  ? "ring-2 ring-orange-500 shadow-xl"
                  : "border-gray-200 hover:border-orange-300"
              }`}
              onClick={() => setSelectedTemplate(template.id)}
            >
              <CardContent className="p-0">
                <div className="relative">
                  <img
                    src={template.preview || "/placeholder.svg"}
                    alt={`Plantilla ${template.name}`}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {template.popular && (
                    <Badge className="absolute top-2 right-2 bg-gradient-to-r from-orange-500 to-red-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                  {selectedTemplate === template.id && (
                    <div className="absolute inset-0 bg-orange-500 bg-opacity-20 rounded-t-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
                        <CheckCircle className="w-8 h-8 text-orange-500" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{template.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {template.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected template info */}
        {selectedTemplate && (
          <Card className="border-orange-200 bg-orange-50 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                  <Palette className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-900">
                    Plantilla "{templates.find((t) => t.id === selectedTemplate)?.name}" seleccionada
                  </h3>
                  <p className="text-orange-700 text-sm">
                    Podrás personalizar colores, fuentes, logo y más en el siguiente paso
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action buttons */}
        <div className="flex justify-between">
          <Button variant="outline" className="px-6">
            Usar plantilla en blanco
          </Button>

          <Button
            onClick={handleContinue}
            disabled={!selectedTemplate}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 disabled:opacity-50"
          >
            Personalizar plantilla
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}
