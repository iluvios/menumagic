"use client"

import type React from "react"
import { Card, CardContent } from "@/components/ui/card" // Import Card and CardContent
import { Button } from "@/components/ui/button" // Import Button

interface MenuTemplatesSectionProps {
  selectedMenu: { id: number; name: string }
  templates: any[]
  selectedTemplateId: number | null
  onSelectTemplate: (id: number) => void
  onApplyTemplate: (id: number) => void
  onCustomizeTemplate: (id: number) => void
}

// Changed to named export
export const MenuTemplatesSection: React.FC<MenuTemplatesSectionProps> = ({
  selectedMenu,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onApplyTemplate,
  onCustomizeTemplate,
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Menu Templates</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card
            key={template.id}
            className={`relative cursor-pointer border-2 rounded-lg overflow-hidden transition-all duration-200 ${
              selectedTemplateId === template.id ? "border-warm-500 shadow-md" : "border-gray-200 hover:border-warm-300"
            }`}
            onClick={() => {
              onSelectTemplate(template.id)
              onApplyTemplate(template.id) // Apply template immediately on click
            }}
          >
            <CardContent className="p-0">
              {" "}
              {/* Use p-0 to control padding */}
              <div className="aspect-w-16 aspect-h-9">
                <img
                  src={template.thumbnail || "/placeholder.svg"}
                  alt={template.name}
                  className="object-cover w-full h-full rounded-t-lg"
                />
              </div>
              <div className="p-4">
                {" "}
                {/* Add padding here for content */}
                <h4 className="text-md font-semibold">{template.name}</h4>
                <p className="text-sm text-gray-500">{template.description}</p>
              </div>
            </CardContent>
            {selectedTemplateId === template.id && (
              <div className="absolute top-2 right-2">
                <span className="bg-warm-500 text-white text-xs px-2 py-1 rounded-full">Selected</span>
              </div>
            )}
          </Card>
        ))}
      </div>
      {selectedTemplateId && (
        <div className="mt-4 flex justify-end">
          {" "}
          {/* Removed QR button from here */}
          <Button onClick={() => onCustomizeTemplate(selectedTemplateId)} variant="secondary">
            Personalizar
          </Button>
        </div>
      )}
    </div>
  )
}
