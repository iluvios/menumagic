"use client"

import type React from "react" // Ensure React is imported for client components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { XCircle } from "lucide-react"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
}

interface Category {
  id: number
  name: string
}

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentMenuItem: MenuItem | null
  menuItemImagePreview: string | null
  categories: Category[]
  onImageChange: (event: React.ChangeEvent<HTMLInputElement>) => void
  onRemoveImage: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  currentMenuItem,
  menuItemImagePreview,
  categories,
  onImageChange,
  onRemoveImage,
  onSubmit,
}: MenuItemFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>{currentMenuItem ? "Editar Elemento del Menú" : "Crear Nuevo Elemento"}</DialogTitle>
          <DialogDescription>
            {currentMenuItem
              ? "Realiza cambios en este elemento del menú."
              : "Añade un nuevo platillo o bebida a tu menú digital."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-name" className="text-right">
              Nombre
            </Label>
            <Input
              id="item-name"
              name="name"
              defaultValue={currentMenuItem?.name || ""}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="item-description"
              name="description"
              defaultValue={currentMenuItem?.description || ""}
              className="col-span-3"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-price" className="text-right">
              Precio
            </Label>
            <Input
              id="item-price"
              name="price"
              type="number"
              step="0.01"
              defaultValue={currentMenuItem?.price || ""}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-category" className="text-right">
              Categoría
            </Label>
            <Select name="menu_category_id" defaultValue={currentMenuItem?.menu_category_id?.toString() || ""}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona una categoría" />
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
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="item-image" className="text-right pt-2">
              Imagen
            </Label>
            <div className="col-span-3 space-y-2">
              <Input id="item-image" type="file" accept="image/*" onChange={onImageChange} className="text-sm" />
              {menuItemImagePreview && (
                <div className="mt-2 relative w-32 h-32">
                  <img
                    src={menuItemImagePreview || "/placeholder.svg"}
                    alt="Vista previa"
                    className="rounded-md object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={onRemoveImage}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
              {currentMenuItem ? "Guardar cambios" : "Crear Elemento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
