"use client"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  getDigitalMenus,
  deleteDigitalMenu,
  getMenuItemsByMenuId,
  getMenuCategoriesForDigitalMenu,
  getMenuTemplates,
  deleteMenuItem,
  getAllGlobalCategories,
  applyTemplateToMenu,
  getAllDishes,
  updateMenuItemOrder,
} from "@/lib/actions/menu-studio-actions"
import { processMenuWithAI, addAiItemToMenu } from "@/lib/actions/ai-menu-actions"
import type { DigitalMenu as DigitalMenuType } from "@/lib/types"
import { Upload } from 'lucide-react'
import { DigitalMenuFormDialog } from "@/components/digital-menu-form-dialog"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import { MenuTemplatesSection } from "@/components/menu-templates-section"
import { QRCodeCard } from "@/components/qr-code-card"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, PlusCircle, Trash2, Edit, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import Image from "next/image"
import { formatCurrency } from "@/lib/utils/client-formatters"

interface DigitalMenu {
  id: number
  name: string
  status: string
  template_id: number | null
  qr_code_url: string | null
}

interface MenuItem {
  id: number
  digital_menu_id: number
  dish_id: number
  order_index: number
  name: string
  description: string
  price: number
  image_url: string | null
  menu_category_id: number
  category_name: string
  is_available: boolean
}

