"use client"

import type React from "react"
import { useState, useEffect } from "react"
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
import { Loader2, Trash2 } from "lucide-react"
import Image from "next/image"
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu-studio-actions"
import { formatCurrency } from "@/lib/utils/client-formatters"

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
  categories,
  dishes,
}: MenuItemFormDialogProps) {
  const [name, setName] = useState(menuItem?.name || "")
  const [description, setDescription] = useState(menuItem?.description || "")
  const [price, setPrice] = useState(menuItem?.price?.toString() || "")
  const [categoryId, setCategoryId] = useState(menuItem?.menu_category_id?.toString() || "")
  const [isAvailable, setIsAvailable] = useState(menuItem?.is_available ?? true)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState(menuItem?.image_url || "")
  const [isSaving, setIsSaving] = useState(false)

  // Use props directly, no need for internal state for global data
  const allGlobalCategories = categories
  const allGlobalDishes = dishes

  useEffect(() => {
    // Reset form when dialog opens or menuItem changes
    if (isOpen) {
      setName(menuItem?.name || "")
      setDescription(menuItem?.description || "")
      setPrice(menuItem?.price?.toString() || "")
      setCategoryId(menuItem?.menu_category_id?.toString() || "")
      setIsAvailable(menuItem?.is_available ?? true)
      setPreviewImageUrl(menuItem?.image_url || "")
      setImageFile(null)
    }
  }, [isOpen, menuItem])

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
          imageFile === null && previewImageUrl === "" ? null : imageFile, // Pass null if image removed
        )
        toast.success("Menu item updated successfully.")
      } else {
        // Creating new menu item
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
          // image_file is handled inside createDish which is called by createMenuItem
        })
        toast.success("New dish and menu item created successfully.")
      }
      onSave() // Call parent's onSave to refresh data
      onOpenChange(false) // Close the dialog using the controlled prop
    } catch (error: any) {
      toast.error(error.message || "Failed to save menu item.")
      console.error("Error saving menu item:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{menuItem ? "Edit Menu Item" : "Add New Menu Item"}</DialogTitle>
          <DialogDescription>
            {menuItem
              ? "Make changes to your menu item here. This will update the global dish."
              : "Create a new dish for your menu."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" required />
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
            <Select onValueChange={setCategoryId} value={categoryId} required>
              <SelectTrigger className="col-span-3">
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
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="isAvailable" className="text-right">
              Available
            </Label>
            <Switch id="isAvailable" checked={isAvailable} onCheckedChange={setIsAvailable} className="col-span-3" />
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
  )
}
