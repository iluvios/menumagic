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
  // Re-enabled imports for menu items and categories
  // These will cause errors if not re-exported by menu-studio-actions.ts
  getMenuItemsByMenuId,
  getMenuCategoriesForDigitalMenu,
  getAllGlobalCategories,
  deleteMenuItem,
} from "@/lib/actions/menu-studio-actions"
import { getTemplates, applyTemplateToMenu } from "@/lib/actions/template-actions"
import { processMenuWithAI } from "@/lib/actions/ai-menu-actions"
import type { DigitalMenu } from "@/lib/types"
import { PlusIcon } from "lucide-react"
import { DigitalMenuFormDialog } from "@/components/digital-menu-form-dialog"
import { DigitalMenusList } from "@/components/digital-menus-list"
import { QRDisplayDialog } from "@/components/qr-display-dialog"
import MenuItemFormDialog from "@/components/menu-item-form-dialog" // Re-enabled
import { CategoryFormDialog } from "@/components/category-form-dialog" // Re-enabled
import { AiOnboardingSection } from "@/components/ai-onboarding-section"
import { PersistentQrDisplay } from "@/components/persistent-qr-display"
import { CategoryReorderCard } from "@/components/category-reorder-card"
import { MenuItemsList } from "@/components/menu-items-list" // Import MenuItemsList component
import { MenuTemplatesSection } from "@/components/menu-templates-section"
// Re-enabled interfaces
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
  preview_image_url?: string
  thumbnail?: string
}

interface ExtractedMenuItem {
  name: string
  description: string
  price: number
  category: string
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

  // Re-enabled Dialog states
  const [isMenuItemDialogOpen, setIsMenuItemDialogOpen] = useState(false)
  const [isCategoryFormDialogOpen, setIsCategoryFormDialogOpen] = useState(false)

