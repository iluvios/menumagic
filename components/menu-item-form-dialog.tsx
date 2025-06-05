"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu-studio-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PlusIcon } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Helper function to safely convert price to number and format it for display
const formatPriceForDisplay = (price: number | string | undefined): string => {
  if (price === undefined || price === null) return "0.00"
  const numPrice = typeof price === "string" ? Number.parseFloat(price) : price
  return isNaN(numPrice) ? "0.00" : numPrice.toFixed(2)
}

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

interface Category {
  id: number
  name: string
  type: string
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

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentMenuItem: MenuItem | null
  digitalMenuId?: number
  categories: Category[]
  dishes: Dish[]
  onSaveSuccess: () => void
  onCategoriesUpdated: () => void
  onOpenCategoryManager: () => void
}

export function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  currentMenuItem,
  digitalMenuId,
  categories,
  dishes,
  onSaveSuccess,
  onCategoriesUpdated,
  onOpenCategoryManager,
}: MenuItemFormDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("new")
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [selectedDishId, setSelectedDishId] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (currentMenuItem) {
      setName(currentMenuItem.name || "")
      setDescription(currentMenuItem.description || "")
      setPrice(currentMenuItem.price?.toString() || "")
      setCategoryId(currentMenuItem.menu_category_id?.toString() || "")
      setImagePreview(currentMenuItem.image_url || null)
      setActiveTab("new") // Always show the edit form for existing items
    } else {
      resetForm()
    }
  }, [currentMenuItem, isOpen])

  const resetForm = () => {
    setName("")
    setDescription("")
    setPrice("")
    setCategoryId("")
    setSelectedDishId("")
    setImageFile(null)
    setImagePreview(null)
    setActiveTab("new")
    setSearchTerm("")
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!digitalMenuId) {
      toast({
        title: "Error",
        description: "No menu selected.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      if (activeTab === "existing" && selectedDishId) {
        // Adding an existing dish to the menu
        await createMenuItem({
          digital_menu_id: digitalMenuId,
          dish_id: Number.parseInt(selectedDishId),
        })
        toast({ title: "Success", description: "Dish added to menu." })
      } else {
        // Creating a new dish or updating an existing one
        if (!name || !price || !categoryId) {
          throw new Error("Name, price, and category are required.")
        }

        if (currentMenuItem) {
          // Update existing menu item
          await updateMenuItem(
            currentMenuItem.id,
            {
              name,
              description,
              price: Number.parseFloat(price),
              menu_category_id: Number.parseInt(categoryId),
            },
            imageFile,
          )
          toast({ title: "Success", description: "Menu item updated." })
        } else {
          // Create new menu item
          await createMenuItem(
            {
              digital_menu_id: digitalMenuId,
              name,
              description,
              price: Number.parseFloat(price),
              menu_category_id: Number.parseInt(categoryId),
            },
            imageFile,
          )
          toast({ title: "Success", description: "Menu item created." })
        }
      }

      onSaveSuccess()
      onOpenChange(false)
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save menu item.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filter dishes based on search term, ensuring dishes is an array
  const filteredDishes = (dishes || []).filter(
    (dish) =>
      dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dish.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{currentMenuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
          <DialogDescription>
            {currentMenuItem
              ? "Update the details of this menu item."
              : "Add a new item to your menu or select an existing dish."}
          </DialogDescription>
        </DialogHeader>

        {!currentMenuItem && (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Create New Dish</TabsTrigger>
              <TabsTrigger value="existing">Use Existing Dish</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-4">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Dish name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your dish"
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="category">Category</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs"
                        onClick={onOpenCategoryManager}
                      >
                        <PlusIcon className="h-3 w-3 mr-1" />
                        New Category
                      </Button>
                    </div>
                    <Select value={categoryId} onValueChange={setCategoryId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {(categories || []).map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">Image (Optional)</Label>
                  <div className="flex items-center gap-4">
                    <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                    {imagePreview && (
                      <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                        Remove
                      </Button>
                    )}
                  </div>
                  {imagePreview && (
                    <div className="mt-2">
                      <img
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        className="h-32 w-32 object-cover rounded-md border border-gray-200"
                      />
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : currentMenuItem ? "Update Item" : "Add Item"}
                  </Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="existing" className="mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="search">Search Dishes</Label>
                  <Input
                    id="search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or description"
                  />
                </div>

                <div className="border rounded-md overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    {filteredDishes.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">No dishes found</div>
                    ) : (
                      <div className="divide-y">
                        {filteredDishes.map((dish) => (
                          <div
                            key={dish.id}
                            className={`p-3 flex items-center gap-3 cursor-pointer hover:bg-gray-50 ${
                              selectedDishId === dish.id.toString() ? "bg-blue-50" : ""
                            }`}
                            onClick={() => setSelectedDishId(dish.id.toString())}
                          >
                            <input
                              type="radio"
                              checked={selectedDishId === dish.id.toString()}
                              onChange={() => setSelectedDishId(dish.id.toString())}
                              className="h-4 w-4"
                            />
                            <div className="flex-1">
                              <div className="font-medium">{dish.name}</div>
                              <div className="text-sm text-gray-500 line-clamp-1">{dish.description}</div>
                              <div className="text-sm font-medium">${formatPriceForDisplay(dish.price)}</div>
                            </div>
                            {dish.image_url && (
                              <img
                                src={dish.image_url || "/placeholder.svg"}
                                alt={dish.name}
                                className="h-12 w-12 object-cover rounded-md"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" onClick={handleSubmit} disabled={isSubmitting || !selectedDishId}>
                    {isSubmitting ? "Adding..." : "Add Selected Dish"}
                  </Button>
                </DialogFooter>
              </div>
            </TabsContent>
          </Tabs>
        )}

        {currentMenuItem && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dish name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your dish"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="category">Category</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-xs"
                    onClick={onOpenCategoryManager}
                  >
                    <PlusIcon className="h-3 w-3 mr-1" />
                    New Category
                  </Button>
                </div>
                <Select value={categoryId} onValueChange={setCategoryId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categories || []).map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="image">Image (Optional)</Label>
              <div className="flex items-center gap-4">
                <Input id="image" type="file" accept="image/*" onChange={handleImageChange} className="flex-1" />
                {imagePreview && (
                  <Button type="button" variant="outline" size="sm" onClick={handleRemoveImage}>
                    Remove
                  </Button>
                )}
              </div>
              {imagePreview && (
                <div className="mt-2">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Preview"
                    className="h-32 w-32 object-cover rounded-md border border-gray-200"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Update Item"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
