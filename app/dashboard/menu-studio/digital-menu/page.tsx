"use client"

import type React from "react"
import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label" // Re-added
import { Textarea } from "@/components/ui/textarea" // Re-added
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Re-added
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter, // Re-added
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip" // Re-added TooltipContent, TooltipTrigger
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import {
  getDigitalMenus,
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  getMenuItemsByMenuId,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getCategoriesByType,
  mockAiMenuUpload, // New action for AI upload
  getMenuTemplates,
  applyTemplateToMenu,
} from "@/lib/actions/menu-studio-actions"
import { formatCurrency } from "@/lib/utils/formatters"
import {
  UploadCloud,
  Plus,
  Edit,
  Trash2,
  QrCode,
  ImageIcon,
  XCircle,
  Wand2,
  ChefHat,
  Package,
  SkipForward,
  FileText,
  CheckCircle2,
  UtensilsCrossed,
} from "lucide-react"
import Link from "next/link" // Re-added

interface DigitalMenu {
  id: number
  name: string
  status: string
  qr_code_url?: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  // For AI onboarding
  ai_extracted?: boolean
}

interface Category {
  id: number
  name: string
}

type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<DigitalMenu | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false)
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null)
  const [menuItemImageFile, setMenuItemImageFile] = useState<File | null>(null)
  const [menuItemImagePreview, setMenuItemImagePreview] = useState<string | null>(null)

  // AI Onboarding State
  const [aiOnboardingStep, setAiOnboardingStep] = useState<AiOnboardingStep>("idle")
  const [aiMenuFile, setAiMenuFile] = useState<File | null>(null)
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<MenuItem[]>([])

  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  useEffect(() => {
    fetchMenus()
    fetchCategories()
    fetchTemplates() // Add this line
  }, [])

  useEffect(() => {
    if (selectedMenu) {
      fetchMenuItems(selectedMenu.id)
      setAiOnboardingStep("idle") // Reset AI flow when menu changes
    } else if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [selectedMenu, menus])

  const fetchMenus = async () => {
    const data = await getDigitalMenus()
    setMenus(data)
  }

  const fetchMenuItems = async (menuId: number) => {
    const data = await getMenuItemsByMenuId(menuId)
    setMenuItems(data)
  }

  const fetchCategories = async () => {
    const data = await getCategoriesByType("recipe") // Assuming 'recipe' type for menu categories
    setCategories(data)
  }

  const fetchTemplates = async () => {
    try {
      const data = await getMenuTemplates()
      setTemplates(data)
    } catch (error) {
      console.error("Error fetching templates:", error)
    }
  }

  const handleCreateUpdateMenu = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const status = formData.get("status") as string

    try {
      if (selectedMenu?.id && !formData.get("is_new")) {
        // Check if editing existing
        const result = await updateDigitalMenu(selectedMenu.id, { name, status })
        toast({ title: "Menú actualizado", description: "El menú digital ha sido actualizado exitosamente." })
      } else {
        const result = await createDigitalMenu({ name, status })
        toast({ title: "Menú creado", description: "El nuevo menú digital ha sido creado exitosamente." })
        if (result.id) setSelectedMenu({ id: result.id, name, status }) // Select the new menu
      }
      fetchMenus()
      setIsMenuDialogOpen(false)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar el menú.", variant: "destructive" })
    }
  }

  const handleDeleteMenu = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este menú digital y todos sus elementos?")) {
      try {
        await deleteDigitalMenu(id)
        toast({ title: "Menú eliminado", description: "El menú digital ha sido eliminado." })
        fetchMenus()
        if (selectedMenu?.id === id) setSelectedMenu(null)
      } catch (error: any) {
        toast({ title: "Error", description: error.message || "No se pudo eliminar el menú.", variant: "destructive" })
      }
    }
  }

  const handleMenuItemImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setMenuItemImageFile(file)
      setMenuItemImagePreview(URL.createObjectURL(file))
    }
  }

  const handleCreateUpdateMenuItem = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!selectedMenu) return

    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const price = Number.parseFloat(formData.get("price") as string)
    const menu_category_id = Number.parseInt(formData.get("menu_category_id") as string)
    // image_url will be handled by server action if menuItemImageFile exists

    const itemData = {
      digital_menu_id: selectedMenu.id,
      name,
      description,
      price,
      menu_category_id,
    }

    try {
      if (currentMenuItem?.id) {
        await updateMenuItem(currentMenuItem.id, itemData, menuItemImageFile || undefined)
        toast({ title: "Elemento actualizado", description: "El elemento del menú ha sido actualizado." })
      } else {
        await createMenuItem(itemData, menuItemImageFile || undefined)
        toast({ title: "Elemento creado", description: "El nuevo elemento del menú ha sido creado." })
      }
      fetchMenuItems(selectedMenu.id)
      setIsMenuItemDialogOpen(false)
      setCurrentMenuItem(null)
      setMenuItemImageFile(null)
      setMenuItemImagePreview(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el elemento del menú.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteMenuItem = async (id: number) => {
    if (!selectedMenu) return
    if (confirm("¿Estás seguro de que quieres eliminar este elemento del menú?")) {
      try {
        await deleteMenuItem(id)
        toast({ title: "Elemento eliminado", description: "El elemento del menú ha sido eliminado." })
        fetchMenuItems(selectedMenu.id)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el elemento del menú.",
          variant: "destructive",
        })
      }
    }
  }

  const handleOpenMenuDialog = (menu?: DigitalMenu) => {
    setSelectedMenu(menu || null) // If no menu, it's a new one
    setIsMenuDialogOpen(true)
  }

  const handleOpenMenuItemDialog = (item?: MenuItem) => {
    setCurrentMenuItem(item || null)
    setMenuItemImageFile(null)
    setMenuItemImagePreview(item?.image_url || null)
    setIsMenuItemDialogOpen(true)
  }

  // AI Onboarding Handlers
  const handleAiMenuFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) setAiMenuFile(file)
  }

  const startAiProcessing = async () => {
    if (!aiMenuFile || !selectedMenu) {
      toast({ title: "Error", description: "Por favor, selecciona un menú y sube un archivo.", variant: "destructive" })
      return
    }
    setAiOnboardingStep("processing")
    setAiProcessingProgress(0)

    // Simulate progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 10
      setAiProcessingProgress(progress)
      if (progress >= 100) clearInterval(interval)
    }, 200)

    try {
      const extracted = await mockAiMenuUpload(aiMenuFile, selectedMenu.id)
      setAiExtractedItems(extracted.map((item) => ({ ...item, ai_extracted: true })))
      setAiOnboardingStep("review")
    } catch (error: any) {
      toast({
        title: "Error de IA",
        description: error.message || "No se pudo procesar el menú.",
        variant: "destructive",
      })
      setAiOnboardingStep("upload") // Go back to upload step
    }
  }

  const handleAcceptAiItem = async (item: MenuItem) => {
    if (!selectedMenu) return
    try {
      await createMenuItem({
        digital_menu_id: selectedMenu.id,
        name: item.name,
        description: item.description,
        price: item.price,
        menu_category_id: item.menu_category_id || categories[0]?.id, // Default to first category if none
        // image_url: item.image_url, // AI might not extract images reliably
      })
      setAiExtractedItems((prev) => prev.filter((i) => i.name !== item.name)) // Basic removal, consider IDs if available
      fetchMenuItems(selectedMenu.id)
      toast({ title: "Elemento Añadido", description: `${item.name} ha sido añadido a tu menú.` })
      if (aiExtractedItems.length === 1) setAiOnboardingStep("complete")
    } catch (error: any) {
      toast({ title: "Error", description: `No se pudo añadir ${item.name}.`, variant: "destructive" })
    }
  }

  const handleAcceptAllAiItems = async () => {
    if (!selectedMenu || aiExtractedItems.length === 0) return

    toast({ title: "Procesando...", description: "Añadiendo todos los elementos extraídos." })
    for (const item of aiExtractedItems) {
      try {
        await createMenuItem({
          digital_menu_id: selectedMenu.id,
          name: item.name,
          description: item.description,
          price: item.price,
          menu_category_id: item.menu_category_id || categories[0]?.id,
        })
      } catch (error) {
        // Log error or collect failed items
        console.error(`Failed to add item ${item.name}:`, error)
      }
    }
    setAiExtractedItems([])
    fetchMenuItems(selectedMenu.id)
    setAiOnboardingStep("complete")
    toast({ title: "Proceso Completado", description: "Todos los elementos extraídos han sido procesados." })
  }

  const handleApplyTemplate = async (templateId: number) => {
    if (!selectedMenu) return
    try {
      await applyTemplateToMenu(selectedMenu.id, templateId)
      toast({ title: "Plantilla Aplicada", description: "La plantilla ha sido aplicada al menú exitosamente." })
      fetchMenus()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aplicar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const AiOnboardingComponent = () => {
    if (!selectedMenu)
      return (
        <Card className="mt-6 bg-neutral-50 border-neutral-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-neutral-700">Carga Rápida con IA</CardTitle>
            <CardDescription className="text-neutral-500">
              Selecciona o crea un menú digital primero para activar la carga con IA.
            </CardDescription>
          </CardHeader>
        </Card>
      )

    switch (aiOnboardingStep) {
      case "idle":
        return (
          <Card className="mt-6 bg-gradient-to-br from-warm-50 to-amber-100 border-warm-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-warm-700 flex items-center">
                <Wand2 className="mr-2 h-6 w-6 text-warm-500" />
                Carga Rápida con IA para "{selectedMenu.name}"
              </CardTitle>
              <CardDescription className="text-warm-600">
                ¿Tienes tu menú en un archivo? Súbelo y deja que nuestra IA extraiga los platillos por ti.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button
                onClick={() => setAiOnboardingStep("upload")}
                className="bg-warm-500 hover:bg-warm-600 text-white shadow-md"
              >
                <UploadCloud className="mr-2 h-5 w-5" /> Iniciar Carga con IA
              </Button>
              <p className="text-sm text-neutral-500 mt-3">o</p>
              <Button
                variant="link"
                onClick={() => handleOpenMenuItemDialog()}
                className="text-warm-600 hover:text-warm-700"
              >
                Añadir elementos manualmente
              </Button>
            </CardContent>
          </Card>
        )
      case "upload":
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Paso 1: Sube tu Menú</CardTitle>
              <CardDescription>Sube una imagen (JPG, PNG) o PDF de tu menú actual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleAiMenuFileChange}
                className="border-neutral-300 focus:border-warm-500 focus:ring-warm-500"
              />
              {aiMenuFile && <p className="text-sm text-neutral-600">Archivo seleccionado: {aiMenuFile.name}</p>}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setAiOnboardingStep("idle")}>
                Cancelar
              </Button>
              <Button
                onClick={startAiProcessing}
                disabled={!aiMenuFile}
                className="bg-warm-500 hover:bg-warm-600 text-white"
              >
                <Wand2 className="mr-2 h-4 w-4" /> Procesar con IA
              </Button>
            </CardFooter>
          </Card>
        )
      case "processing":
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Paso 2: Procesando con IA...</CardTitle>
              <CardDescription>Nuestra IA está analizando tu menú. Esto puede tomar unos momentos.</CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center">
              <Progress value={aiProcessingProgress} className="w-full [&>div]:bg-warm-500" />
              <p className="mt-3 text-sm text-neutral-600">{aiProcessingProgress}% completado</p>
            </CardContent>
          </Card>
        )
      case "review":
        return (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Paso 3: Revisa los Elementos Extraídos</CardTitle>
              <CardDescription>
                Hemos extraído estos elementos de tu menú. Confirma o edita antes de añadirlos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {aiExtractedItems.length === 0 && <p>No se pudieron extraer elementos o ya fueron procesados.</p>}
              {aiExtractedItems.map((item, index) => (
                <Card key={index} className="p-3 bg-neutral-50 border-neutral-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-neutral-800">{item.name}</p>
                      <p className="text-sm text-neutral-600">{item.description}</p>
                      <p className="text-sm text-warm-600 font-medium">{formatCurrency(item.price)}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          handleOpenMenuItemDialog({ ...item, id: 0 }) // Open edit dialog, treat as new
                          setAiExtractedItems((prev) => prev.filter((_, i) => i !== index)) // Remove from review list
                        }}
                      >
                        <Edit className="h-3 w-3 mr-1" /> Editar y Añadir
                      </Button>
                      <Button
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white"
                        onClick={() => handleAcceptAiItem(item)}
                      >
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Añadir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </CardContent>
            <CardFooter className="flex justify-between items-center mt-4">
              <Button variant="outline" onClick={() => setAiOnboardingStep("upload")}>
                Subir Otro
              </Button>
              {aiExtractedItems.length > 0 && (
                <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAcceptAllAiItems}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Añadir Todos los {aiExtractedItems.length} Restantes
                </Button>
              )}
              <Button
                onClick={() => setAiOnboardingStep("complete")}
                className="bg-warm-500 hover:bg-warm-600 text-white"
              >
                <SkipForward className="mr-2 h-4 w-4" /> Finalizar Revisión
              </Button>
            </CardFooter>
          </Card>
        )
      case "complete":
        return (
          <Card className="mt-6 bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-700 flex items-center">
                <CheckCircle2 className="mr-2 h-6 w-6" />
                ¡Carga con IA Completada!
              </CardTitle>
              <CardDescription className="text-green-600">
                Los elementos seleccionados han sido añadidos a "{selectedMenu?.name}". Puedes continuar añadiendo
                manualmente o subir otro menú.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex space-x-3">
              <Button onClick={() => setAiOnboardingStep("upload")} variant="outline">
                <UploadCloud className="mr-2 h-4 w-4" /> Subir Otro Menú
              </Button>
              <Button onClick={() => setAiOnboardingStep("idle")} className="bg-warm-500 hover:bg-warm-600 text-white">
                Volver al Inicio del Hub
              </Button>
            </CardContent>
          </Card>
        )
    }
  }

  const selectedMenuName = useMemo(() => {
    if (selectedMenu) return selectedMenu.name
    if (isMenuDialogOpen && !menus.find((m) => m.id === selectedMenu?.id)) return "Nuevo Menú" // For new menu dialog
    return "Selecciona un Menú"
  }, [selectedMenu, isMenuDialogOpen, menus])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Digital Menu Hub</h1>
            <p className="text-neutral-600">Gestiona tus menús digitales, sus elementos y categorías.</p>
          </div>
          <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
                onClick={() => handleOpenMenuDialog()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Menú Digital
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle>
                  {selectedMenu && menus.find((m) => m.id === selectedMenu.id)
                    ? "Editar Menú Digital"
                    : "Crear Menú Digital"}
                </DialogTitle>
                <DialogDescription>
                  {selectedMenu && menus.find((m) => m.id === selectedMenu.id)
                    ? "Realiza cambios en tu menú digital."
                    : "Crea un nuevo menú digital para tu restaurante."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUpdateMenu} className="grid gap-4 py-4">
                {" "}
                {/* Restored form */}
                {!menus.find((m) => m.id === selectedMenu?.id) && <input type="hidden" name="is_new" value="true" />}
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={selectedMenu?.name || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Estado
                  </Label>
                  <Select name="status" defaultValue={selectedMenu?.status || "draft"}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Activo</SelectItem>
                      <SelectItem value="draft">Borrador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                    {selectedMenu && menus.find((m) => m.id === selectedMenu.id) ? "Guardar cambios" : "Crear Menú"}
                  </Button>
                </DialogFooter>
              </form>{" "}
              {/* End of restored form */}
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Menus List */}
          <Card className="shadow-lg border-neutral-200 md:col-span-1">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-neutral-800">Tus Menús</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
              {menus.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">
                  <FileText className="mx-auto h-12 w-12 mb-3 text-neutral-400" />
                  <p>No hay menús digitales aún.</p>
                  <p className="text-sm">Crea uno para empezar.</p>
                </div>
              ) : (
                menus.map((menu) => (
                  <div
                    key={menu.id}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                              ${selectedMenu?.id === menu.id ? "bg-warm-100 border-warm-400 shadow-md ring-2 ring-warm-400" : "hover:bg-neutral-100 border-transparent border"}`}
                    onClick={() => setSelectedMenu(menu)}
                  >
                    <div>
                      <h3
                        className={`font-medium ${selectedMenu?.id === menu.id ? "text-warm-700" : "text-neutral-800"}`}
                      >
                        {menu.name}
                      </h3>
                      <p className={`text-xs ${selectedMenu?.id === menu.id ? "text-warm-600" : "text-neutral-500"}`}>
                        {menu.status === "active" ? "Activo" : "Borrador"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleOpenMenuDialog(menu)
                            }}
                          >
                            <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Editar Menú</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteMenu(menu.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Eliminar Menú</p>
                        </TooltipContent>
                      </Tooltip>
                      {/* Link to Manage Dishes page */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Link href={`/dashboard/menus/dishes/${menu.id}`} passHref>
                            <Button variant="ghost" size="icon" className="h-7 w-7">
                              <UtensilsCrossed className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                            </Button>
                          </Link>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Gestionar Platillos</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Menu Items & AI Onboarding */}
          <div className="md:col-span-2 space-y-6">
            <AiOnboardingComponent />

            {selectedMenu && (
              <Card className="shadow-lg border-neutral-200">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-neutral-800">Plantilla del Menú</CardTitle>
                  <CardDescription>
                    Selecciona una plantilla para personalizar la apariencia de tu menú.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {templates.map((template) => (
                      <Card
                        key={template.id}
                        className={`cursor-pointer transition-all duration-200 ${
                          selectedTemplateId === template.id
                            ? "ring-2 ring-warm-500 border-warm-300"
                            : "hover:border-warm-300"
                        }`}
                        onClick={() => setSelectedTemplateId(template.id)}
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
                      <Button variant="outline" size="sm" className="hidden sm:flex">
                        <QrCode className="mr-2 h-4 w-4" />
                        Generar QR
                      </Button>
                      <Button
                        onClick={() => handleApplyTemplate(selectedTemplateId)}
                        className="bg-warm-500 hover:bg-warm-600 text-white"
                      >
                        Aplicar Plantilla
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            <Card className="shadow-lg border-neutral-200">
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-neutral-800">
                    {selectedMenu ? `Elementos de: ${selectedMenu.name}` : "Selecciona un Menú para ver sus Elementos"}
                  </CardTitle>
                  {selectedMenu && <CardDescription>Añade, edita o elimina platillos y bebidas.</CardDescription>}
                </div>
                {selectedMenu && (
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <QrCode className="mr-2 h-4 w-4" />
                      Generar QR
                    </Button>
                    <Dialog
                      open={isMenuItemDialogOpen}
                      onOpenChange={(open) => {
                        setIsMenuItemDialogOpen(open)
                        if (!open) {
                          setCurrentMenuItem(null)
                          setMenuItemImageFile(null)
                          setMenuItemImagePreview(null)
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button
                          className="bg-warm-500 hover:bg-warm-600 text-white shadow-md"
                          onClick={() => handleOpenMenuItemDialog()}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo Elemento
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
                        <DialogHeader>
                          <DialogTitle>
                            {currentMenuItem ? "Editar Elemento del Menú" : "Crear Nuevo Elemento"}
                          </DialogTitle>
                          <DialogDescription>
                            {currentMenuItem
                              ? "Realiza cambios en este elemento del menú."
                              : "Añade un nuevo platillo o bebida a tu menú digital."}
                          </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreateUpdateMenuItem} className="grid gap-4 py-4">
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-name" className="text-right">
                              Nombre
                            </Label>
                            <Input
                              id="item-name"
                              name="name"
                              defaultValue={currentMenuItem?.name || ""}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-description" className="text-right">
                              Descripción
                            </Label>
                            <Textarea
                              id="item-description"
                              name="description"
                              defaultValue={currentMenuItem?.description || ""}
                              className="col-span-3"
                              rows={3}
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-price" className="text-right">
                              Precio
                            </Label>
                            <Input
                              id="item-price"
                              name="price"
                              type="number"
                              step="0.01"
                              defaultValue={currentMenuItem?.price || ""}
                              className="col-span-3"
                              required
                            />
                          </div>
                          <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="item-category" className="text-right">
                              Categoría
                            </Label>
                            <Select
                              name="menu_category_id"
                              defaultValue={currentMenuItem?.menu_category_id?.toString() || ""}
                            >
                              <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Selecciona una categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id.toString()}>
                                    {category.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-4 items-start gap-4">
                            <Label htmlFor="item-image" className="text-right pt-2">
                              Imagen
                            </Label>
                            <div className="col-span-3 space-y-2">
                              <Input
                                id="item-image"
                                type="file"
                                accept="image/*"
                                onChange={handleMenuItemImageChange}
                                className="text-sm"
                              />
                              {menuItemImagePreview && (
                                <div className="mt-2 relative w-32 h-32">
                                  <img
                                    src={menuItemImagePreview || "/placeholder.svg"}
                                    alt="Vista previa"
                                    className="rounded-md object-cover w-full h-full"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                    onClick={() => {
                                      setMenuItemImageFile(null)
                                      setMenuItemImagePreview(null)
                                    }}
                                  >
                                    <XCircle className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                          <DialogFooter>
                            <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                              {currentMenuItem ? "Guardar cambios" : "Crear Elemento"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
                {!selectedMenu ? (
                  <div className="text-center py-12 text-neutral-500">
                    <ImageIcon className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
                    <p className="text-lg">Selecciona un menú de la izquierda.</p>
                    <p className="text-sm">O crea uno nuevo para empezar a añadir platillos.</p>
                  </div>
                ) : menuItems.length === 0 && aiOnboardingStep !== "review" ? (
                  <div className="text-center py-12 text-neutral-500">
                    <XCircle className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
                    <p className="text-lg">Este menú no tiene elementos aún.</p>
                    <p className="text-sm">Usa la "Carga Rápida con IA" o añade elementos manualmente.</p>
                  </div>
                ) : (
                  menuItems.map((item) => (
                    <Card
                      key={item.id}
                      className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow bg-white"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            item.image_url ||
                            `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md border border-neutral-200"
                        />
                        <div>
                          <h3 className="font-medium text-neutral-800">{item.name}</h3>
                          <p className="text-xs text-neutral-500 max-w-xs truncate" title={item.description}>
                            {item.description || "Sin descripción"}
                          </p>
                          <p className="text-xs text-neutral-500">{item.category_name || "Sin categoría"}</p>
                          <div className="flex items-center space-x-1 mt-1">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <ChefHat className="h-3 w-3 text-green-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Vinculado a Receta (para costos)</p>
                              </TooltipContent>
                            </Tooltip>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Package className="h-3 w-3 text-blue-500 cursor-help" />
                              </TooltipTrigger>
                              <TooltipContent side="bottom">
                                <p>Control de Inventario Activo</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-neutral-900 text-sm">{formatCurrency(item.price)}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleOpenMenuItemDialog(item)}
                            >
                              <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Editar Elemento</p>
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleDeleteMenuItem(item.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Eliminar Elemento</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