  // Re-enabled Data states
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [globalCategories, setGlobalCategories] = useState<GlobalCategory[]>([])
  const [digitalMenuCategories, setDigitalMenuCategories] = useState<DigitalMenuCategory[]>([])
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null)
  const [currentMenuItem, setCurrentMenuItem] = useState<MenuItem | null>(null)
  const [currentCategoryToEdit, setCurrentCategoryToEdit] = useState<GlobalCategory | null>(null)

  // AI Onboarding State
  const [aiOnboardingStep, setAiOnboardingStep] = useState<"idle" | "upload" | "processing" | "review" | "complete">(
    "idle",
  )
  const [aiMenuFile, setAiMenuFile] = useState<File | null>(null)
  const [aiProcessingProgress, setAiProcessingProgress] = useState<number>(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<ExtractedMenuItem[]>([])
  const [isProcessingBatch, setIsProcessingBatch] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)

  // Convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => {
        const result = reader.result as string
        // Remove the data:image/jpeg;base64, prefix
        const base64 = result.split(",")[1]
        resolve(base64)
      }
      reader.onerror = (error) => reject(error)
    })
  }

  const startAiProcessing = async (): Promise<void> => {
    if (!aiMenuFile) {
      toast({
        title: "Error",
        description: "Por favor selecciona un archivo primero.",
        variant: "destructive",
      })
      return
    }

    try {
      setAiOnboardingStep("processing")
      setAiProcessingProgress(0)

      // Convert file to base64
      const base64Image = await fileToBase64(aiMenuFile)

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAiProcessingProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      // Process with AI
      const result = await processMenuWithAI(base64Image)

      clearInterval(progressInterval)
      setAiProcessingProgress(100)

      // Set extracted items
      setAiExtractedItems(result.menuItems)
      setAiOnboardingStep("review")

      toast({
        title: "Éxito",
        description: `Se extrajeron ${result.menuItems.length} elementos del menú.`,
      })
    } catch (error: any) {
      console.error("Error processing menu with AI:", error)
      toast({
        title: "Error",
        description: error.message || "Error al procesar el menú con IA.",
        variant: "destructive",
      })
      setAiOnboardingStep("upload")
    }
  }

  const handleAcceptAiItem = async (item: ExtractedMenuItem) => {
    if (!selectedMenu) return

    try {
      // Find or create category
      let categoryId: number
      const existingCategory = globalCategories.find((cat) => cat.name.toLowerCase() === item.category.toLowerCase())

      if (existingCategory) {
        categoryId = existingCategory.id
      } else {
        // Create new category if it doesn't exist
        const { createCategory } = await import("@/lib/actions/category-actions")
        const newCategory = await createCategory(
          item.category,
          "menu_item", // Corrected: Pass name and type as separate arguments
        )
        categoryId = newCategory.id
        await fetchGlobalCategories() // Refresh categories
      }

      // Create menu item
      const { createMenuItem } = await import("@/lib/actions/menu-item-actions")
      await createMenuItem({
        name: item.name,
        description: item.description,
        price: item.price,
        digital_menu_id: selectedMenu.id,
        menu_category_id: categoryId,
      })

      // Remove item from extracted items
      setAiExtractedItems((prev) => prev.filter((extractedItem) => extractedItem !== item))

      // Refresh menu items
      await fetchMenuItems(selectedMenu.id)

      toast({
        title: "Éxito",
        description: `"${item.name}" añadido al menú.`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Error al añadir el elemento.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptAllAiItems = async () => {
    if (!selectedMenu || aiExtractedItems.length === 0) return

    try {
      setIsProcessingBatch(true)
      setProcessingProgress(0)

      // 1. Ensure globalCategories is up-to-date before starting
      const currentGlobalCategories = await getAllGlobalCategories()
      setGlobalCategories(currentGlobalCategories) // Update state with fresh data

      // Create a map for quick lookup of existing categories
      const existingCategoryMap: Record<string, number> = {}
      currentGlobalCategories.forEach((cat) => {
        existingCategoryMap[cat.name.toLowerCase()] = cat.id
      })

      // Identify unique categories from extracted items
      const uniqueExtractedCategories = Array.from(new Set(aiExtractedItems.map((item) => item.category.toLowerCase())))

      // Store newly created category IDs for this batch
      const newCategoryIdsInBatch: Record<string, number> = {}

      // 2. Create all missing categories first
      const { createCategory } = await import("@/lib/actions/category-actions")
      for (let i = 0; i < uniqueExtractedCategories.length; i++) {
        const categoryName = uniqueExtractedCategories[i]
        if (!existingCategoryMap[categoryName] && !newCategoryIdsInBatch[categoryName]) {
          try {
            const newCategory = await createCategory(categoryName, "menu_item")
            newCategoryIdsInBatch[categoryName] = newCategory.id
            // Optimistically add to globalCategories state for immediate use
            setGlobalCategories((prev) => [...prev, { ...newCategory, order_index: prev.length }])
          } catch (catError: any) {
            console.error(`Error creating category '${categoryName}':`, catError)
            // Decide how to handle: skip this category, or re-throw
            // For now, we'll log and continue, but items for this category might fail
            toast({
              title: "Error de categoría",
              description: `No se pudo crear la categoría "${categoryName}". Algunos elementos pueden fallar.`,
              variant: "destructive",
            })
          }
        }
        // Update progress for category creation phase (optional, but good for UX)
        setProcessingProgress(Math.round(((i + 1) / uniqueExtractedCategories.length) * 50)) // 50% for categories
      }

      // Re-fetch global categories to ensure all newly created ones are in the state
      // This is crucial after the category creation loop
      const updatedGlobalCategories = await getAllGlobalCategories()
      setGlobalCategories(updatedGlobalCategories)
      updatedGlobalCategories.forEach((cat) => {
        existingCategoryMap[cat.name.toLowerCase()] = cat.id // Update map with all current categories
      })

      // 3. Create all menu items
      const { createMenuItem } = await import("@/lib/actions/menu-item-actions")
      for (let i = 0; i < aiExtractedItems.length; i++) {
        const item = aiExtractedItems[i]
        const categoryNameLower = item.category.toLowerCase()
        const categoryId = existingCategoryMap[categoryNameLower] || newCategoryIdsInBatch[categoryNameLower]

        if (categoryId) {
          try {
            await createMenuItem({
              name: item.name,
              description: item.description,
              price: item.price,
              digital_menu_id: selectedMenu.id,
              menu_category_id: categoryId,
            })
          } catch (itemError: any) {
            console.error(`Error creating menu item '${item.name}':`, itemError)
            toast({
              title: "Error de elemento",
              description: `No se pudo añadir "${item.name}".`,
              variant: "destructive",
            })
          }
        } else {
          console.error(`Category ID not found for item '${item.name}' (category: '${item.category}')`)
          toast({
            title: "Error de categoría",
            description: `No se encontró la categoría para "${item.name}".`,
            variant: "destructive",
          })
        }
        // Update progress for menu item creation phase
        setProcessingProgress(50 + Math.round(((i + 1) / aiExtractedItems.length) * 50)) // Remaining 50% for items
      }

      // Final refresh of data after all items are processed
      await fetchMenuItems(selectedMenu.id)
      await fetchDigitalMenuCategories(selectedMenu.id)

      // Clear extracted items and complete
      setAiExtractedItems([])
      setAiOnboardingStep("complete")
      setIsProcessingBatch(false)

      toast({
        title: "Éxito",
        description: `Se han añadido ${aiExtractedItems.length} elementos al menú.`,
      })
    } catch (error: any) {
      setIsProcessingBatch(false)
      toast({
        title: "Error",
        description: error.message || "Error al añadir los elementos.",
        variant: "destructive",
      })
    }
  }

  // Initial data fetching
  useEffect(() => {
    fetchMenus()
    fetchTemplates()
    fetchGlobalCategories()
  }, [])

  // Fetch menu items and categories when selectedMenu changes (re-enabled)
  useEffect(() => {
    if (selectedMenu) {
      fetchMenuItems(selectedMenu.id)
      fetchDigitalMenuCategories(selectedMenu.id)
      // Set current template if menu has one
      setSelectedTemplateId(selectedMenu.template_id || null)
      // Reset QR state
      setQrCodeUrl(null)
      setSelectedMenuForQr(null)
    } else {
      setMenuItems([])
      setDigitalMenuCategories([])
      setSelectedTemplateId(null)
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

  // Re-enabled other fetch functions
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
      const fetchedTemplates = await getTemplates()
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
      setQrCodeUrl(`/placeholder.svg?text=QR+Code+for+${encodeURIComponent(menu.name)}`)
      setIsQrDialogOpen(true)
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

  // Re-enabled other handlers
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

  const handleSelectTemplate = (templateId: number) => {
    setSelectedTemplateId(templateId)
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

  const handleCustomizeTemplate = (templateId: number) => {
    // Placeholder for template customization
    console.log("Customizing template:", templateId)
    toast({
      title: "Personalización",
      description: "La personalización de plantillas estará disponible pronto.",
    })
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
            selectedMenu={selectedMenu} // Pass selectedMenu
            onSelectMenu={setSelectedMenu} // Pass setter for selection
          />
        )}

        {selectedMenu && (
          <div className="border-b pb-4">
            <h2 className="text-2xl font-bold text-gray-800">{selectedMenu.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              Status:{" "}
              <span className={selectedMenu.status === "active" ? "text-green-600" : "text-yellow-600"}>
                {selectedMenu.status}
              </span>
              {selectedMenu.created_at && ` • Created: ${new Date(selectedMenu.created_at).toLocaleDateString()}`}
              {selectedMenu.template_name && ` • Template: ${selectedMenu.template_name}`}
            </p>
          </div>
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
            publicMenuBaseUrl={process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"}
          />
        )}

        {/* Components in correct order when menu is selected */}
        {selectedMenu && (
          <>
            {/* 1. AI Upload Section */}
            <AiOnboardingSection
              selectedMenu={selectedMenu}
              aiOnboardingStep={aiOnboardingStep}
              setAiOnboardingStep={setAiOnboardingStep}
              aiMenuFile={aiMenuFile}
              setAiMenuFile={setAiMenuFile}
              aiProcessingProgress={aiProcessingProgress}
              startAiProcessing={startAiProcessing}
              aiExtractedItems={aiExtractedItems}
              handleAcceptAiItem={handleAcceptAiItem}
              handleAcceptAllAiItems={handleAcceptAllAiItems}
              handleOpenMenuItemDialog={handleOpenMenuItemDialog}
              isProcessingBatch={isProcessingBatch}
              processingProgress={processingProgress}
            />

            {/* 2. Menu Items/Dishes Section */}
            <div className="flex items-center justify-between mt-6">
              <h2 className="text-2xl font-bold">Menu Items for "{selectedMenu.name}"</h2>
              <Button onClick={() => handleOpenMenuItemDialog()} className="bg-warm-500 hover:bg-warm-600 text-white">
                <PlusIcon className="mr-2 h-5 w-5" />
                Add New Item
              </Button>
            </div>

            {menuItems.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">No menu items found for this menu.</CardContent>
              </Card>
            ) : (
              <MenuItemsList
                digitalMenuId={selectedMenu.id}
                items={menuItems}
                onItemUpdated={() => {
                  if (selectedMenu) fetchMenuItems(selectedMenu.id)
                }}
                onItemDeleted={() => {
                  if (selectedMenu) fetchMenuItems(selectedMenu.id)
                }}
              />
            )}

            {/* 3. Template Selection Section */}
            <MenuTemplatesSection
              selectedMenu={selectedMenu}
              templates={templates}
              selectedTemplateId={selectedTemplateId}
              onSelectTemplate={handleSelectTemplate}
              onApplyTemplate={handleApplyTemplate}
              onCustomizeTemplate={handleCustomizeTemplate}
            />

            {/* 4. QR Code Section */}
            <PersistentQrDisplay menuId={selectedMenu?.id} />

            {/* 5. Categories Section */}
            <CategoryReorderCard
              categories={digitalMenuCategories}
              onCategoriesUpdated={() => {
                if (selectedMenu) fetchDigitalMenuCategories(selectedMenu.id)
              }}
              onAddCategoryClick={() => handleOpenCategoryManager()}
            />
          </>
        )}

        {/* Re-enabled Dialogs (keep these, as they are triggered by buttons) */}
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
