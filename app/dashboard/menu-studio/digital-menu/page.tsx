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
  deleteDigitalMenu, // Re-enabled for DigitalMenusList
} from "@/lib/actions/menu-studio-actions"
import { Plus } from "lucide-react"

// Import only the necessary atomized components
import { DigitalMenuFormContent } from "@/components/digital-menu-form-content"
import { DigitalMenusList } from "@/components/digital-menus-list" // Re-enabled
// All other atomized components are commented out for now:
// import { AiOnboardingSection } from "@/components/ai-onboarding-section"
// import { MenuTemplatesSection } from "@/components/menu-templates-section"
// import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
// import { MenuItemsList } from "@/components/menu-items-list"

interface DigitalMenu {
  id: number
  name: string
  status: string
  qr_code_url?: string
}

// Removed MenuItem and Category interfaces as they are not used in this simplified view
// interface MenuItem { ... }
// interface Category { ... }

// Removed AiOnboardingStep type as it's not used in this simplified view
// type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenu[]>([])
  const [selectedMenu, setSelectedMenu] = useState<DigitalMenu | null>(null)

  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false)

  // Removed state variables related to disabled components
  // const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  // const [categories, setCategories] = useState<Category[]>([])
  // const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false)
  // const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null)
  // const [menuItemImageFile, setMenuItemImageFile] = useState<File | null>(null)
  // const [menuItemImagePreview, setMenuItemImagePreview] = useState<string | null>(null)
  // const [aiOnboardingStep, setAiOnboardingStep] = useState<AiOnboardingStep>("idle")
  // const [aiMenuFile, setAiMenuFile] = useState<File | null>(null)
  // const [aiProcessingProgress, setAiProcessingProgress] = useState(0)
  // const [aiExtractedItems, setAiExtractedItems] = useState<MenuItem[]>([])
  // const [templates, setTemplates] = useState<any[]>([])
  // const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)

  useEffect(() => {
    fetchMenus()
    // Removed calls to fetchCategories and fetchTemplates as they are not used
  }, [])

  useEffect(() => {
    // Simplified logic for selectedMenu
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [selectedMenu, menus])

  const fetchMenus = async () => {
    const data = await getDigitalMenus()
    setMenus(data)
  }

  // Removed fetchMenuItems, fetchCategories, fetchTemplates as they are not used
  // const fetchMenuItems = async (menuId: number) => { ... }
  // const fetchCategories = async () => { ... }
  // const fetchTemplates = async () => { ... }

  const handleCreateUpdateMenu = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const status = formData.get("status") as string

    try {
      if (selectedMenu?.id && !formData.get("is_new")) {
        const result = await updateDigitalMenu(selectedMenu.id, { name, status })
        toast({ title: "Menú actualizado", description: "El menú digital ha sido actualizado exitosamente." })
      } else {
        const result = await createDigitalMenu({ name, status })
        toast({ title: "Menú creado", description: "El nuevo menú digital ha sido creado exitosamente." })
        if (result.id) setSelectedMenu({ id: result.id, name, status })
      }
      fetchMenus()
      setIsMenuDialogOpen(false)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar el menú.", variant: "destructive" })
    }
  }

  const handleDeleteMenu = async (id: number) => {
    // Re-enabled
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

  // Removed handlers related to disabled components
  // const handleMenuItemImageChange = (event: React.ChangeEvent<HTMLInputElement>) => { ... }
  // const handleRemoveMenuItemImage = () => { ... }
  // const handleCreateUpdateMenuItem = async (event: React.FormEvent<HTMLFormElement>) => { ... }
  // const handleDeleteMenuItem = async (id: number) => { ... }
  // const handleOpenMenuItemDialog = (item?: MenuItem) => { ... }
  // const startAiProcessing = async () => { ... }
  // const handleAcceptAiItem = async (item: MenuItem) => { ... }
  // const handleAcceptAllAiItems = async () => { ... }
  // const handleApplyTemplate = async (templateId: number) => { ... }

  const handleOpenMenuDialog = (menu?: DigitalMenu) => {
    setSelectedMenu(menu || null)
    setIsMenuDialogOpen(true)
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
                onClick={() => handleOpenMenuDialog()}
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
          <DigitalMenusList // Re-enabled
            menus={menus}
            selectedMenu={selectedMenu}
            onSelectMenu={setSelectedMenu}
            onEditMenu={handleOpenMenuDialog}
            onDeleteMenu={handleDeleteMenu}
          />

          <div className="md:col-span-2 space-y-6">{/* Other components remain commented out */}</div>
        </div>
      </div>
    </TooltipProvider>
  )
}
