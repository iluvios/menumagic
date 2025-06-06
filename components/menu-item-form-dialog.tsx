"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2, Plus, Trash2 } from "lucide-react"
import Image from "next/image"
import { createMenuItem, updateMenuItem, getAllGlobalCategories, getAllDishes } from "@/lib/actions/menu-studio-actions"
import { formatCurrency } from "@/lib/utils/client-formatters"
import { SimpleCategoryDialog } from "@/components/simple-category-dialog"

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  digitalMenuId?: number
  menuItem?: any // Existing menu item data for editing
  onSave: () => void
  categories: any[] // Global categories
  dishes: any[] // Global dishes
}

// Helper to safely format price for display
const formatPriceForDisplay = (price: string | number | null | undefined) => {
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  return numPrice != null && !isNaN(numPrice) ? formatCurrency(numPrice) : "$0.00"
}

export function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  digitalMenuId,
  menuItem,
  onSave,
  categories: initialCategories,
  dishes: initialDishes,
}: MenuItemFormDialogProps) {
  const [name, setName] = useState(menuItem?.name || "")
  const [description, setDescription] = useState(menuItem?.description || "")
  const [price, setPrice] = useState(menuItem?.price?.toString() || "")
  const [categoryId, setCategoryId] = useState(menuItem?.menu_category_id?.toString() || "")
  const [isAvailable, setIsAvailable] = useState(menuItem?.is_available ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState(menuItem?.image_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const [tab, setTab] = useState<"new" | "existing">(menuItem ? "new" : "new")
  const [selectedDishId, setSelectedDishId] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState<string>("")
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)

  const [allGlobalCategories, setAllGlobalCategories] = useState<any[]>(initialCategories || [])
  const [allGlobalDishes, setAllGlobalDishes] = useState<any[]>(initialDishes || [])

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      setName(menuItem?.name || "")
      setDescription(menuItem?.description || "")
      setPrice(menuItem?.price?.toString() || "")
      setCategoryId(menuItem?.menu_category_id?.toString() || "")
      setIsAvailable(menuItem?.is_available ?? true)
      setPreviewImageUrl(menuItem?.image_url || "")
      setImageFile(null)
      setTab(menuItem ? "new" : "new")
      setSelectedDishId(menuItem?.dish_id?.toString() || "")
      setSearchTerm("")
      fetchGlobalData()
    }
  }, [isOpen, menuItem])

  const fetchGlobalData = async () => {
    try {
      const categories = await getAllGlobalCategories()
      setAllGlobalCategories(categories)
      const dishes = await getAllDishes()
      setAllGlobalDishes(dishes)
    } catch (error) {
      toast.error("Failed to fetch global data.")
      console.error("Error fetching global data:", error)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewImageUrl(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setPreviewImageUrl(menuItem?.image_url || "")
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewImageUrl("")
  }

  const handleCategoryCreated = () => {
    fetchGlobalData() // Refresh categories
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      if (menuItem) {
        // Editing existing menu item (which updates the global dish)
        await updateMenuItem(
          menuItem.id,
          {
            name,
            description,
            price: Number.parseFloat(price),
            menu_category_id: Number.parseInt(categoryId),
            isAvailable,
          },
          imageFile === null && previewImageUrl === "" ? null : imageFile,
        )
        toast.success("Menu item updated successfully.")
      } else {
        // Creating new menu item
        if (tab === "new") {
          if (!name || !price || !categoryId) {
            toast.error("Name, price, and category are required.")
            return
          }
          if (!digitalMenuId) {
            toast.error("Digital menu ID is missing.")
            return
          }
          await createMenuItem({
            digital_menu_id: digitalMenuId,
            name,
            description,
            price: Number.parseFloat(price),
            menu_category_id: Number.parseInt(categoryId),
            isAvailable,
          })
          toast.success("New dish and menu item created successfully.")
        } else {
          // Adding existing dish to menu
          if (!selectedDishId) {
            toast.error("Please select an existing dish.")
            return
          }
          if (!digitalMenuId) {
            toast.error("Digital menu ID is missing.")
            return
          }
          await createMenuItem({
            digital_menu_id: digitalMenuId,
            dish_id: Number.parseInt(selectedDishId),
          })
          toast.success("Existing dish added to menu successfully.")
        }
      }
      onSave()
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || "Failed to save menu item.")
      console.error("Error saving menu item:", error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredDishes = useMemo(() => {
    if (!Array.isArray(allGlobalDishes)) return []
    return allGlobalDishes.filter((dish) => dish.name.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [allGlobalDishes, searchTerm])

  const selectedDishDetails = useMemo(() => {
    return allGlobalDishes.find((dish) => dish.id === Number.parseInt(selectedDishId))
  }, [allGlobalDishes, selectedDishId])

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{menuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {menuItem
                ? "Make changes to your menu item here. This will update the global dish."
                : "Add a new dish to your menu or select an existing one."}
            </DialogDescription>
          </DialogHeader>
          {!menuItem && (
            <div className="flex space-x-2 border-b">
              <Button
                variant={tab === "new" ? "secondary" : "ghost"}
                onClick={() => setTab("new")}
                className="rounded-b-none"
              >
                Create New Dish
              </Button>
              <Button
                variant={tab === "existing" ? "secondary" : "ghost"}
                onClick={() => setTab("existing")}
                className="rounded-b-none"
              >
                Use Existing Dish
              </Button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            {tab === "new" || menuItem ? (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="price" className="text-right">
                    Price
                  </Label>
                  <Input
                    id="price"
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category" className="text-right">
                    Category
                  </Label>
                  <div className="col-span-3 flex gap-2">
                    <Select onValueChange={setCategoryId} value={categoryId} required>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(allGlobalCategories) &&
                          allGlobalCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCategoryDialogOpen(true)}
                      title="Add new category"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="isAvailable" className="text-right">
                    Available
                  </Label>
                  <Switch
                    id="isAvailable"
                    checked={isAvailable}
                    onCheckedChange={setIsAvailable}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="image" className="text-right">
                    Image
                  </Label>
                  <div className="col-span-3 flex flex-col gap-2">
                    {previewImageUrl && (
                      <div className="relative h-32 w-32">
                        <Image
                          src={previewImageUrl || "/placeholder.svg"}
                          alt="Preview"
                          layout="fill"
                          objectFit="cover"
                          className="rounded-md"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full p-0"
                          onClick={handleRemoveImage}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="searchDish" className="text-right">
                    Search Dish
                  </Label>
                  <Input
                    id="searchDish"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by dish name..."
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="selectDish" className="text-right">
                    Select Dish
                  </Label>
                  <Select onValueChange={setSelectedDishId} value={selectedDishId} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Select an existing dish" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredDishes.length === 0 ? (
                        <p className="p-2 text-sm text-gray-500">No dishes found.</p>
                      ) : (
                        filteredDishes.map((dish) => (
                          <SelectItem key={dish.id} value={dish.id.toString()}>
                            {dish.name} ({formatPriceForDisplay(dish.price)})
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>
                {selectedDishDetails && (
                  <div className="col-span-4 col-start-1 rounded-md border p-4">
                    <h4 className="font-semibold">{selectedDishDetails.name}</h4>
                    <p className="text-sm text-gray-500">{selectedDishDetails.description}</p>
                    <p className="text-sm font-medium">{formatPriceForDisplay(selectedDishDetails.price)}</p>
                    {selectedDishDetails.image_url && (
                      <Image
                        src={selectedDishDetails.image_url || "/placeholder.svg"}
                        alt={selectedDishDetails.name}
                        width={96}
                        height={96}
                        className="mt-2 h-24 w-24 rounded-md object-cover"
                      />
                    )}
                  </div>
                )}
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Simple Category Creation Dialog */}
      <SimpleCategoryDialog
        isOpen={isCategoryDialogOpen}
        onOpenChange={setIsCategoryDialogOpen}
        onCategoryCreated={handleCategoryCreated}
      />
    </>
  )
}
