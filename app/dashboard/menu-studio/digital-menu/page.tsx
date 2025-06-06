"use client"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  getDigitalMenus,
  deleteDigitalMenu,
  uploadQrCodeForDigitalMenu,
  getMenuItemsByMenuId,
  getMenuTemplates,
  deleteMenuItem, // Keep this for actual deletion
  getAllGlobalCategories,
  applyTemplateToMenu,
  getAllDishes,
  updateDigitalMenu, // Import updateDigitalMenu for direct status change
} from "@/lib/actions/menu-studio-actions"
import { processMenuWithAI, addAiItemToMenu } from "@/lib/actions/ai-menu-actions"
import type { DigitalMenu as DigitalMenuType } from "@/lib/types" // Ensure this import is correct
import { Upload } from "lucide-react"
import { DigitalMenuFormDialog } from "@/components/digital-menu-form-dialog"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import { AddExistingDishDialog } from "@/components/add-existing-dish-dialog"
import { MenuTemplatesSection } from "@/components/menu-templates-section"
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
import { Loader2, PlusCircle, Trash2, Edit, CheckCircle, XCircle, AlertCircle, Library } from "lucide-react"
import { formatCurrency } from "@/lib/utils/client-formatters"
import { MenuItemCard } from "@/components/menu-item-card" // Import the new component
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select" // Import Select components
import { QRCodeGenerator } from "@/components/qr-code-generator" // Import the new QR component

// Re-defining interfaces here for clarity, but ideally they come from lib/types.ts
interface DigitalMenu extends DigitalMenuType {} // Use the imported type
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

