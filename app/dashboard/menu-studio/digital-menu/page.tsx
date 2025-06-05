"use client"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  getDigitalMenus,
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  uploadQrCodeForDigitalMenu,
  getMenuItemsByMenuId,
  getMenuCategoriesForDigitalMenu,
  getMenuTemplates,
  deleteMenuItem,
  getAllGlobalCategories,
  applyTemplateToMenu,
} from "@/lib/actions/menu-studio-actions"
import type { DigitalMenu } from "@/lib/types"
import { PlusIcon } from "lucide-react"
import { DigitalMenuFormDialog } from "@/components/digital-menu-form-dialog"
import { DigitalMenusList } from "@/components/digital-menus-list"
import { QRDisplayDialog } from "@/components/qr-display-dialog"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import { CategoryFormDialog } from "@/components/category-form-dialog"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  reusable_menu_item_id?: number
}

interface GlobalCategory {
  id: number
  name: string
  type: string
  order_index: number
}

interface DigitalMenuCategory {
  id: number
  digital_menu_id: number
  category_id: number
  category_name: string
  order_index: number
}

interface MenuTemplate {
  id: number
  name: string
  description: string
  preview_image: string
}

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<DigitalMenu | null>(null)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [selectedMenuForQr, setSelectedMenuForQr] = useState<DigitalMenu | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<DigitalMenu | null>(null)

  // Dialog states
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false)
  const [isCategoryFormDialogOpen, setIsCategoryFormDialogOpen] = useState(false)

  // Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([])
  const [digitalMenuCategories, setDigitalMenuCategories] = useState<DigitalMenuCategory[]>([])
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null)
  const [currentCategoryToEdit, setCurrentCategoryToEdit] = useState<GlobalCategory | null>(null)

  // Initial data fetching
  useEffect(() => {
    fetchMenus()
    fetchTemplates()
    fetchGlobalCategories()
  }, [])

  // Fetch menu items and categories when selectedMenu changes
  useEffect(() => {
    if (selectedMenu) {
      fetchMenuItems(selectedMenu.id)
      fetchDigitalMenuCategories(selectedMenu.id)
      // Reset QR state
      setQrCodeUrl(null)
      setSelectedMenuForQr(null)
    } else {
      setMenuItems([])
      setDigitalMenuCategories([])
    }
  }, [selectedMenu])

  // Auto-select first menu
  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [selectedMenu, menus])

  const fetchMenus = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDigitalMenus()
      setMenus(data)
    } catch (err: any) {
      console.error("Failed to fetch digital menus:", err)
      setError("Failed to load digital menus. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const fetchMenuItems = async (menuId: number) => {
    try {
      const items = await getMenuItemsByMenuId(menuId)
      setMenuItems(items)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los elementos del menú.",
        variant: "destructive",
      })
      setMenuItems([])
    }
  }

  const fetchDigitalMenuCategories = async (menuId: number) => {
    try {
      const fetchedCategories = await getMenuCategoriesForDigitalMenu(menuId)
      setDigitalMenuCategories(fetchedCategories)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías del menú.",
        variant: "destructive",
      })
      setDigitalMenuCategories([])
    }
  }

  const fetchTemplates = async () => {
    try {
      const fetchedTemplates = await getMenuTemplates()
      setTemplates(fetchedTemplates)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las plantillas.",
        variant: "destructive",
      })
      setTemplates([])
    }
  }

  const fetchGlobalCategories = async () => {
    try {
      const fetchedCategories = await getAllGlobalCategories()
      setGlobalCategories(fetchedCategories)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías.",
        variant: "destructive",
      })
      setGlobalCategories([])
    }
  }

  const handleCreateOrUpdateMenu = async (menuData: { name: string; status: string }) => {
    try {
      if (editingMenu) {
        await updateDigitalMenu(editingMenu.id, menuData)
      } else {
        await createDigitalMenu(menuData)
      }
      await fetchMenus() // Re-fetch menus to update the list
      setIsFormDialogOpen(false)
      setEditingMenu(null)
    } catch (err: any) {
      console.error("Failed to save digital menu:", err)
      setError("Failed to save digital menu. Please try again.")
    }
  }

  const handleDeleteMenu = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this menu? This action cannot be undone.")) {
      try {
        await deleteDigitalMenu(id)
        await fetchMenus() // Re-fetch menus to update the list
      } catch (err: any) {
        console.error("Failed to delete digital menu:", err)
        setError("Failed to delete digital menu. Please try again.")
      }
    }
  }

  const handleEditMenu = (menu: DigitalMenu) => {
    setEditingMenu(menu)
    setIsFormDialogOpen(true)
  }

  const handleGenerateQr = async (menu: DigitalMenu) => {
    setSelectedMenuForQr(menu)
    if (menu.qr_code_url) {
      setQrCodeUrl(menu.qr_code_url)
      setIsQrDialogOpen(true)
    } else {
      // If no QR code exists, generate a placeholder or trigger generation logic
      // For now, we'll just show a placeholder and indicate it needs generation
      setQrCodeUrl(`/placeholder.svg?text=QR+Code+for+${encodeURIComponent(menu.name)}`)
      setIsQrDialogOpen(true)
      // In a real app, you'd trigger a server action here to generate and upload the QR
      // For example: await uploadQrCodeForDigitalMenu(menu.id, 'base64_image_data_here');
    }
  }

  const handleQrCodeGenerated = async (menuId: number, base64Image: string) => {
    try {
      const result = await uploadQrCodeForDigitalMenu(menuId, base64Image)
      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl)
        await fetchMenus() // Refresh menus to show updated QR URL
      }
    } catch (err: any) {
      console.error("Failed to upload QR code:", err)
      setError("Failed to upload QR code. Please try again.")
    }
  }

  const handleOpenMenuItemDialog = (item?: MenuItem) => {
    setCurrentMenuItem(item || null)
    setIsMenuItemDialogOpen(true)
  }

  const handleDeleteMenuItem = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este elemento del menú?")) {
      try {
        await deleteMenuItem(id)
        toast({ title: "Éxito", description: "Elemento del menú eliminado." })
        if (selectedMenu) fetchMenuItems(selectedMenu.id)
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el elemento del menú.",
          variant: "destructive",
        })
      }
    }
  }

  const handleOpenCategoryManager = (category?: GlobalCategory) => {
    setCurrentCategoryToEdit(category || null)
    setIsCategoryFormDialogOpen(true)
  }

  const handleCategoriesUpdated = () => {
    fetchGlobalCategories()
    if (selectedMenu) {
      fetchDigitalMenuCategories(selectedMenu.id)
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
      fetchMenus() // Refresh to get template name
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo aplicar la plantilla.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewMenu = () => {
    if (selectedMenu) {
      window.open(`/menu/${selectedMenu.id}`, "_blank")
    }
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Digital Menus</h1>
          <Button
            onClick={() => {
              setEditingMenu(null)
              setIsFormDialogOpen(true)
            }}
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            Nuevo Menú
          </Button>
        </div>

        {error && (
          <Card className="border-red-500 bg-red-50">
            <CardContent className="p-4 text-red-700">
              <p>{error}</p>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <Card>
            <CardContent className="p-6 text-center">Loading menus...</CardContent>
          </Card>
        ) : menus.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">No digital menus found. Create one to get started!</CardContent>
          </Card>
        ) : (
          <DigitalMenusList
            menus={menus}
            onEdit={handleEditMenu}
            onDelete={handleDeleteMenu}
            onGenerateQr={handleGenerateQr}
          />
        )}

        <DigitalMenuFormDialog
          isOpen={isFormDialogOpen}
          onOpenChange={setIsFormDialogOpen}
          onSubmit={handleCreateOrUpdateMenu}
          initialData={editingMenu}
        />

        {selectedMenuForQr && (
          <QRDisplayDialog
            isOpen={isQrDialogOpen}
            onOpenChange={setIsQrDialogOpen}
            qrCodeUrl={qrCodeUrl}
            menuId={selectedMenuForQr.id}
            menuName={selectedMenuForQr.name}
            onQrCodeGenerated={handleQrCodeGenerated}
          />
        )}

        {/* Dialogs */}
        <MenuItemFormDialog
          isOpen={isMenuItemDialogOpen}
          onOpenChange={setIsMenuItemDialogOpen}
          currentMenuItem={currentMenuItem}
          digitalMenuId={selectedMenu?.id}
          categories={globalCategories}
          onSaveSuccess={() => {
            if (selectedMenu) {
              fetchMenuItems(selectedMenu.id)
              fetchDigitalMenuCategories(selectedMenu.id)
            }
          }}
          onCategoriesUpdated={handleCategoriesUpdated}
          onOpenCategoryManager={() => handleOpenCategoryManager()}
        />

        <CategoryFormDialog
          isOpen={isCategoryFormDialogOpen}
          onOpenChange={setIsCategoryFormDialogOpen}
          currentCategory={currentCategoryToEdit}
          digitalMenuId={selectedMenu?.id}
          globalCategories={globalCategories}
          digitalMenuCategories={digitalMenuCategories}
          onSaveSuccess={handleCategoriesUpdated}
        />
      </div>
    </TooltipProvider>
  )
}
