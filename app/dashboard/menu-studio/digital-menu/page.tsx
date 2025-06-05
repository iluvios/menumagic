"use client"
import { useEffect, useState } from "react"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
  getAllDishes,
} from "@/lib/actions/menu-studio-actions"
import { processMenuWithAI, addAiItemToMenu } from "@/lib/actions/ai-menu-actions"
import type { DigitalMenu } from "@/lib/types"
import { PlusIcon, Eye, QrCode, Settings, Brain, Upload, X } from "lucide-react"
import { DigitalMenuFormDialog } from "@/components/digital-menu-form-dialog"
import { QRDisplayDialog } from "@/components/qr-display-dialog"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import { CategoryFormDialog } from "@/components/category-form-dialog"
import { MenuItemsList } from "@/components/menu-items-list"
import { MenuTemplatesSection } from "@/components/menu-templates-section"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  dish_id?: number
  is_available: boolean
  order_index: number
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
  preview_image_url: string
}

interface Dish {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  cost_per_serving?: number
}

type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

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
  const [dishes, setDishes] = useState<Dish[]>([])

  // AI states
  const [aiOnboardingStep, setAiOnboardingStep] = useState<AiOnboardingStep>("idle")
  const [aiMenuFile, setAiMenuFile] = useState<File | null>(null)
  const [aiProcessingProgress, setAiProcessingProgress] = useState(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<MenuItem[]>([])

  // Initial data fetching
  useEffect(() => {
    fetchMenus()
    fetchTemplates()
    fetchGlobalCategories()
    fetchDishes()
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

  const fetchDishes = async () => {
    try {
      const items = await getAllDishes()
      setDishes(items)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los platillos globales.",
        variant: "destructive",
      })
      setDishes([])
    }
  }

  const handleCreateOrUpdateMenu = async (menuData: { name: string; status: string }) => {
    try {
      if (editingMenu) {
        await updateDigitalMenu(editingMenu.id, menuData)
      } else {
        const newMenu = await createDigitalMenu(menuData)
        if (!selectedMenu) {
          setSelectedMenu(newMenu)
        }
      }
      await fetchMenus()
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
        if (selectedMenu?.id === id) {
          setSelectedMenu(null)
        }
        await fetchMenus()
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
        await fetchMenus()
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
      fetchMenus()
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

  // AI Functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAiMenuFile(file)
      setAiOnboardingStep("upload")
      toast({
        title: "File selected",
        description: `Selected ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`,
      })
    }
  }

  const startAiProcessing = async () => {
    if (!aiMenuFile || !selectedMenu) return

    setAiOnboardingStep("processing")
    setAiProcessingProgress(0)

    try {
      // Create a progress interval to show activity
      const progressInterval = setInterval(() => {
        setAiProcessingProgress((prev) => Math.min(prev + 5, 90))
      }, 500)

      // Create FormData for the upload
      const formData = new FormData()
      formData.append("menu", aiMenuFile)
      formData.append("menuId", selectedMenu.id.toString())

      // Process with AI
      const result = await processMenuWithAI(aiMenuFile)

      // Clear the interval and set to 100%
      clearInterval(progressInterval)
      setAiProcessingProgress(100)

      if (result.success && result.extractedItems) {
        setAiExtractedItems(result.extractedItems)
        setAiOnboardingStep("review")
        toast({
          title: "Menu Processed Successfully",
          description: `Found ${result.extractedItems.length} items in your menu.`,
        })
      } else {
        throw new Error(result.error || "Failed to process menu")
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to process menu with AI",
        variant: "destructive",
      })
      setAiOnboardingStep("upload")
    }
  }

  const handleAcceptAiItem = async (item: MenuItem) => {
    if (!selectedMenu) return

    try {
      await addAiItemToMenu(selectedMenu.id, item)

      setAiExtractedItems((prev) => prev.filter((i) => i !== item))
      toast({ title: "Éxito", description: `${item.name} añadido al menú.` })
      fetchMenuItems(selectedMenu.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir el elemento.",
        variant: "destructive",
      })
    }
  }

  const handleAcceptAllAiItems = async () => {
    if (!selectedMenu || aiExtractedItems.length === 0) return

    try {
      let successCount = 0
      for (const item of aiExtractedItems) {
        try {
          await addAiItemToMenu(selectedMenu.id, item)
          successCount++
        } catch (itemError) {
          console.error(`Failed to add item ${item.name}:`, itemError)
        }
      }

      setAiExtractedItems([])
      toast({
        title: "Éxito",
        description: `${successCount} elementos añadidos al menú.`,
      })
      fetchMenuItems(selectedMenu.id)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron añadir todos los elementos.",
        variant: "destructive",
      })
    }
  }

  const renderAiReviewSection = () => {
    if (aiOnboardingStep !== "review") return null

    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Review Extracted Items</CardTitle>
              <CardDescription>
                We found {aiExtractedItems.length} items in your menu. Review and add them to your digital menu.
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" onClick={() => setAiOnboardingStep("idle")}>
              <X className="h-4 w-4 mr-1" /> Close
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiExtractedItems.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-lg font-medium">All items have been added!</p>
              <Button onClick={() => setAiOnboardingStep("idle")} className="mt-4">
                Process Another Menu
              </Button>
            </div>
          ) : (
            <>
              <div className="flex justify-end">
                <Button onClick={handleAcceptAllAiItems}>Add All Items</Button>
              </div>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {aiExtractedItems.map((item, index) => (
                  <div
                    key={index}
                    className="border rounded-lg p-4 flex justify-between items-start hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{item.name}</h3>
                        <span className="text-lg font-bold text-green-600">
                          ${typeof item.price === "number" ? item.price.toFixed(2) : item.price}
                        </span>
                      </div>
                      {item.description && <p className="text-sm text-gray-600 mt-1">{item.description}</p>}
                      {item.category_name && (
                        <Badge variant="outline" className="mt-2">
                          {item.category_name}
                        </Badge>
                      )}
                    </div>
                    <Button size="sm" onClick={() => handleAcceptAiItem(item)}>
                      Add to Menu
                    </Button>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Digital Menu Studio</h1>
          <Button
            onClick={() => {
              setEditingMenu(null)
              setIsFormDialogOpen(true)
            }}
          >
            <PlusIcon className="mr-2 h-5 w-5" />
            New Menu
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
            <CardContent className="p-6 text-center">
              <p className="text-lg text-gray-600 mb-4">No digital menus found.</p>
              <Button
                onClick={() => {
                  setEditingMenu(null)
                  setIsFormDialogOpen(true)
                }}
              >
                <PlusIcon className="mr-2 h-5 w-5" />
                Create Your First Menu
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Menu Selection Sidebar */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle>Your Menus</CardTitle>
                  <CardDescription>Select a menu to manage</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {menus.map((menu) => (
                    <div
                      key={menu.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedMenu?.id === menu.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => setSelectedMenu(menu)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium">{menu.name}</h3>
                          <p className="text-sm text-gray-500">{menu.status}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handlePreviewMenu()
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateQr(menu)
                            }}
                          >
                            <QrCode className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-2">
              {selectedMenu ? (
                <div className="space-y-6">
                  {/* AI Review Section - Only shown when in review step */}
                  {renderAiReviewSection()}

                  {/* Menu Items Section */}
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Menu Items for "{selectedMenu.name}"</CardTitle>
                          <CardDescription>Manage your menu items and categories</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {/* AI Upload Button */}
                          <div className="relative">
                            <Input
                              type="file"
                              accept="image/*"
                              id="ai-menu-upload"
                              onChange={handleFileChange}
                              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                            />
                            <Button
                              variant="outline"
                              onClick={() => document.getElementById("ai-menu-upload")?.click()}
                              className="relative z-0"
                            >
                              <Brain className="mr-2 h-4 w-4" />
                              AI Extract
                            </Button>
                          </div>

                          {/* Add Item Button */}
                          <Button onClick={() => handleOpenMenuItemDialog()}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Item
                          </Button>
                        </div>
                      </div>

                      {/* AI Processing UI */}
                      {aiOnboardingStep === "processing" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <div className="flex flex-col items-center">
                            <Brain className="h-8 w-8 text-blue-500 animate-pulse mb-2" />
                            <p className="text-sm font-medium mb-2">Extracting menu items...</p>
                            <Progress value={aiProcessingProgress} className="w-full" />
                            <p className="text-xs text-gray-500 mt-1">{aiProcessingProgress}% complete</p>
                          </div>
                        </div>
                      )}

                      {/* AI Upload UI */}
                      {aiMenuFile && aiOnboardingStep === "upload" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="mr-3 text-blue-500">
                              <Upload className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-medium">{aiMenuFile.name}</p>
                              <p className="text-xs text-gray-500">{(aiMenuFile.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setAiMenuFile(null)
                                setAiOnboardingStep("idle")
                              }}
                            >
                              Cancel
                            </Button>
                            <Button size="sm" onClick={startAiProcessing}>
                              Process with AI
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      {menuItems.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-gray-500 mb-4">No menu items yet.</p>
                          <Button onClick={() => handleOpenMenuItemDialog()}>
                            <PlusIcon className="mr-2 h-4 w-4" />
                            Add Your First Item
                          </Button>
                        </div>
                      ) : (
                        <MenuItemsList
                          digitalMenuId={selectedMenu.id}
                          items={menuItems}
                          onItemUpdated={() => fetchMenuItems(selectedMenu.id)}
                          onItemDeleted={() => fetchMenuItems(selectedMenu.id)}
                        />
                      )}
                    </CardContent>
                  </Card>

                  {/* Templates Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Menu Templates</CardTitle>
                      <CardDescription>Choose a template for your menu</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <MenuTemplatesSection
                        templates={templates}
                        selectedMenu={selectedMenu}
                        onApplyTemplate={handleApplyTemplate}
                      />
                    </CardContent>
                  </Card>

                  {/* Settings Section */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Menu Settings</CardTitle>
                      <CardDescription>Configure your menu settings</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Button onClick={() => handleEditMenu(selectedMenu)}>
                          <Settings className="mr-2 h-4 w-4" />
                          Edit Menu Details
                        </Button>
                        <Button variant="outline" onClick={() => handleGenerateQr(selectedMenu)}>
                          <QrCode className="mr-2 h-4 w-4" />
                          QR Code
                        </Button>
                        <Button variant="outline" onClick={handlePreviewMenu}>
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </div>
                      <Separator />
                      <div>
                        <Button variant="destructive" onClick={() => handleDeleteMenu(selectedMenu.id)}>
                          Delete Menu
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-lg text-gray-600">Select a menu to start managing</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Dialogs */}
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

        <MenuItemFormDialog
          isOpen={isMenuItemDialogOpen}
          onOpenChange={setIsMenuItemDialogOpen}
          currentMenuItem={currentMenuItem}
          digitalMenuId={selectedMenu?.id}
          categories={globalCategories}
          dishes={dishes}
          onSaveSuccess={() => {
            if (selectedMenu) {
              fetchMenuItems(selectedMenu.id)
              fetchDigitalMenuCategories(selectedMenu.id)
              fetchDishes()
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