export default function DigitalMenuHubPage() {
  const { toast } = useToast()
  const [menus, setMenus] = useState<DigitalMenuType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateMenuDialogOpen, setIsCreateMenuDialogOpen] = useState(false) // New state for create dialog
  const [isDigitalMenuFormDialogOpen, setIsDigitalMenuFormDialogOpen] = useState(false) // Renamed for clarity
  const [editingDigitalMenu, setEditingDigitalMenu] = useState<DigitalMenuType | null>(null) // Renamed for clarity
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [selectedMenu, setSelectedMenu] = useState<DigitalMenuType | null>(null) // Changed type to DigitalMenuType
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [allGlobalCategories, setAllGlobalCategories] = useState<Category[]>([])
  const [allGlobalDishes, setAllGlobalDishes] = useState<Dish[]>([])
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [aiProgress, setAiProgress] = useState(0)
  const [aiExtractedItems, setAiExtractedItems] = useState<ExtractedItemWithStatus[]>([])
  const [aiUploadFile, setAiUploadFile] = useState<File | null>(null)
  const [isAiReviewOpen, setIsAiReviewOpen] = useState(false)
  const [isAiUploadOpen, setIsAiUploadOpen] = useState(false)
  const [isAddingAll, setIsAddingAll] = useState(false)
  const [isMenuItemFormDialogOpen, setIsMenuItemFormDialogOpen] = useState(false) // State for MenuItemFormDialog
  const [isAddExistingDishDialogOpen, setIsAddExistingDishDialogOpen] = useState(false) // State for AddExistingDishDialog
  const [editingMenuItem, setEditingMenuItem] = useState<MenuItem | null>(null) // State for editing specific menu item
  const [deletingMenuItemId, setDeletingMenuItemId] = useState<number | null>(null) // State for deleting specific menu item

  // Data states (kept for consistency, but not all are used directly in this component)
  const [templates, setTemplates] = useState<MenuTemplate[]>([])

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
      setQrCodeUrl(selectedMenu.qr_code_url)
    } else {
      setMenuItems([])
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
      // If selectedMenu exists, find its updated version in the fetched data
      // and update the state to ensure template_id is current.
      if (selectedMenu) {
        const updatedSelectedMenu = data.find((menu) => menu.id === selectedMenu.id)
        if (updatedSelectedMenu) {
          setSelectedMenu(updatedSelectedMenu)
        } else if (data.length > 0) {
          // If previously selected menu was deleted, select the first one
          setSelectedMenu(data[0])
        } else {
          // No menus left
          setSelectedMenu(null)
        }
      } else if (data.length > 0) {
        // If no menu was selected, select the first one
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
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load categories.",
        variant: "destructive",
      })
      setAllGlobalCategories([])
    }
  }

  const fetchGlobalData = async () => {
    // This function fetches both categories and dishes for MenuItemFormDialog
    try {
      const categories = await getAllGlobalCategories()
      setAllGlobalCategories(categories)
      const dishes = await getAllDishes()
      setAllGlobalDishes(dishes)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch global data for menu items.",
        variant: "destructive",
      })
    }
  }

  const fetchDishes = async () => {
    try {
      const items = await getAllDishes()
      setAllGlobalDishes(items) // Use allGlobalDishes for the form
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load dishes.",
        variant: "destructive",
      })
      setAllGlobalDishes([])
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
      const result = await applyTemplateToMenu(selectedMenu.id, templateId)
      if (result.success) {
        toast({
          title: "Success",
          description: "Template applied successfully.",
        })
        // Explicitly update the selected menu's template_id for immediate UI feedback
        setSelectedMenu((prev) => (prev ? { ...prev, template_id: templateId } : null))
        // Re-fetch all menus to ensure the main menu list is also up-to-date
        fetchMenus()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to apply template.",
          variant: "destructive",
        })
      }
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
    setIsAddingAll(false)
  }

  const handleQrGenerated = async (base64Image: string) => {
    if (!selectedMenu) return

    try {
      const result = await uploadQrCodeForDigitalMenu(selectedMenu.id, base64Image)
      if (result.success) {
        setQrCodeUrl(result.qrCodeUrl)
        setSelectedMenu((prev) => (prev ? { ...prev, qr_code_url: result.qrCodeUrl } : null))
        toast({
          title: "Success",
          description: "QR code saved to menu!",
        })
      }
    } catch (error) {
      console.error("Error saving QR code:", error)
      toast({
        title: "Error",
        description: "Failed to save QR code.",
        variant: "destructive",
      })
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

  const handleEditDigitalMenu = (menu: DigitalMenuType) => {
    setEditingDigitalMenu(menu)
    setIsDigitalMenuFormDialogOpen(true)
  }

  const handleDeleteDigitalMenu = async (menu: DigitalMenuType) => {
    if (!window.confirm(`Are you sure you want to delete "${menu.name}"?`)) return

    try {
      await deleteDigitalMenu(menu.id)
      toast({
        title: "Success",
        description: "Digital menu deleted.",
      })
      setSelectedMenu(null) // Deselect the deleted menu
      fetchMenus() // Refresh the list
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete digital menu.",
        variant: "destructive",
      })
      console.error("Error deleting menu:", error)
    }
  }

  const handleEditMenuItem = (item: MenuItem) => {
    setEditingMenuItem(item)
    setIsMenuItemFormDialogOpen(true)
  }

  const handleDeleteMenuItem = async (itemId: number, itemName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${itemName}" from this menu?`)) return

    setDeletingMenuItemId(itemId) // Set deleting state for this item

    try {
      await deleteMenuItem(itemId)
      toast({
        title: "Success",
        description: "Menu item removed.",
      })
      fetchMenuItems(selectedMenu!.id) // Refresh menu items for the current menu
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove menu item.",
        variant: "destructive",
      })
      console.error("Error deleting menu item:", error)
    } finally {
      setDeletingMenuItemId(null) // Clear deleting state
    }
  }

  return (
    <TooltipProvider>
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h1 className="text-2xl font-bold">Digital Menu Studio</h1>
          {/* This button is for general "New Menu" at the top right of the page */}
          <Button
            onClick={() => {
              setEditingDigitalMenu(null) // Ensure it's for creation
              setIsCreateMenuDialogOpen(true)
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> New Menu
          </Button>
        </div>

        <div className="flex-1 p-4 space-y-6">
          {/* 1. Menus as Cards */}
          <Card>
            <CardHeader className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle>Your Menus</CardTitle>
                <CardDescription>Select a menu to manage or create a new one.</CardDescription>
              </div>
              {/* This is the "Add New Menu" button specifically for this section */}
              <Button
                onClick={() => {
                  setEditingDigitalMenu(null) // Ensure it's for creation
                  setIsCreateMenuDialogOpen(true)
                }}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Menu
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : menus.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">No menus found. Create your first menu to get started.</p>
                  {/* The "Add New Menu" button in the header now covers this case */}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {menus.map((menu) => (
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card selection when clicking edit button
                              handleEditDigitalMenu(menu)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation() // Prevent card selection when clicking delete button
                              handleDeleteDigitalMenu(menu)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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
              {/* 2. Menu Items (Dishes List) */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Menu Items</CardTitle>
                    <CardDescription>Add and manage dishes for this menu.</CardDescription>
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
                    <Button variant="outline" onClick={() => setIsAddExistingDishDialogOpen(true)}>
                      <Library className="mr-2 h-4 w-4" /> Add Existing
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingMenuItem(null) // Ensure we're adding a new item
                        setIsMenuItemFormDialogOpen(true)
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Create New
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {isAiProcessing && <Progress value={aiProgress} className="w-full mb-4" />}
                  {menuItems.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">No items added to this menu yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {menuItems.map((item) => (
                        <MenuItemCard
                          key={item.id}
                          item={item}
                          onEdit={handleEditMenuItem}
                          onDelete={handleDeleteMenuItem}
                          isDeleting={deletingMenuItemId === item.id}
                        />
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 3. Templates */}
              <MenuTemplatesSection
                selectedMenu={selectedMenu}
                templates={templates}
                onApplyTemplate={handleApplyTemplate}
              />

              {/* 4. QR Code - Updated with new component */}
              <Card>
                <CardHeader>
                  <CardTitle>QR Code</CardTitle>
                  <CardDescription>Generate and share a QR code for your digital menu.</CardDescription>
                </CardHeader>
                <CardContent>
                  <QRCodeGenerator
                    menuId={selectedMenu.id}
                    menuName={selectedMenu.name}
                    onQrGenerated={handleQrGenerated}
                  />
                </CardContent>
              </Card>

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
                      <Select
                        value={selectedMenu.status}
                        onValueChange={async (newStatus) => {
                          if (!selectedMenu) return
                          try {
                            // Ensure to send both name and new status
                            const result = await updateDigitalMenu(selectedMenu.id, {
                              name: selectedMenu.name,
                              status: newStatus as "active" | "inactive",
                            })
                            if (result.success) {
                              toast({ title: "Success", description: "Menu status updated." })
                              setSelectedMenu((prev) =>
                                prev ? { ...prev, status: newStatus as "active" | "inactive" } : null,
                              )
                              fetchMenus() // Re-fetch all menus to update the card list as well
                            } else {
                              throw new Error(result.error || "Failed to update menu status.")
                            }
                          } catch (error: any) {
                            toast({
                              title: "Error",
                              description: error.message || "Failed to update status.",
                              variant: "destructive",
                            })
                          }
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {/* Removed redundant Edit Menu button from here */}
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

        {/* MenuItemFormDialog for Add/Edit */}
        {isMenuItemFormDialogOpen && selectedMenu && (
          <MenuItemFormDialog
            isOpen={isMenuItemFormDialogOpen}
            onOpenChange={setIsMenuItemFormDialogOpen}
            digitalMenuId={selectedMenu.id}
            menuItem={editingMenuItem} // Pass the item for editing
            onSave={() => {
              toast({
                title: "Success",
                description: "Menu item saved successfully.",
              })
              setIsMenuItemFormDialogOpen(false)
              setEditingMenuItem(null)
              fetchMenuItems(selectedMenu.id) // Refresh the list
            }}
            categories={allGlobalCategories}
            dishes={allGlobalDishes}
          />
        )}

        {/* AddExistingDishDialog */}
        {isAddExistingDishDialogOpen && selectedMenu && (
          <AddExistingDishDialog
            isOpen={isAddExistingDishDialogOpen}
            onOpenChange={setIsAddExistingDishDialogOpen}
            digitalMenuId={selectedMenu.id}
            dishes={allGlobalDishes}
            onSave={() => {
              fetchMenuItems(selectedMenu.id) // Refresh the list
              setIsAddExistingDishDialogOpen(false)
            }}
          />
        )}

        {/* DigitalMenuFormDialog for Add New Digital Menu (controlled) */}
        {isCreateMenuDialogOpen && (
          <DigitalMenuFormDialog
            isOpen={isCreateMenuDialogOpen}
            onOpenChange={(open) => {
              console.log("DigitalMenuHubPage: Create dialog onOpenChange called with open:", open)
              setIsCreateMenuDialogOpen(open)
              if (!open) {
                setEditingDigitalMenu(null)
              }
            }}
            digitalMenu={null} // Explicitly null for creation
            onSave={async (newMenu) => {
              console.log("DigitalMenuHubPage: Create dialog onSave called with newMenu:", newMenu)
              setIsCreateMenuDialogOpen(false) // Explicitly close the dialog FIRST
              toast({
                title: "Success",
                description: "Digital menu created successfully.",
              })
              if (newMenu) {
                // Optimistically add the new menu to the list and select it
                setMenus((prevMenus) => [...prevMenus, newMenu])
                setSelectedMenu(newMenu)
              }
              await fetchMenus() // Re-fetch all menus to ensure full consistency
              console.log("DigitalMenuHubPage: Create dialog onSave finished.")
            }}
          />
        )}

        {/* DigitalMenuFormDialog for Edit Digital Menu (controlled) */}
        {isDigitalMenuFormDialogOpen && (
          <DigitalMenuFormDialog
            isOpen={isDigitalMenuFormDialogOpen}
            onOpenChange={(open) => {
              console.log("DigitalMenuHubPage: Edit dialog onOpenChange called with open:", open)
              setIsDigitalMenuFormDialogOpen(open)
              if (!open) {
                setEditingDigitalMenu(null)
              }
            }}
            digitalMenu={editingDigitalMenu}
            onSave={async (updatedMenu) => {
              console.log("DigitalMenuHubPage: Edit dialog onSave called with updatedMenu:", updatedMenu)
              setIsDigitalMenuFormDialogOpen(false) // Explicitly close the dialog FIRST
              setEditingDigitalMenu(null) // Clear editing state
              toast({
                title: "Success",
                description: "Digital menu updated successfully.",
              })
              if (updatedMenu) {
                setSelectedMenu(updatedMenu) // Update selected menu with fresh data
              }
              await fetchMenus() // Re-fetch to update the list
              console.log("DigitalMenuHubPage: Edit dialog onSave finished.")
            }}
          />
        )}
      </div>
    </TooltipProvider>
  )
}
