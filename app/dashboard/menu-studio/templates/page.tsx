"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  getMenuTemplates,
  createMenuTemplate,
  updateMenuTemplate,
  deleteMenuTemplate,
  generateTemplateWithAI,
  seedDefaultTemplates,
  type MenuTemplate,
} from "@/lib/actions/template-actions"
import { getBrandKit } from "@/lib/actions/brand-kit-actions"
import { Plus, Edit, Trash2, Wand2, Eye, Copy, Palette, Type, Layout, ImageIcon, Sparkles } from "lucide-react"

export default function TemplateDesignerPage() {
  const { toast } = useToast()
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [brandKit, setBrandKit] = useState<any>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false)
  const [currentTemplate, setCurrentTemplate] = useState<MenuTemplate | null>(null)
  const [aiPrompt, setAiPrompt] = useState("")
  const [aiProgress, setAiProgress] = useState(0)
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<MenuTemplate | null>(null)

  // Template customization state
  const [templateData, setTemplateData] = useState<MenuTemplate["template_data_json"]>({
    primary_color: "#F59E0B",
    secondary_color: "#FEF3C7",
    accent_color: "#D97706",
    background_color: "#FFFBEB",
    border_radius: "8px",
    font_family_primary: "Inter",
    font_family_secondary: "Lora",
    layout_style: "list",
    card_style: "elevated",
    spacing: "comfortable",
    show_images: true,
    show_descriptions: true,
    show_prices: true,
    header_style: "centered",
    footer_style: "simple",
  })

  useEffect(() => {
    fetchTemplates()
    fetchBrandKit()
    // Seed default templates on first load
    seedDefaultTemplates().catch(console.error)
  }, [])

  const fetchTemplates = async () => {
    try {
      const data = await getMenuTemplates()
      setTemplates(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las plantillas.",
        variant: "destructive",
      })
    }
  }

  const fetchBrandKit = async () => {
    try {
      const { brandKit } = await getBrandKit()
      setBrandKit(brandKit)
    } catch (error) {
      console.error("Error fetching brand kit:", error)
    }
  }

  const handleCreateUpdateTemplate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string

    try {
      if (currentTemplate?.id) {
        await updateMenuTemplate(currentTemplate.id, {
          name,
          description,
          template_data_json: templateData,
        })
        toast({ title: "Plantilla Actualizada", description: "La plantilla ha sido actualizada exitosamente." })
      } else {
        await createMenuTemplate({
          name,
          description,
          template_data_json: templateData,
        })
        toast({ title: "Plantilla Creada", description: "La nueva plantilla ha sido creada exitosamente." })
      }
      fetchTemplates()
      setIsDialogOpen(false)
      setCurrentTemplate(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta plantilla?")) {
      try {
        await deleteMenuTemplate(id)
        toast({ title: "Plantilla Eliminada", description: "La plantilla ha sido eliminada." })
        fetchTemplates()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar la plantilla.",
          variant: "destructive",
        })
      }
    }
  }

  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) {
      toast({ title: "Error", description: "Por favor, describe el estilo que deseas.", variant: "destructive" })
      return
    }

    setIsGeneratingAi(true)
    setAiProgress(0)

    // Simulate progress
    const interval = setInterval(() => {
      setAiProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval)
          return prev
        }
        return prev + 10
      })
    }, 300)

    try {
      const aiGeneratedData = await generateTemplateWithAI(aiPrompt, currentTemplate?.id, {
        primary_color: brandKit?.primary_color_hex,
        logo_url: brandKit?.logo_url,
        font_family_main: brandKit?.font_family_main,
      })

      setTemplateData(aiGeneratedData)
      setAiProgress(100)
      toast({
        title: "¡Plantilla Generada con IA!",
        description: "La IA ha creado una plantilla basada en tu descripción.",
      })
      setIsAiDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error de IA",
        description: error.message || "No se pudo generar la plantilla con IA.",
        variant: "destructive",
      })
    } finally {
      setIsGeneratingAi(false)
      setAiProgress(0)
      clearInterval(interval)
    }
  }

  const handleOpenDialog = (template?: MenuTemplate) => {
    setCurrentTemplate(template || null)
    if (template) {
      setTemplateData(template.template_data_json)
    } else {
      // Reset to default values for new template
      setTemplateData({
        primary_color: brandKit?.primary_color_hex || "#F59E0B",
        secondary_color: "#FEF3C7",
        accent_color: "#D97706",
        background_color: "#FFFBEB",
        border_radius: "8px",
        font_family_primary: brandKit?.font_family_main || "Inter",
        font_family_secondary: brandKit?.font_family_secondary || "Lora",
        layout_style: "list",
        card_style: "elevated",
        spacing: "comfortable",
        show_images: true,
        show_descriptions: true,
        show_prices: true,
        header_style: "centered",
        footer_style: "simple",
      })
    }
    setIsDialogOpen(true)
  }

  const TemplatePreview = ({ template }: { template: MenuTemplate["template_data_json"] }) => (
    <div
      className="w-full h-64 rounded-lg border-2 border-neutral-200 overflow-hidden"
      style={{
        backgroundColor: template.background_color,
        backgroundImage: template.background_image_url ? `url(${template.background_image_url})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="p-4 h-full flex flex-col">
        <div
          className="text-center mb-4"
          style={{
            color: template.primary_color,
            fontFamily: template.font_family_primary,
          }}
        >
          <h3 className="text-lg font-bold">Mi Restaurante</h3>
          <p className="text-sm opacity-75">Menú Digital</p>
        </div>
        <div className="flex-1 space-y-2">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="flex items-center justify-between p-2 rounded"
              style={{
                backgroundColor: template.secondary_color,
                borderRadius: template.border_radius,
                boxShadow: template.card_style === "elevated" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              <div className="flex items-center space-x-2">
                {template.show_images && (
                  <div className="w-8 h-8 bg-neutral-300 rounded" style={{ borderRadius: template.border_radius }} />
                )}
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: template.primary_color,
                      fontFamily: template.font_family_primary,
                    }}
                  >
                    Platillo {item}
                  </p>
                  {template.show_descriptions && <p className="text-xs opacity-75">Descripción del platillo</p>}
                </div>
              </div>
              {template.show_prices && (
                <span
                  className="text-sm font-bold"
                  style={{
                    color: template.accent_color,
                    fontFamily: template.font_family_secondary,
                  }}
                >
                  $12.99
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Template Designer</h1>
            <p className="text-neutral-600">Crea y personaliza plantillas para tus menús digitales.</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Wand2 className="mr-2 h-4 w-4" />
                  Generar con IA
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-lg shadow-xl">
                <DialogHeader>
                  <DialogTitle className="flex items-center">
                    <Sparkles className="mr-2 h-5 w-5 text-warm-500" />
                    Generar Plantilla con IA
                  </DialogTitle>
                  <DialogDescription>
                    Describe el estilo que deseas y la IA creará una plantilla personalizada.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="ai-prompt">Descripción del Estilo</Label>
                    <Textarea
                      id="ai-prompt"
                      placeholder="Ej: Un diseño moderno y minimalista con colores vibrantes para un café urbano..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      rows={4}
                      className="mt-1"
                    />
                  </div>
                  {isGeneratingAi && (
                    <div className="space-y-2">
                      <Progress value={aiProgress} className="w-full [&>div]:bg-warm-500" />
                      <p className="text-sm text-neutral-600 text-center">Generando plantilla... {aiProgress}%</p>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleGenerateWithAI}
                    disabled={isGeneratingAi || !aiPrompt.trim()}
                    className="bg-warm-500 hover:bg-warm-600 text-white"
                  >
                    {isGeneratingAi ? "Generando..." : "Generar Plantilla"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
                  onClick={() => handleOpenDialog()}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nueva Plantilla
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[800px] bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{currentTemplate ? "Editar Plantilla" : "Crear Nueva Plantilla"}</DialogTitle>
                  <DialogDescription>
                    {currentTemplate
                      ? "Personaliza esta plantilla según tus necesidades."
                      : "Crea una nueva plantilla personalizada para tus menús."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateUpdateTemplate} className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="name">Nombre de la Plantilla</Label>
                        <Input
                          id="name"
                          name="name"
                          defaultValue={currentTemplate?.name || ""}
                          placeholder="Ej: Elegante Clásico"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Descripción</Label>
                        <Textarea
                          id="description"
                          name="description"
                          defaultValue={currentTemplate?.description || ""}
                          placeholder="Describe el estilo y uso de esta plantilla..."
                          rows={3}
                        />
                      </div>

                      {/* Color Customization */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center">
                          <Palette className="mr-2 h-4 w-4" />
                          Colores
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor="primary_color">Color Primario</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={templateData.primary_color}
                                onChange={(e) => setTemplateData({ ...templateData, primary_color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={templateData.primary_color}
                                onChange={(e) => setTemplateData({ ...templateData, primary_color: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="secondary_color">Color Secundario</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={templateData.secondary_color}
                                onChange={(e) => setTemplateData({ ...templateData, secondary_color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={templateData.secondary_color}
                                onChange={(e) => setTemplateData({ ...templateData, secondary_color: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="accent_color">Color de Acento</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={templateData.accent_color}
                                onChange={(e) => setTemplateData({ ...templateData, accent_color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={templateData.accent_color}
                                onChange={(e) => setTemplateData({ ...templateData, accent_color: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="background_color">Color de Fondo</Label>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="color"
                                value={templateData.background_color}
                                onChange={(e) => setTemplateData({ ...templateData, background_color: e.target.value })}
                                className="w-12 h-8 p-1 border rounded"
                              />
                              <Input
                                value={templateData.background_color}
                                onChange={(e) => setTemplateData({ ...templateData, background_color: e.target.value })}
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Typography */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center">
                          <Type className="mr-2 h-4 w-4" />
                          Tipografía
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Fuente Primaria</Label>
                            <Select
                              value={templateData.font_family_primary}
                              onValueChange={(value) =>
                                setTemplateData({ ...templateData, font_family_primary: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Inter">Inter</SelectItem>
                                <SelectItem value="Poppins">Poppins</SelectItem>
                                <SelectItem value="Roboto">Roboto</SelectItem>
                                <SelectItem value="Open Sans">Open Sans</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Fuente Secundaria</Label>
                            <Select
                              value={templateData.font_family_secondary}
                              onValueChange={(value) =>
                                setTemplateData({ ...templateData, font_family_secondary: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Lora">Lora</SelectItem>
                                <SelectItem value="Playfair Display">Playfair Display</SelectItem>
                                <SelectItem value="Merriweather">Merriweather</SelectItem>
                                <SelectItem value="Georgia">Georgia</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>

                      {/* Layout Options */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center">
                          <Layout className="mr-2 h-4 w-4" />
                          Diseño
                        </h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>Estilo de Diseño</Label>
                            <Select
                              value={templateData.layout_style}
                              onValueChange={(value) => setTemplateData({ ...templateData, layout_style: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="list">Lista</SelectItem>
                                <SelectItem value="grid">Cuadrícula</SelectItem>
                                <SelectItem value="cards">Tarjetas</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Estilo de Tarjeta</Label>
                            <Select
                              value={templateData.card_style}
                              onValueChange={(value) => setTemplateData({ ...templateData, card_style: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="minimal">Minimalista</SelectItem>
                                <SelectItem value="elevated">Elevado</SelectItem>
                                <SelectItem value="bordered">Con Borde</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Radio de Borde: {templateData.border_radius}</Label>
                          <Slider
                            value={[Number.parseInt(templateData.border_radius?.replace("px", "") || "8")]}
                            onValueChange={([value]) =>
                              setTemplateData({ ...templateData, border_radius: `${value}px` })
                            }
                            max={24}
                            step={2}
                            className="mt-2"
                          />
                        </div>
                      </div>

                      {/* Display Options */}
                      <div className="space-y-3">
                        <h4 className="font-medium flex items-center">
                          <ImageIcon className="mr-2 h-4 w-4" />
                          Opciones de Visualización
                        </h4>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>Mostrar Imágenes</Label>
                            <Switch
                              checked={templateData.show_images}
                              onCheckedChange={(checked) => setTemplateData({ ...templateData, show_images: checked })}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Mostrar Descripciones</Label>
                            <Switch
                              checked={templateData.show_descriptions}
                              onCheckedChange={(checked) =>
                                setTemplateData({ ...templateData, show_descriptions: checked })
                              }
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label>Mostrar Precios</Label>
                            <Switch
                              checked={templateData.show_prices}
                              onCheckedChange={(checked) => setTemplateData({ ...templateData, show_prices: checked })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="space-y-4">
                      <div>
                        <Label>Vista Previa</Label>
                        <TemplatePreview template={templateData} />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => setIsAiDialogOpen(true)}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Actualizar con IA
                      </Button>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                      {currentTemplate ? "Guardar Cambios" : "Crear Plantilla"}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.length === 0 ? (
            <div className="col-span-full text-center py-12 text-neutral-500">
              <Palette className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
              <p className="text-lg">No hay plantillas aún.</p>
              <p className="text-sm">Crea tu primera plantilla o genera una con IA.</p>
            </div>
          ) : (
            templates.map((template) => (
              <Card key={template.id} className="shadow-lg border-neutral-200 hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold text-neutral-800">{template.name}</CardTitle>
                    {template.is_default && (
                      <span className="px-2 py-1 text-xs bg-warm-100 text-warm-700 rounded-full">Por Defecto</span>
                    )}
                  </div>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <TemplatePreview template={template.template_data_json} />
                  <div className="flex items-center justify-between">
                    <div className="flex space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => setPreviewTemplate(template)}>
                            <Eye className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Vista Previa Completa</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(template)}>
                            <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar Plantilla</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              const newTemplate = { ...template, name: `${template.name} (Copia)` }
                              handleOpenDialog(newTemplate)
                            }}
                          >
                            <Copy className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Duplicar Plantilla</p>
                        </TooltipContent>
                      </Tooltip>
                      {!template.is_default && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteTemplate(template.id)}>
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar Plantilla</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </TooltipProvider>
  )
}
