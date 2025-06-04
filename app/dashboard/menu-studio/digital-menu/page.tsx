"use client"

import type React from "react" // Explicitly import React for client component JSX
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  getDigitalMenus,
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  getMenuItemsByMenuId, // Re-enabled
  deleteMenuItem, // Re-enabled
  mockAiMenuUpload, // Re-enabled
  applyTemplateToMenu, // Re-enabled
  getMenuTemplates, // Re-enabled
  createMenuItem, // Declared
} from "@/lib/actions/menu-studio-actions"
import { getCategoriesByType } from "@/lib/actions/category-actions" // Ensure this is imported
import { Plus } from "lucide-react"

// Import all necessary atomized components
import { DigitalMenuFormContent } from "@/components/digital-menu-form-content"
import { DigitalMenusList } from "@/components/digital-menus-list"
import { AiOnboardingSection } from "@/components/ai-onboarding-section" // Re-enabled
import { MenuTemplatesSection } from "@/components/menu-templates-section" // Re-enabled
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog" // Re-enabled
import { MenuItemsList } from "@/components/menu-items-list" // Re-enabled
import { TemplateCustomizationDialog } from "@/components/template-customization-dialog"

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
  category_name?: string // Added for display
}

interface Category {
  id: number
  name: string
  type: string // Added for filtering
}

