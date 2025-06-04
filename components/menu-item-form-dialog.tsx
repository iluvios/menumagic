"use client"

import type React from "react" // Ensure React is imported for client components
import { useState, useEffect } from "react" // Import useState and useEffect
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
import { XCircle, Loader2, PlusCircle } from "lucide-react" // Add Loader2 and PlusCircle
import { createMenuItem, updateMenuItem } from "@/lib/actions/menu-studio-actions" // Import actions
import { createCategory } from "@/lib/actions/category-actions" // Import createCategory
import { useToast } from "@/hooks/use-toast" // Import toast

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
  type: string // Ensure type is included for category creation
}

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentMenuItem: MenuItem | null // For editing
  digitalMenuId: number // The ID of the menu this item belongs to
  categories: Category[]
  onSaveSuccess: () => void // Callback to refresh parent list
  onCategoriesUpdated: () => void // New callback to refresh categories in parent
}

export function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  currentMenuItem,
  digitalMenuId,
  categories,
  onSaveSuccess,
  onCategoriesUpdated, // Destructure new prop
}: MenuItemFormDialogProps) {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: currentMenuItem?.name || "",
    description: currentMenuItem?.description || "",
    price: currentMenuItem?.price || 0,
    menu_category_id: currentMenuItem?.menu_category_id?.toString() || "",
    imageFile: null as File | null,
    current_image_url: currentMenuItem?.image_url || null,
  })

  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [isCategoryCreating, setIsCategoryCreating] = useState(false)

  // Reset form data when dialog opens/currentMenuItem changes
  useEffect(() => {
    setFormData({
      name: currentMenuItem?.name || "",
      description: currentMenuItem?.description || "",
      price: currentMenuItem?.price || 0,
      menu_category_id: currentMenuItem?.menu_category_id?.toString() || "",
      imageFile: null,
      current_image_url: currentMenuItem?.image_url || null,
    })
  }, [currentMenuItem, isOpen])

  const [state, setState] = useState<{ success?: boolean; message?: string; pending?: boolean } | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setState({ pending: true })

    const name = formData.name
    const description = formData.description
    const price = formData.price
    const menu_category_id = Number.parseInt(formData.menu_category_id)
    const imageFile = formData.imageFile

    if (!name || !description || isNaN(price) || !menu_category_id) {
      setState({ success: false, message: "Todos los campos obligatorios deben ser completados." })
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios.",
        variant: "destructive",
      })
      setState({ pending: false })
      return
    }

    console.log("Submitting menu item:", {
      digitalMenuId,
      name,
      description,
      price,
      menu_category_id,
      imageFile: imageFile?.name,
      isEditing: !!currentMenuItem,
      currentMenuItemId: currentMenuItem?.id,
    })

    try {
      if (currentMenuItem) {
        // Update existing item
        await updateMenuItem(
          currentMenuItem.id,
          {
            name,
            description,
            price,
            menu_category_id,
          },
          // Pass imageFile if new one selected, or null if current image cleared, otherwise undefined (no change)
          imageFile && imageFile.size > 0 ? imageFile : formData.current_image_url === null ? null : undefined,
        )
        toast({ title: "Éxito", description: "Platillo actualizado exitosamente." })
      } else {
        // Create new item
        await createMenuItem(
          {
            digital_menu_id: digitalMenuId,
            name,
            description,
            price,
            menu_category_id,
          },
          imageFile && imageFile.size > 0 ? imageFile : undefined,
        )
        toast({ title: "Éxito", description: "Platillo añadido exitosamente." })
      }
      onSaveSuccess() // Trigger parent to re-fetch data
      onOpenChange(false) // Close the dialog
      setState({ success: true, pending: false })
    } catch (err: any) {
      console.error("Form action error:", err)
      toast({
        title: "Error",
        description: err.message || "No se pudo guardar el platillo. Inténtalo de nuevo.",
        variant: "destructive",
      })
      setState({ success: false, message: err.message || "No se pudo guardar el platillo.", pending: false })
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, imageFile: e.target.files[0], current_image_url: null }) // Clear current URL if new file selected
    }
  }

  const handleRemoveImage = () => {
    setFormData({ ...formData, imageFile: null, current_image_url: null }) // Explicitly set to null to signal removal
  }

  const handleCreateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newCategoryName.trim()) {
      toast({ title: "Error", description: "El nombre de la categoría no puede estar vacío.", variant: "destructive" })
      return
    }
    setIsCategoryCreating(true)
    try {
      const newCat = await createCategory({ name: newCategoryName, type: "menu_item" }) // Using "menu_item"
      toast({ title: "Éxito", description: `Categoría "${newCat.name}" creada.` })
      onCategoriesUpdated() // Notify parent to re-fetch categories
      setNewCategoryName("")
      setIsCategoryDialogOpen(false)
      // Optionally, pre-select the new category in the main form
      setFormData((prev) => ({ ...prev, menu_category_id: newCat.id.toString() }))
    } catch (error: any) {
      console.error("Error creating category:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría.",
        variant: "destructive",
      })
    } finally {
      setIsCategoryCreating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl"
        aria-describedby="dialog-description"
      >
        {" "}
        {/* Added aria-describedby */}
        <DialogHeader>
          <DialogTitle>{currentMenuItem ? "Editar Elemento del Menú" : "Crear Nuevo Elemento"}</DialogTitle>
          <DialogDescription id="dialog-description">
            {" "}
            {/* Added id */}
            {currentMenuItem
              ? "Realiza cambios en este elemento del menú."
              : "Añade un nuevo platillo o bebida a tu menú digital."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-name" className="text-right">
              Nombre
            </Label>
            <Input
              id="item-name"
              name="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="item-category" className="text-right">
              Categoría
            </Label>
            <div className="col-span-3 flex gap-2">
              <Select
                name="menu_category_id"
                value={formData.menu_category_id}
                onValueChange={(value) => setFormData({ ...formData, menu_category_id: value })}
                required
              >
                <SelectTrigger className="flex-grow">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id.toString()} value={category.id.toString()}>
                      {" "}
                      {/* Ensure key is unique and string */}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={() => setIsCategoryDialogOpen(true)}>
                <PlusCircle className="h-4 w-4" />
                <span className="sr-only">Crear nueva categoría</span>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="item-image" className="text-right pt-2">
              Imagen
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="item-image"
                name="imageFile"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="text-sm"
              />
              {(formData.imageFile || formData.current_image_url) && (
                <div className="mt-2 relative w-32 h-32">
                  <img
                    src={
                      formData.imageFile
                        ? URL.createObjectURL(formData.imageFile)
                        : formData.current_image_url || "/placeholder.svg"
                    }
                    alt="Vista previa"
                    className="rounded-md object-cover w-full h-full"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={handleRemoveImage}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
          {state?.message && (
            <p className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>{state.message}</p>
          )}
          <DialogFooter>
            <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white" disabled={state?.pending}>
              {state?.pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : currentMenuItem ? (
                "Guardar cambios"
              ) : (
                "Crear Elemento"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* New Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[400px] bg-white p-6 rounded-lg shadow-xl">
          <DialogHeader>
            <DialogTitle>Crear Nueva Categoría</DialogTitle>
            <DialogDescription>Añade una nueva categoría para tus elementos del menú.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCategory} className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="new-category-name" className="text-right">
                Nombre
              </Label>
              <Input
                id="new-category-name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <DialogFooter>
              <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white" disabled={isCategoryCreating}>
                {isCategoryCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creando...
                  </>
                ) : (
                  "Crear Categoría"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  )
}
