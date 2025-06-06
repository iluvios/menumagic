"use client"

import type React from "react"

import { useState, useEffect, useTransition } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Loader2, ImageIcon, XCircle } from "lucide-react"
import { createReusableMenuItem, updateReusableMenuItem } from "@/lib/actions/reusable-menu-item-actions"

interface Category {
  id: number
  name: string
  type: string
}

interface ReusableMenuItem {
  id: number
  name: string
  description: string | null
  price: number
  category_id: number | null
  image_url: string | null
  is_available: boolean
}

interface ReusableMenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  reusableMenuItem?: ReusableMenuItem | null
  onSave: () => void
  categories: Category[]
}

export function ReusableMenuItemFormDialog({
  isOpen,
  onOpenChange,
  reusableMenuItem,
  onSave,
  categories,
}: ReusableMenuItemFormDialogProps) {
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  const [name, setName] = useState(reusableMenuItem?.name || "")
  const [description, setDescription] = useState(reusableMenuItem?.description || "")
  const [price, setPrice] = useState(reusableMenuItem?.price.toString() || "")
  const [categoryId, setCategoryId] = useState<string>(reusableMenuItem?.category_id?.toString() || "0")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imageUrlPreview, setImageUrlPreview] = useState<string | null>(reusableMenuItem?.image_url || null)
  const [isAvailable, setIsAvailable] = useState(reusableMenuItem?.is_available ?? true)

  useEffect(() => {
    if (reusableMenuItem) {
      setName(reusableMenuItem.name)
      setDescription(reusableMenuItem.description || "")
      setPrice(reusableMenuItem.price.toString())
      setCategoryId(reusableMenuItem.category_id?.toString() || "0")
      setImageUrlPreview(reusableMenuItem.image_url || null)
      setIsAvailable(reusableMenuItem.is_available)
    } else {
      setName("")
      setDescription("")
      setPrice("")
      setCategoryId("0")
      setImageFile(null)
      setImageUrlPreview(null)
      setIsAvailable(true)
    }
  }, [reusableMenuItem, isOpen])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setImageUrlPreview(URL.createObjectURL(file))
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImageUrlPreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const parsedPrice = Number.parseFloat(price)
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid positive price.",
        variant: "destructive",
      })
      return
    }

    if (!name.trim()) {
      toast({
        title: "Validation Error",
        description: "Dish name cannot be empty.",
        variant: "destructive",
      })
      return
    }

    const data = {
      name,
      description: description || null,
      price: parsedPrice,
      category_id: categoryId ? Number.parseInt(categoryId) : null,
      isAvailable,
    }

    startTransition(async () => {
      try {
        if (reusableMenuItem) {
          await updateReusableMenuItem(reusableMenuItem.id, data, imageFile === undefined ? undefined : imageFile)
          toast({
            title: "Success",
            description: "Dish updated successfully.",
          })
        } else {
          await createReusableMenuItem(data, imageFile)
          toast({
            title: "Success",
            description: "Dish created successfully.",
          })
        }
        onSave()
      } catch (error: any) {
        console.error("Error saving dish:", error)
        toast({
          title: "Error",
          description: error.message || "Failed to save dish.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{reusableMenuItem ? "Edit Dish" : "Add New Dish"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
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
              disabled={isPending}
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
              disabled={isPending}
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
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select value={categoryId} onValueChange={setCategoryId} disabled={isPending}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">No Category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="image" className="text-right">
              Image
            </Label>
            <div className="col-span-3 flex items-center gap-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="col-span-3"
                disabled={isPending}
              />
              {imageUrlPreview && (
                <div className="relative w-20 h-20 flex-shrink-0">
                  <img
                    src={imageUrlPreview || "/placeholder.svg"}
                    alt="Dish preview"
                    className="w-full h-full object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-background/80"
                    onClick={handleRemoveImage}
                    disabled={isPending}
                  >
                    <XCircle className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              )}
              {!imageUrlPreview && (
                <div className="w-20 h-20 flex-shrink-0 flex items-center justify-center rounded-md border bg-muted">
                  <ImageIcon className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
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
              disabled={isPending}
              className="col-span-3"
            />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {reusableMenuItem ? "Save Changes" : "Create Dish"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
