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
import { toast } from "@/components/ui/use-toast"
import { Loader2, Trash2 } from "lucide-react"
import { createDish, updateDish } from "@/lib/actions/recipe-actions"
import Image from "next/image"
import { put } from "@vercel/blob"

interface DishFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  dish?: any // Existing dish data for editing
  categories: any[]
  onSaveSuccess: () => void
  children?: React.ReactNode
}

export function DishFormDialog({
  isOpen,
  onOpenChange,
  dish,
  categories,
  onSaveSuccess,
  children,
}: DishFormDialogProps) {
  const [name, setName] = useState(dish?.name || "")
  const [description, setDescription] = useState(dish?.description || "")
  const [price, setPrice] = useState(dish?.price?.toString() || "")
  const [categoryId, setCategoryId] = useState(dish?.menu_category_id?.toString() || "")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState(dish?.image_url || "")
  const [isSaving, setIsSaving] = useState(false)
  const [internalOpen, setInternalOpen] = useState(false)

  // Handle both controlled and uncontrolled modes
  const isControlled = isOpen !== undefined
  const isDialogOpen = isControlled ? isOpen : internalOpen

  useEffect(() => {
    if (isDialogOpen) {
      // Reset form when dialog opens
      setName(dish?.name || "")
      setDescription(dish?.description || "")
      setPrice(dish?.price?.toString() || "")
      setCategoryId(dish?.menu_category_id?.toString() || "")
      setPreviewImageUrl(dish?.image_url || "")
      setImageFile(null)
    }
  }, [isDialogOpen, dish])

  const handleOpenChange = (open: boolean) => {
    if (isControlled) {
      onOpenChange(open)
    } else {
      setInternalOpen(open)
    }
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setImageFile(file)
      setPreviewImageUrl(URL.createObjectURL(file))
    } else {
      setImageFile(null)
      setPreviewImageUrl(dish?.image_url || "")
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setPreviewImageUrl("")
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !categoryId) {
      toast({
        title: "Error",
        description: "Name, price, and category are required.",
        variant: "destructive",
      })
      return
    }

    setIsSaving(true)

    try {
      let imageUrl = previewImageUrl

      // Upload image if a new one was selected
      if (imageFile) {
        try {
          const filename = `dishes/${Date.now()}-${imageFile.name.replace(/[^a-zA-Z0-9.]/g, "_")}`
          const { url } = await put(filename, imageFile, { access: "public" })
          imageUrl = url
        } catch (uploadError) {
          console.error("Error uploading image:", uploadError)
          toast({
            title: "Warning",
            description: "Failed to upload image, but continuing with dish save.",
          })
        }
      }

      const dishData = {
        name,
        description,
        price: Number.parseFloat(price),
        menu_category_id: Number.parseInt(categoryId),
        image_url: imageUrl,
      }

      if (dish) {
        // Update existing dish
        await updateDish(dish.id, dishData)
      } else {
        // Create new dish
        await createDish(dishData)
      }

      toast({
        title: "Success",
        description: `Dish ${dish ? "updated" : "created"} successfully.`,
      })

      onSaveSuccess()
      handleOpenChange(false)
    } catch (error: any) {
      console.error("Error saving dish:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to save dish. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // If children are provided, make them trigger the dialog
  if (children) {
    return (
      <>
        <div onClick={() => handleOpenChange(true)}>{children}</div>
        <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{dish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
              <DialogDescription>
                {dish ? "Make changes to your dish here." : "Create a new dish for your menu."}
              </DialogDescription>
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
                <Select onValueChange={setCategoryId} value={categoryId} required>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
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
                <div className="col-span-3 flex flex-col gap-2">
                  {previewImageUrl && (
                    <div className="relative h-32 w-32">
                      <Image
                        src={previewImageUrl || "/placeholder.svg"}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="h-32 w-32 object-cover rounded-md"
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
                <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // Standard dialog without children trigger
  return (
    <Dialog open={isDialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{dish ? "Edit Dish" : "Add New Dish"}</DialogTitle>
          <DialogDescription>
            {dish ? "Make changes to your dish here." : "Create a new dish for your menu."}
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
            <div className="col-span-3 flex flex-col gap-2">
              {previewImageUrl && (
                <div className="relative h-32 w-32">
                  <Image
                    src={previewImageUrl || "/placeholder.svg"}
                    alt="Preview"
                    width={128}
                    height={128}
                    className="h-32 w-32 object-cover rounded-md"
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
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