interface Category {
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

interface MenuTemplate {
  id: number
  name: string
  description: string
}

interface ExtractedItemWithStatus {
  name: string
  description: string
  price: string
  category: string
  status?: "pending" | "added" | "error" | "exists"
  error?: string
}

// Helper to delay execution (for throttling)
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function SortableMenuItem({ item }: { item: MenuItem }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })
  const { toast } = useToast()

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between rounded-md border p-4 shadow-sm bg-white hover:bg-gray-50"
    >
      <div className="flex items-center gap-4 flex-1">
        {item.image_url && (
          <Image
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{item.name}</h3>
            <Badge variant="secondary">{item.category_name}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(item.price)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <MenuItemFormDialog
          menuItem={item}
          onSave={() => {
            toast({
              title: "Success",
              description: "Menu item updated successfully.",
            })
          }}
          categories={[]}
          dishes={[]}
        >
          <Button variant="ghost" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
        </MenuItemFormDialog>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            if (window.confirm(`Are you sure you want to remove "${item.name}"?`)) {
              try {
                await deleteMenuItem(item.id)
                toast({
                  title: "Success",
                  description: "Menu item removed.",
                })
              } catch (error) {
                toast({
                  title: "Error",
                  description: "Failed to remove menu item.",
                  variant: "destructive",
                })
                console.error("Error deleting menu item:", error)
              }
            }
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </div>
  )
}

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenuType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingMenu, setEditingMenu] = useState<DigitalMenuType | null>(null)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [selectedMenuForQr, setSelectedMenuForQr] = useState<DigitalMenuType | null>(null)
  const [digitalMenus, setDigitalMenus] = useState<DigitalMenu[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [menuCategories, setMenuCategories] = useState<DigitalMenuCategory[]>([])
  const [allGlobalCategories, setAllGlobalCategories] = useState<Category[]>([])
  const [allGlobalDishes, setAllGlobalDishes] = useState<Dish[]>([])
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<ExtractedItemWithStatus[]>([])
  const [aiUploadFile, setAiUploadFile] = useState<File | null>(null)
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false)
  const [isAiUploadOpen, setIsAiUploadOpen] = useState(false)
  const [isAddingAll, setIsAddingAll] = useState(false)

  // Data states
  const [globalCategories, setGlobalCategories] = useState<Category[]>([])
  const [digitalMenuCategoriesState, setDigitalMenuCategoriesState] = useState<DigitalMenuCategory[]>([])
  const [templates, setTemplates] = useState<MenuTemplate[]>([])
  const [dishes, setDishes] = useState<Dish[]>([])

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor))

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
      setQrCodeUrl(selectedMenu.qr_code_url)
      setSelectedMenuForQr(null)
    } else {
      setMenuItems([])
      setDigitalMenuCategoriesState([])
    }
  }, [selectedMenu])

  // Auto-select first menu
  useEffect(() => {
    if (menus.length > 0 && !selectedMenu) {
      setSelectedMenu(menus[0])
    }
  }, [menus])

  const fetchMenus = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getDigitalMenus()
      setMenus(data)
      setDigitalMenus(data)
      if (data.length > 0 && !selectedMenu) {
        setSelectedMenu(data[0])
      }
    } catch (err: any) {
      console.error("Failed to fetch digital menus:", err)
      setError("Failed to load digital menus. Please try again.")
      toast({
        title: "Error",
        description: "Failed to fetch digital menus.",
        variant: "destructive",
      })
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
        description: error.message || "Failed to load menu items.",
        variant: "destructive",
      })
      setMenuItems([])
    }
  }

  const fetchMenuCategories = async (menuId: number) => {
    try {
      const categories = await getMenuCategoriesForDigitalMenu(menuId)
      setMenuCategories(categories)
      setDigitalMenuCategoriesState(categories)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch menu categories.",
        variant: "destructive",
      })
    }
  }

  const fetchDigitalMenuCategories = async (menuId: number) => {
    try {
      const fetchedCategories = await getMenuCategoriesForDigitalMenu(menuId)
      setDigitalMenuCategoriesState(fetchedCategories)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load menu categories.",
        variant: "destructive",
      })
      setDigitalMenuCategoriesState([])
    }
  }

  const fetchTemplates = async () => {
    try {
      const fetchedTemplates = await getMenuTemplates()
      setTemplates(fetchedTemplates)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load templates.",
        variant: "destructive",
      })
      setTemplates([])
    }
  }

  const fetchGlobalCategories = async () => {
    try {
      const fetchedCategories = await getAllGlobalCategories()
      setAllGlobalCategories(fetchedCategories)
      setGlobalCategories(fetchedCategories)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories.",
        variant: "destructive",
      })
      setAllGlobalCategories([])
      setGlobalCategories([])
    }
  }

  const fetchGlobalData = async () => {
    try {
      const categories = await getAllGlobalCategories()
      setAllGlobalCategories(categories)
      setGlobalCategories(categories)
      const dishes = await getAllDishes()
      setAllGlobalDishes(dishes)
      setDishes(dishes)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch global data.",
        variant: "destructive",
      })
    }
  }

  const fetchDishes = async () => {
    try {
      const items = await getAllDishes()
      setDishes(items)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dishes.",
        variant: "destructive",
      })
      setDishes([])
    }
  }

  const handleApplyTemplate = async (templateId: number) => {
    if (!selectedMenu) {
      toast({
        title: "Error",
        description: "Please select a menu first.",
        variant: "destructive",
      })
      return
    }
    try {
      await applyTemplateToMenu(selectedMenu.id, templateId)
      toast({
        title: "Success",
        description: "Template applied successfully.",
      })
      fetchMenus()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to apply template.",
        variant: "destructive",
      })
    }
  }

  const handlePreviewMenu = () => {
    if (selectedMenu) {
      window.open(`/menu/${selectedMenu.id}`, "_blank")
    }
  }

  const handleAiUpload = async () => {
    if (!aiUploadFile || !selectedMenu) {
      toast({
        title: "Error",
        description: "Please select a file and a menu.",
        variant: "destructive",
      })
      return
    }

    setIsAiProcessing(true)
    setAiProgress(0)
    setAiExtractedItems([])
    setIsAiUploadOpen(false)
    toast({
      title: "Processing",
      description: "Processing menu with AI...",
    })

    try {
      const result = await processMenuWithAI(aiUploadFile, (progress) => {
        setAiProgress(progress)
      })

      if (result.success && result.extractedItems) {
        const itemsWithStatus = result.extractedItems.map((item) => ({
          ...item,
          status: "pending" as const,
        }))
        setAiExtractedItems(itemsWithStatus)
        setIsAiReviewOpen(true)
        toast({
          title: "Success",
          description: "AI processing complete. Review items.",
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "AI processing failed.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("AI upload error:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred during AI processing.",
        variant: "destructive",
      })
    } finally {
      setIsAiProcessing(false)
      setAiProgress(0)
      setAiUploadFile(null)
    }
  }

  const handleAddExtractedItemToMenu = async (item: ExtractedItemWithStatus, index: number) => {
    if (!selectedMenu) {
      toast({
        title: "Error",
        description: "Please select a menu first.",
        variant: "destructive",
      })
      return
    }

    // Update item status to processing
    setAiExtractedItems((prev) =>
      prev.map((prevItem, i) => (i === index ? { ...prevItem, status: "pending" as const } : prevItem)),
    )

    try {
      const result = await addAiItemToMenu(selectedMenu.id, item)

      if (result.success) {
        // Update item status to added
        setAiExtractedItems((prev) =>
          prev.map((prevItem, i) => (i === index ? { ...prevItem, status: "added" as const } : prevItem)),
        )
        toast({
          title: "Success",
          description: result.message || `Added "${item.name}" to menu.`,
        })
        fetchMenuItems(selectedMenu.id)
      } else {
        // Update item status to error
        const status = result.message === "already_exists" ? "exists" : "error"
        setAiExtractedItems((prev) =>
          prev.map((prevItem, i) =>
            i === index ? { ...prevItem, status: status as const, error: result.error } : prevItem,
          ),
        )
        toast({
          title: status === "exists" ? "Already Exists" : "Error",
          description: result.error,
          variant: status === "exists" ? "default" : "destructive",
        })
      }
    } catch (error: any) {
      setAiExtractedItems((prev) =>
        prev.map((prevItem, i) =>
          i === index ? { ...prevItem, status: "error" as const, error: error.message } : prevItem,
        ),
      )
      toast({
        title: "Error",
        description: `Failed to add "${item.name}": ${error.message}`,
        variant: "destructive",
      })
    }
  }

  const handleAddAllExtractedItemsToMenu = async () => {
    if (!selectedMenu || aiExtractedItems.length === 0) return

    const pendingItems = aiExtractedItems.filter((item) => item.status === "pending")
    if (pendingItems.length === 0) {
      toast({
        title: "Info",
        description: "No pending items to add.",
      })
      return
    }

    setIsAddingAll(true)
    let successCount = 0
    let failCount = 0
    let existsCount = 0

    // Process items with a delay between each to avoid rate limiting
    for (let i = 0; i < aiExtractedItems.length; i++) {
      const item = aiExtractedItems[i]
      if (item.status !== "pending") continue

      try {
        // Add a delay between requests to avoid rate limiting
        if (i > 0) {
          await delay(500) // 500ms delay between requests
        }

        const result = await addAiItemToMenu(selectedMenu.id, item)

        if (result.success) {
          setAiExtractedItems((prev) =>
            prev.map((prevItem, index) => (index === i ? { ...prevItem, status: "added" as const } : prevItem)),
          )
          successCount++
        } else {
          const status = result.message === "already_exists" ? "exists" : "error"
          setAiExtractedItems((prev) =>
            prev.map((prevItem, index) =>
              index === i ? { ...prevItem, status: status as const, error: result.error } : prevItem,
            ),
          )
          if (status === "exists") {
            existsCount++
          } else {
            failCount++
          }
        }
      } catch (error: any) {
        setAiExtractedItems((prev) =>
          prev.map((prevItem, index) =>
            index === i ? { ...prevItem, status: "error" as const, error: error.message } : prevItem,
          ),
        )
        failCount++
      }
    }

    let message = `Added ${successCount} items.`
    if (existsCount > 0) message += ` ${existsCount} items already existed.`
    if (failCount > 0) message += ` Failed to add ${failCount} items.`

    toast({
      title: "Batch Add Complete",
      description: message,
    })

    fetchMenuItems(selectedMenu.id)
    fetchMenuCategories(selectedMenu.id)
    setIsAddingAll(false)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id === over?.id) {
      return
    }

    const oldIndex = menuItems.findIndex((item) => item.id === active.id)
    const newIndex = menuItems.findIndex((item) => item.id === over?.id)

    if (oldIndex === -1 || newIndex === -1) return

    const newOrder = Array.from(menuItems)
    const [movedItem] = newOrder.splice(oldIndex, 1)
    newOrder.splice(newIndex, 0, movedItem)

    setMenuItems(newOrder)

    const updates = newOrder.map((item, index) => ({
      id: item.id,
      order_index: index,
    }))

    try {
      await updateMenuItemOrder(updates)
      toast({
        title: "Success",
        description: "Menu item order updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update menu item order.",
        variant: "destructive",
      })
      console.error("Error updating menu item order:", error)
      if (selectedMenu) {
        fetchMenuItems(selectedMenu.id)
      }
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "added":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "error":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "exists":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "added":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            Added
          </Badge>
        )
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "exists":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            Already Exists
          </Badge>
        )
      default:
        return <Badge variant="outline">Pending</Badge>
    }
  }

  const handleQrCodeGenerated = (newQrCodeUrl: string) => {
    setQrCodeUrl(newQrCodeUrl)
    setSelectedMenu((prev) => (prev ? { ...prev, qr_code_url: newQrCodeUrl } : null))
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h1 className="text-2xl font-bold">Digital Menu Studio</h1>
          <DigitalMenuFormDialog
            onSave={() => {
              fetchMenus()
              toast({
                title: "Success",
                description: "Digital menu saved successfully.",
              })
            }}
          >
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> New Menu
            </Button>
          </DigitalMenuFormDialog>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* 1. Menus as Cards */}
          <Card>
            <CardHeader>
              <CardTitle>Your Menus</CardTitle>
              <CardDescription>Select a menu to manage or create a new one.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : digitalMenus.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No menus found. Create your first menu to get started.</p>
                  <DigitalMenuFormDialog
                    onSave={() => {
                      fetchMenus()
                      toast({
                        title: "Success",
                        description: "Digital menu created successfully.",
                      })
                    }}
                  >
                    <Button>
                      <PlusCircle className="mr-2 h-4 w-4" /> Create First Menu
                    </Button>
                  </DigitalMenuFormDialog>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {digitalMenus.map((menu) => (
                    <Card
                      key={menu.id}
                      className={`cursor-pointer transition-all hover:shadow-md ${
                        selectedMenu?.id === menu.id ? "ring-2 ring-blue-500 bg-blue-50" : ""
                      }`}
                      onClick={() => setSelectedMenu(menu)}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{menu.name}</CardTitle>
                        <Badge variant={menu.status === "active" ? "default" : "secondary"} className="w-fit">
                          {menu.status}
                        </Badge>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(`/menu/${menu.id}`, "_blank")
                            }}
                          >
                            Preview
                          </Button>
                          <DigitalMenuFormDialog
                            digitalMenu={menu}
                            onSave={() => {
                              fetchMenus()
                              toast({
                                title: "Success",
                                description: "Menu updated successfully.",
                              })
                            }}
                          >
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DigitalMenuFormDialog>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedMenu && (
            <>
              {/* 2. Menu Items */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Menu Items</CardTitle>
                    <CardDescription>Add and manage dishes for this menu. Drag and drop to reorder.</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsAiUploadOpen(true)} disabled={isAiProcessing}>
                      {isAiProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing ({aiProgress.toFixed(0)}%)
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" /> AI Upload
                        </>
                      )}
                    </Button>
                    <MenuItemFormDialog
                      digitalMenuId={selectedMenu.id}
                      onSave={() => {
                        toast({
                          title: "Success",
                          description: "Menu item added successfully.",
                        })
                        fetchMenuItems(selectedMenu.id)
                        fetchGlobalData()
                      }}
                      categories={allGlobalCategories}
                      dishes={allGlobalDishes}
                    >
                      <Button>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                      </Button>
                    </MenuItemFormDialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAiProcessing && <Progress value={aiProgress} className="w-full mb-4" />}
                  {menuItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items added to this menu yet.</p>
                  ) : (
                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={menuItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                        <div className="space-y-2">
                          {menuItems.map((item) => (
                            <SortableMenuItem key={item.id} item={item} />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </CardContent>
              </Card>

              {/* 3. Templates */}
              <MenuTemplatesSection
                selectedMenu={selectedMenu}
                templates={templates}
                onApplyTemplate={handleApplyTemplate}
              />

              {/* 4. QR Code */}
              <QRCodeCard
                menuId={selectedMenu.id}
                menuName={selectedMenu.name}
                qrCodeUrl={qrCodeUrl}
                onQrCodeGenerated={handleQrCodeGenerated}
              />

              {/* 5. Menu Details (moved to bottom) */}
              <Card>
                <CardHeader>
                  <CardTitle>Menu Details</CardTitle>
                  <CardDescription>Manage your selected digital menu.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input value={selectedMenu.name} readOnly />
                    </div>
                    <div>
                      <Label>Status</Label>
                      <Input value={selectedMenu.status} readOnly />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <DigitalMenuFormDialog
                      digitalMenu={selectedMenu}
                      onSave={() => {
                        fetchMenus()
                        toast({
                          title: "Success",
                          description: "Menu updated successfully.",
                        })
                      }}
                    >
                      <Button variant="outline" className="flex-1">
                        <Edit className="mr-2 h-4 w-4" /> Edit Menu
                      </Button>
                    </DigitalMenuFormDialog>
                    <Button
                      variant="destructive"
                      className="flex-1"
                      onClick={async () => {
                        if (window.confirm(`Are you sure you want to delete "${selectedMenu.name}"?`)) {
                          try {
                            await deleteDigitalMenu(selectedMenu.id)
                            toast({
                              title: "Success",
                              description: "Digital menu deleted.",
                            })
                            setSelectedMenu(null)
                            fetchMenus()
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to delete digital menu.",
                              variant: "destructive",
                            })
                            console.error("Error deleting menu:", error)
                          }
                        }
                      }}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete Menu
                    </Button>
                    <Button className="flex-1" onClick={handlePreviewMenu}>
                      Preview Menu
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* AI Upload Dialog */}
        <Dialog open={isAiUploadOpen} onOpenChange={setIsAiUploadOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>AI Menu Extraction</DialogTitle>
              <DialogDescription>Upload a menu image to extract dishes and categories automatically.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setAiUploadFile(e.target.files?.[0] || null)}
                disabled={isAiProcessing}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAiUploadOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAiUpload} disabled={!aiUploadFile || isAiProcessing}>
                {isAiProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Process with AI
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Review Dialog */}
        <Dialog open={isAiReviewOpen} onOpenChange={setIsAiReviewOpen}>
          <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Review AI Extracted Items</DialogTitle>
              <DialogDescription>
                Review the dishes and categories extracted by AI. You can add them individually or all at once.
              </DialogDescription>
            </DialogHeader>

            {/* Add All Button at Top */}
            {aiExtractedItems.filter((item) => item.status === "pending").length > 0 && (
              <div className="flex justify-end mb-4">
                <Button onClick={handleAddAllExtractedItemsToMenu} disabled={isAddingAll} className="w-full md:w-auto">
                  {isAddingAll ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding Items...
                    </>
                  ) : (
                    <>Add All Pending Items ({aiExtractedItems.filter((item) => item.status === "pending").length})</>
                  )}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {aiExtractedItems.length === 0 ? (
                <p className="text-center text-gray-500">No items extracted.</p>
              ) : (
                aiExtractedItems.map((item, index) => (
                  <Card key={index} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        {getStatusIcon(item.status)}
                        {getStatusBadge(item.status)}
                      </div>
                      <p className="text-sm text-gray-500">{item.description}</p>
                      <p className="text-sm font-medium">Price: {formatCurrency(Number.parseFloat(item.price))}</p>
                      <Badge variant="secondary" className="mt-1">
                        Category: {item.category}
                      </Badge>
                      {item.error && <p className="text-sm text-red-600 mt-1">{item.error}</p>}
                    </div>
                    <div className="ml-4">
                      {item.status === "pending" && (
                        <Button onClick={() => handleAddExtractedItemToMenu(item, index)}>Add to Menu</Button>
                      )}
                      {item.status === "added" && (
                        <Button disabled variant="outline">
                          <CheckCircle className="mr-2 h-4 w-4" /> Added
                        </Button>
                      )}
                      {item.status === "exists" && (
                        <Button disabled variant="outline">
                          <AlertCircle className="mr-2 h-4 w-4" /> Exists
                        </Button>
                      )}
                      {item.status === "error" && (
                        <Button variant="outline" onClick={() => handleAddExtractedItemToMenu(item, index)}>
                          Retry
                        </Button>
                      )}
                    </div>
                  </Card>
                ))
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAiReviewOpen(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  )
}