type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<DigitalMenu | null>(null)

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)

  // State variables for menu item management
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false)
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null)

  // State variables for AI onboarding
  const [aiOnboardingStep, setAiOnboardingStep] = useState<AiOnboardingStep>("idle")
  const [aiMenuFile, setAiMenuFile] = useState<File | null>(null)
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<MenuItem[]>([])

  // State variables for templates
  const [templates, setTemplates] = useState<any[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [isTemplateCustomizationDialogOpen, setIsTemplateCustomizationDialogOpen] = useState(false) // Add this line
  const [templateToCustomizeId, setTemplateToCustomizeId] = useState<number | null>(null) // Add this line

  // Initial data fetching
  useEffect(() => {
    fetchMenus()
    fetchCategories() // Fetch categories on initial load
    fetchTemplates()
  }, [])

  // Fetch menu items when selectedMenu changes
  useEffect(() => {
    if (selectedMenu) {
      fetchMenuItems(selectedMenu.id)
      // Reset AI onboarding state when menu selection changes
      setAiOnboardingStep("idle")
      setAiMenuFile(null)
      setAiProcessingProgress(0)
      setAiExtractedItems([])
    } else {
      setMenuItems([]) // Clear items if no menu is selected
    }
  }, [selectedMenu])

  // Auto-select first menu if none is selected and dialog is closed
  useEffect(() => {
    if (menus.length > 0 && !selectedMenu && !isMenuDialogOpen) {
      setSelectedMenu(menus[0])
    }
  }, [selectedMenu, menus, isMenuDialogOpen])

  const fetchMenus = async () => {
    const data = await getDigitalMenus()
    setMenus(data)
    console.log("Menus fetched:", data)
  }

  const fetchMenuItems = async (menuId: number) => {
    try {
      const items = await getMenuItemsByMenuId(menuId)
      setMenuItems(items)
    } catch (error: any) {
      console.error("Failed to fetch menu items:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los elementos del menú.",
        variant: "destructive",
      })
      setMenuItems([])
    }
  }

  const fetchCategories = async () => {
    try {
      const fetchedCategories = await getCategoriesByType("menu_item") // ENSURED THIS IS "menu_item"
      setCategories(fetchedCategories)
    } catch (error: any) {
      console.error("Failed to fetch categories:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías.",
        variant: "destructive",
      })
      setCategories([])
    }
  }

  const fetchTemplates = async () => {
    try {
      const fetchedTemplates = await getMenuTemplates()
      setTemplates(fetchedTemplates)
    } catch (error: any) {
      console.error("Failed to fetch templates:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las plantillas.",
        variant: "destructive",
      })
      setTemplates([])
    }
  }

  const handleCreateUpdateMenu = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const status = formData.get("status") as string
    const isNewMenu = formData.get("is_new") === "true"

    console.log("--- handleCreateUpdateMenu Debug ---")
    console.log("isNewMenu from form:", isNewMenu)
    console.log("selectedMenu ID:", selectedMenu?.id)
    console.log("----------------------------------")

    try {
      let result: DigitalMenu | null = null
      if (!isNewMenu && selectedMenu?.id) {
        result = await updateDigitalMenu(selectedMenu.id, { name, status })
        toast({ title: "Menú actualizado", description: "El menú digital ha sido actualizado exitosamente." })
      } else {
        result = await createDigitalMenu({ name, status })
        toast({ title: "Menú creado", description: "El nuevo menú digital ha sido creado exitosamente." })
        if (result.id) setSelectedMenu({ id: result.id, name, status })
      }
      console.log("Server action result (create/update):", result)
      await fetchMenus()
      console.log("Menus state after fetchMenus in handler:", menus)
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

  // Menu Item Handlers
  const handleOpenMenuItemDialog = (item?: MenuItem) => {
    setCurrentMenuItem(item || null)
    setIsMenuItemDialogOpen(true)
  }

  const handleDeleteMenuItem = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este elemento del menú?")) {
      try {
        await deleteMenuItem(id)
        toast({ title: "Éxito", description: "Elemento del menú eliminado." })
        if (selectedMenu) fetchMenuItems(selectedMenu.id) // Refresh items for current menu
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el elemento del menú.",
          variant: "destructive",
        })
      }
    }
  }

  // AI Onboarding Handlers
  const handleAiFileChange = (file: File | null) => {
    setAiMenuFile(file)
    setAiOnboardingStep(file ? "upload" : "idle")
    setAiExtractedItems([]) // Clear previous extracted items
  }

  const startAiProcessing = async () => {
    if (!aiMenuFile || !selectedMenu) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un archivo de menú y un menú digital.",
        variant: "destructive",
      })
      return
    }

    setAiOnboardingStep("processing")
    setAiProcessingProgress(0)

    try {
      // Simulate progress
      let progress = 0
      const interval = setInterval(() => {
        progress += 10
        setAiProcessingProgress(Math.min(progress, 90))
        if (progress >= 90) clearInterval(interval)
      }, 300)

      const extracted = await mockAiMenuUpload(aiMenuFile, selectedMenu.id)
      clearInterval(interval)
      setAiProcessingProgress(100)
      setAiExtractedItems(extracted as MenuItem[]) // Cast to MenuItem[]
      setAiOnboardingStep("review")
      toast({ title: "Éxito", description: "Menú analizado por IA. Revisa los elementos." })
    } catch (error: any) {
      console.error("AI processing error:", error)
      toast({
        title: "Error",
        description: error.message || "Error al procesar el menú con IA.",
        variant: "destructive",
      })
      setAiOnboardingStep("idle")
      setAiProcessingProgress(0)
    }
  }

  const handleAcceptAiItem = async (item: MenuItem) => {
    if (!selectedMenu) return
    try {
      // Create the item in the database
      await createMenuItem(
        {
          digital_menu_id: selectedMenu.id,
          name: item.name,
          description: item.description,
          price: item.price,
          menu_category_id: item.menu_category_id,
        },
        item.image_url
          ? await fetch(item.image_url)
              .then((res) => res.blob())
              .then((blob) => new File([blob], "ai_image.png", { type: blob.type }))
          : undefined, // Simulate file from URL
      )
      toast({ title: "Éxito", description: `"${item.name}" añadido a tu menú.` })
      setAiExtractedItems((prev) => prev.filter((i) => i.id !== item.id)) // Remove from extracted list
      fetchMenuItems(selectedMenu.id) // Refresh the main menu items list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || `No se pudo añadir "${item.name}".`,
        variant: "destructive",
      })
    }
  }

  const handleAcceptAllAiItems = async () => {
    if (!selectedMenu || aiExtractedItems.length === 0) return
    try {
      for (const item of aiExtractedItems) {
        await createMenuItem(
          {
            digital_menu_id: selectedMenu.id,
            name: item.name,
            description: item.description,
            price: item.price,
            menu_category_id: item.menu_category_id,
          },
          item.image_url
            ? await fetch(item.image_url)
                .then((res) => res.blob())
                .then((blob) => new File([blob], "ai_image.png", { type: blob.type }))
            : undefined,
        )
      }
      toast({ title: "Éxito", description: "Todos los elementos de IA añadidos a tu menú." })
      setAiExtractedItems([])
      setAiOnboardingStep("complete")
      fetchMenuItems(selectedMenu.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al añadir todos los elementos de IA.",
        variant: "destructive",
      })
    }
  }

  const handleApplyTemplate = async (templateId: number) => {
    if (!selectedMenu) {
      toast({
        title: "Error",
        description: "Por favor, selecciona un menú digital para aplicar la plantilla.",
        variant: "destructive",
      })
      return
    }
    try {
      await applyTemplateToMenu(selectedMenu.id, templateId)
      toast({ title: "Éxito", description: "Plantilla aplicada exitosamente." })
      // Optionally, re-fetch menu details to show applied template
      fetchMenus()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aplicar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const handleOpenMenuDialog = () => {
    setIsMenuDialogOpen(true)
  }

  const handleOpenTemplateCustomizationDialog = (templateId: number) => {
    // Add this function
    setTemplateToCustomizeId(templateId)
    setIsTemplateCustomizationDialogOpen(true)
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Digital Menu Hub</h1>
            <p className="text-neutral-600">Gestiona tus menús digitales, sus elementos y categorías.</p>
          </div>
          {/* Dialog for creating/editing menus */}
          <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
                onClick={handleOpenMenuDialog}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Menú Digital
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
              <DigitalMenuFormContent selectedMenu={selectedMenu} menus={menus} onSubmit={handleCreateUpdateMenu} />
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <DigitalMenusList
            menus={menus}
            selectedMenu={selectedMenu}
            onSelectMenu={setSelectedMenu}
            onEditMenu={handleOpenMenuDialog}
            onDeleteMenu={handleDeleteMenu}
          />

          <div className="md:col-span-2 space-y-6">
            {selectedMenu && (
              <>
                <AiOnboardingSection
                  selectedMenu={selectedMenu}
                  aiOnboardingStep={aiOnboardingStep}
                  aiProcessingProgress={aiProcessingProgress}
                  aiExtractedItems={aiExtractedItems}
                  aiMenuFile={aiMenuFile}
                  onFileChange={handleAiFileChange}
                  onStartProcessing={startAiProcessing}
                  onAcceptItem={handleAcceptAiItem}
                  onAcceptAllItems={handleAcceptAllAiItems}
                  onCancel={() => setAiOnboardingStep("idle")}
                />

                <MenuTemplatesSection
                  selectedMenu={selectedMenu}
                  templates={templates}
                  selectedTemplateId={selectedTemplateId}
                  onSelectTemplate={setSelectedTemplateId}
                  onApplyTemplate={handleApplyTemplate}
                  onCustomizeTemplate={handleOpenTemplateCustomizationDialog} // Add this line
                />

                <MenuItemsList
                  selectedMenu={selectedMenu}
                  menuItems={menuItems}
                  aiOnboardingStep={aiOnboardingStep} // Pass AI step to potentially show empty state differently
                  onOpenMenuItemDialog={handleOpenMenuItemDialog}
                  onDeleteMenuItem={handleDeleteMenuItem}
                />

                <MenuItemFormDialog
                  isOpen={isMenuItemDialogOpen}
                  onOpenChange={setIsMenuItemDialogOpen}
                  currentMenuItem={currentMenuItem}
                  digitalMenuId={selectedMenu.id}
                  categories={categories}
                  onSaveSuccess={() => {
                    if (selectedMenu) fetchMenuItems(selectedMenu.id)
                  }}
                  onCategoriesUpdated={fetchCategories} // Pass the fetchCategories function
                />

                {/* Add the TemplateCustomizationDialog */}
                <TemplateCustomizationDialog
                  isOpen={isTemplateCustomizationDialogOpen}
                  onOpenChange={setIsTemplateCustomizationDialogOpen}
                  templateId={templateToCustomizeId}
                  onSaveSuccess={fetchTemplates} // Re-fetch templates after customization
                />
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
