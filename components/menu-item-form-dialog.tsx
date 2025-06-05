"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu-studio-actions"
import { PlusCircle } from "lucide-react"
import { uploadImageToBlob } from "@/lib/utils/blob-helpers" // Use this instead of utapi

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

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentMenuItem: MenuItem | null
  digitalMenuId?: number
  categories: GlobalCategory[]
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
  onSaveSuccess,
  onCategoriesUpdated,
  onOpenCategoryManager,
}: MenuItemFormDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [categoryId, setCategoryId] = useState<string>("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when dialog opens/closes or currentMenuItem changes
  useEffect(() => {
    if (isOpen && currentMenuItem) {
      setName(currentMenuItem.name || "")
      setDescription(currentMenuItem.description || "")
      setPrice(currentMenuItem.price?.toString() || "")
      setCategoryId(currentMenuItem.menu_category_id?.toString() || "")
      setImagePreview(currentMenuItem.image_url || null)
      setImageFile(null)
    } else if (isOpen) {
      // New item, reset form
      setName("")
      setDescription("")
      setPrice("")
      setCategoryId("")
      setImagePreview(null)
      setImageFile(null)
    }
  }, [isOpen, currentMenuItem])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
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
        description: "No digital menu selected.",
        variant: "destructive",
      })
      return
    }

    if (!name || !price || !categoryId) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    try {
      setIsSubmitting(true)

      // Upload image if provided
      let imageUrl = currentMenuItem?.image_url
      if (imageFile) {
        imageUrl = await uploadImageToBlob(imageFile)
      } else if (imagePreview === null && currentMenuItem?.image_url) {
        // User removed the image
        imageUrl = null
      }

      const menuItemData = {
        name,
        description,
        price: Number.parseFloat(price),
        menu_category_id: Number.parseInt(categoryId),
        image_url: imageUrl,
        digital_menu_id: digitalMenuId,
      }

      if (currentMenuItem) {
        // Update existing item
        await updateMenuItem(currentMenuItem.id, menuItemData)
        toast({ title: "Success", description: "Menu item updated successfully." })
      } else {
        // Create new item
        await createMenuItem(menuItemData)
        toast({ title: "Success", description: "Menu item created successfully." })
      }

      onSaveSuccess()
      onOpenChange(false)
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

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{currentMenuItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name" required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Item description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Price *</Label>
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
              <Label htmlFor="category">Category *</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={onOpenCategoryManager}
              >
                <PlusCircle className="mr-1 h-3 w-3" />
                Manage Categories
              </Button>
            </div>
            <Select value={categoryId} onValueChange={setCategoryId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories
                  .filter((cat) => cat.type === "menu")
                  .sort((a, b) => a.order_index - b.order_index)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Image</Label>
            <div className="flex flex-col gap-2">
              {imagePreview && (
                <div className="relative w-full h-40 bg-gray-100 rounded-md overflow-hidden">
                  <img
                    src={imagePreview || "/placeholder.svg"}
                    alt="Item preview"
                    className="w-full h-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </Button>
                </div>
              )}
              {!imagePreview && <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : currentMenuItem ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
