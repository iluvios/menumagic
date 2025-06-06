"use client"

import type React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Palette, Eye } from "lucide-react"

interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image?: string
  thumbnail?: string
}

interface MenuTemplatesSectionProps {
  selectedMenu: { id: number; name: string; template_id: number | null } // Added template_id to selectedMenu
  templates: MenuTemplate[]
  onApplyTemplate: (id: number) => void
}

export const MenuTemplatesSection: React.FC<MenuTemplatesSectionProps> = ({
  selectedMenu,
  templates = [], // Add default empty array
  onApplyTemplate,
}) => {
  // Mock templates if none are provided
  const mockTemplates: MenuTemplate[] = [
    {
      id: 1,
      name: "Modern Minimalist",
      description: "Clean, simple design with plenty of white space",
      preview_image: "/placeholder.svg?height=200&width=300&text=Modern+Minimalist",
    },
    {
      id: 2,
      name: "Rustic Charm",
      description: "Warm, cozy design with wood textures and earth tones",
      preview_image: "/placeholder.svg?height=200&width=300&text=Rustic+Charm",
    },
    {
      id: 3,
      name: "Elegant Fine Dining",
      description: "Sophisticated layout perfect for upscale restaurants",
      preview_image: "/placeholder.svg?height=200&width=300&text=Elegant+Fine+Dining",
    },
    {
      id: 4,
      name: "Casual Bistro",
      description: "Friendly, approachable design for casual dining",
      preview_image: "/placeholder.svg?height=200&width=300&text=Casual+Bistro",
    },
    {
      id: 5,
      name: "Food Truck Style",
      description: "Bold, vibrant design perfect for street food",
      preview_image: "/placeholder.svg?height=200&width=300&text=Food+Truck+Style",
    },
    {
      id: 6,
      name: "Coffee Shop",
      description: "Cozy design ideal for cafes and coffee shops",
      preview_image: "/placeholder.svg?height=200&width=300&text=Coffee+Shop",
    },
  ]

  const displayTemplates = templates && templates.length > 0 ? templates : mockTemplates

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-blue-500" />
            Menu Templates
          </CardTitle>
          <CardDescription>
            Choose a design template for "{selectedMenu.name}" to customize its appearance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayTemplates.map((template) => (
              <Card
                key={template.id}
                className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-300 hover:shadow-md
                  ${selectedMenu.template_id === template.id ? "border-blue-500 ring-2 ring-blue-500" : ""}`}
              >
                <CardContent className="p-0">
                  <div className="aspect-video">
                    <img
                      src={
                        template.preview_image ||
                        template.thumbnail ||
                        "/placeholder.svg?height=200&width=300&text=Template" ||
                        "/placeholder.svg" ||
                        "/placeholder.svg"
                      }
                      alt={template.name}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-md font-semibold">{template.name}</h4>
                      <Badge variant="secondary">Free</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mb-3">{template.description}</p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          // Preview functionality - could open a modal or new tab
                          window.open(`/menu/${selectedMenu.id}?template=${template.id}`, "_blank")
                        }}
                      >
                        <Eye className="mr-1 h-3 w-3" />
                        Preview
                      </Button>
                      <Button size="sm" className="flex-1" onClick={() => onApplyTemplate(template.id)}>
                        Apply
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {(!templates || templates.length === 0) && (
            <div className="text-center py-8 mt-6 border-t">
              <p className="text-gray-500 mb-4">
                Templates are currently being loaded. The designs above are examples of what will be available.
              </p>
              <Button variant="outline" disabled>
                More Templates Coming Soon
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
