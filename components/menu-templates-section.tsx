"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QrCode } from "lucide-react"

interface DigitalMenu {
  id: number
  name: string
  status: string
}

interface Template {
  id: number
  name: string
  description: string
  preview_image_url?: string
}

interface MenuTemplatesSectionProps {
  selectedMenu: DigitalMenu | null
  templates: Template[]
  selectedTemplateId: number | null
  onSelectTemplate: (templateId: number) => void
  onApplyTemplate: (templateId: number) => void
  onCustomizeTemplate: (templateId: number) => void
  onGenerateQr: (menuUrl: string) => void // Add this line
}

export function MenuTemplatesSection({
  selectedMenu,
  templates,
  selectedTemplateId,
  onSelectTemplate,
  onApplyTemplate,
  onCustomizeTemplate,
  onGenerateQr, // Add this line
}: MenuTemplatesSectionProps) {
  if (!selectedMenu) return null // Only show if a menu is selected

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-800">Plantilla del Menú</CardTitle>
        <CardDescription>Selecciona una plantilla para personalizar la apariencia de tu menú.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all duration-200 ${
                selectedTemplateId === template.id ? "ring-2 ring-warm-500 border-warm-300" : "hover:border-warm-300"
              }`}
              onClick={() => onSelectTemplate(template.id)}
            >
              <CardContent className="p-3">
                <div className="aspect-video bg-neutral-100 rounded mb-2 flex items-center justify-center">
                  {template.preview_image_url ? (
                    <img
                      src={template.preview_image_url || "/placeholder.svg"}
                      alt={`Preview of ${template.name}`}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <span className="text-xs text-neutral-500">Vista Previa</span>
                  )}
                </div>
                <h4 className="font-medium text-sm">{template.name}</h4>
                <p className="text-xs text-neutral-500 truncate">{template.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        {selectedTemplateId && (
          <div className="mt-4 flex justify-between items-center">
            <Button variant="outline" size="sm" asChild>
              {/* Removed target="_blank" and rel="noopener noreferrer" */}
              <a href={`/menu/${selectedMenu?.id}`}>
                <QrCode className="mr-2 h-4 w-4" />
                Ver Menú
              </a>
            </Button>
            <div className="flex gap-2">
              <Button onClick={() => onGenerateQr(`/menu/${selectedMenu?.id}`)} variant="secondary">
                Generar QR
              </Button>
              <Button onClick={() => onCustomizeTemplate(selectedTemplateId)} variant="secondary">
                Personalizar
              </Button>
              <Button
                onClick={() => onApplyTemplate(selectedTemplateId)}
                className="bg-warm-500 hover:bg-warm-600 text-white"
              >
                Aplicar Plantilla
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
