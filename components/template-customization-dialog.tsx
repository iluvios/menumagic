"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getMenuTemplateById, updateMenuTemplate, type MenuTemplate } from "@/lib/actions/template-actions"

interface TemplateCustomizationDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  templateId: number | null
  onSaveSuccess: () => void
}

export function TemplateCustomizationDialog({
  isOpen,
  onOpenChange,
  templateId,
  onSaveSuccess,
}: TemplateCustomizationDialogProps) {
  const { toast } = useToast()
  const [templateData, setTemplateData] = useState<MenuTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const fetchTemplate = async () => {
      if (isOpen && templateId) {
        setLoading(true)
        try {
          const template = await getMenuTemplateById(templateId)
          setTemplateData(template)
        } catch (error) {
          console.error("Failed to fetch template for customization:", error)
          toast({
            title: "Error",
            description: "No se pudo cargar la plantilla para personalizar.",
            variant: "destructive",
          })
          onOpenChange(false) // Close dialog on error
        } finally {
          setLoading(false)
        }
      } else if (!isOpen) {
        // Reset state when dialog closes
        setTemplateData(null)
        setLoading(true)
      }
    }
    fetchTemplate()
  }, [isOpen, templateId, onOpenChange, toast])

  const handleTemplateDataChange = (key: keyof MenuTemplate["template_data_json"], value: string | boolean) => {
    setTemplateData((prev) => {
      if (!prev) return null
      return {
        ...prev,
        template_data_json: {
          ...prev.template_data_json,
          [key]: value,
        },
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!templateData || !templateId) return

    setIsSaving(true)
    try {
      await updateMenuTemplate(templateId, {
        name: templateData.name, // Keep name and description if they are editable
        description: templateData.description,
        template_data_json: templateData.template_data_json,
      })
      toast({ title: "Éxito", description: "Plantilla actualizada exitosamente." })
      onSaveSuccess()
      onOpenChange(false)
    } catch (error: any) {
      console.error("Error updating template:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la plantilla.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle>Cargando Plantilla...</DialogTitle>
          </DialogHeader>
          <div className="py-8 text-center text-neutral-500">Cargando datos de la plantilla...</div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!templateData) {
    return null // Should not happen if loading is handled, but as a fallback
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Personalizar Plantilla: {templateData.name}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="primary_color" className="text-right">
              Color Primario
            </Label>
            <Input
              id="primary_color"
              type="color"
              value={templateData.template_data_json.primary_color || "#000000"}
              onChange={(e) => handleTemplateDataChange("primary_color", e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="secondary_color" className="text-right">
              Color Secundario
            </Label>
            <Input
              id="secondary_color"
              type="color"
              value={templateData.template_data_json.secondary_color || "#FFFFFF"}
              onChange={(e) => handleTemplateDataChange("secondary_color", e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="accent_color" className="text-right">
              Color de Acento
            </Label>
            <Input
              id="accent_color"
              type="color"
              value={templateData.template_data_json.accent_color || "#FF0000"}
              onChange={(e) => handleTemplateDataChange("accent_color", e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="background_color" className="text-right">
              Color de Fondo
            </Label>
            <Input
              id="background_color"
              type="color"
              value={templateData.template_data_json.background_color || "#F0F0F0"}
              onChange={(e) => handleTemplateDataChange("background_color", e.target.value)}
              className="col-span-3 h-8"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="font_family_primary" className="text-right">
              Fuente Principal
            </Label>
            <Input
              id="font_family_primary"
              value={templateData.template_data_json.font_family_primary || "Inter"}
              onChange={(e) => handleTemplateDataChange("font_family_primary", e.target.value)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="layout_style" className="text-right">
              Estilo de Diseño
            </Label>
            <Select
              value={templateData.template_data_json.layout_style || "list"}
              onValueChange={(value) => handleTemplateDataChange("layout_style", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">Lista</SelectItem>
                <SelectItem value="grid">Cuadrícula</SelectItem>
                <SelectItem value="cards">Tarjetas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="card_style" className="text-right">
              Estilo de Tarjeta
            </Label>
            <Select
              value={templateData.template_data_json.card_style || "elevated"}
              onValueChange={(value) => handleTemplateDataChange("card_style", value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Seleccionar estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="elevated">Elevado</SelectItem>
                <SelectItem value="bordered">Bordeado</SelectItem>
                <SelectItem value="minimal">Minimalista</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="show_images" className="text-right">
              Mostrar Imágenes
            </Label>
            <input
              id="show_images"
              type="checkbox"
              checked={templateData.template_data_json.show_images ?? true}
              onChange={(e) => handleTemplateDataChange("show_images", e.target.checked)}
              className="col-span-3 h-4 w-4"
            />
          </div>
          {/* Add more fields as needed for full customization */}
          <DialogFooter>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
