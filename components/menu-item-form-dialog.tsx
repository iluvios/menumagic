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
import {
  createMenuItem,
  updateMenuItem,
  getReusableMenuItems,
  createReusableMenuItem,
  updateReusableMenuItem,
} from "@/lib/actions/menu-studio-actions"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, ChefHat, Settings } from "lucide-react"

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

interface ReusableMenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  ingredient_count: number
}

interface MenuItemFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  currentMenuItem?: MenuItem | null
  digitalMenuId?: number
  categories: GlobalCategory[]
  onSaveSuccess: () => void
  onCategoriesUpdated: () => void
  isReusableItemForm?: boolean
  onOpenCategoryManager?: () => void
}

export function MenuItemFormDialog({
  isOpen,
  onOpenChange,
  currentMenuItem,
  digitalMenuId,
  categories,
  onSaveSuccess,
  onCategoriesUpdated,
  isReusableItemForm = false,
  onOpenCategoryManager,
}: MenuItemFormDialogProps) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState<string>("new")
  const [name, setName] = useState(currentMenuItem?.name || "")
  const [description, setDescription] = useState(currentMenuItem?.description || "")
  const [price, setPrice] = useState(currentMenuItem?.price.toString() || "")
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | string>(currentMenuItem?.menu_category_id || "")

  // New state for reusable menu items
  const [reusableMenuItems, setReusableMenuItems] = useState<ReusableMenuItem[]>([])
  const [selectedReusableItemId, setSelectedReusableItemId] = useState<number | null>(null)
  const [isLoadingReusableItems, setIsLoadingReusableItems] = useState(false)

  // Ensure categories is always an array
  const safeCategories = categories || []

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      if (currentMenuItem) {
        setName(currentMenuItem.name || "")
        setDescription(currentMenuItem.description || "")
        setPrice(currentMenuItem.price.toString() || "")
        setSelectedCategoryId(currentMenuItem.menu_category_id || "")

        // If editing an item that's linked to a reusable item, switch to the "existing" tab
        if (!isReusableItemForm && currentMenuItem.reusable_menu_item_id) {
          setActiveTab("existing")
          setSelectedReusableItemId(currentMenuItem.reusable_menu_item_id)
        } else {
          setActiveTab("new")
          setSelectedReusableItemId(null)
        }
      } else {
        // New item defaults
        setName("")
        setDescription("")
        setPrice("")
        setSelectedCategoryId("")
        setActiveTab("new")
        setSelectedReusableItemId(null)
      }

      // Fetch reusable menu items when dialog opens, if not a reusable item form itself
      if (!isReusableItemForm) {
        fetchReusableMenuItems()
      }
    }
  }, [isOpen, currentMenuItem, isReusableItemForm])

  const fetchReusableMenuItems = async () => {
    setIsLoadingReusableItems(true)
    try {
      const items = await getReusableMenuItems()
      setReusableMenuItems(items)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los platillos reutilizables.",
        variant: "destructive",
      })
    } finally {
      setIsLoadingReusableItems(false)
    }
  }

  const handleOpenCategoryManager = () => {
    if (onOpenCategoryManager) {
      onOpenCategoryManager()
    }
  }

  const handleSelectReusableItem = (item: ReusableMenuItem) => {
    setSelectedReusableItemId(item.id)
    // Pre-fill form with reusable item data
    setName(item.name)
    setDescription(item.description)
    setPrice(item.price.toString())
    if (item.menu_category_id) {
      setSelectedCategoryId(item.menu_category_id)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !price || !selectedCategoryId) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos obligatorios (Nombre, Precio, Categoría).",
        variant: "destructive",
      })
      return
    }

    const parsedPrice = Number.parseFloat(price)
    if (isNaN(parsedPrice)) {
      toast({
        title: "Error",
        description: "El precio debe ser un número válido.",
        variant: "destructive",
      })
      return
    }

    try {
      if (isReusableItemForm) {
        // Handle Reusable Item (Global Dish/Recipe) creation/update
        const reusableItemData = {
          name,
          description,
          price: parsedPrice,
          menu_category_id: Number(selectedCategoryId),
        }
        if (currentMenuItem) {
          await updateReusableMenuItem(currentMenuItem.id, {
            ...reusableItemData,
            image_url: null, // Disable image upload for now
          })
          toast({ title: "Éxito", description: "Platillo global actualizado correctamente." })
        } else {
          await createReusableMenuItem({
            ...reusableItemData,
            image_url: null, // Disable image upload for now
          })
          toast({ title: "Éxito", description: "Platillo global creado correctamente." })
        }
      } else {
        // Handle Digital Menu Item creation/update
        if (!digitalMenuId) {
          toast({
            title: "Error",
            description: "No hay un menú digital seleccionado. Por favor, selecciona un menú primero.",
            variant: "destructive",
          })
          return
        }
        const menuItemData = {
          digital_menu_id: digitalMenuId,
          name,
          description,
          price: parsedPrice,
          menu_category_id: Number(selectedCategoryId),
          reusable_menu_item_id: activeTab === "existing" ? selectedReusableItemId : undefined,
        }
        if (currentMenuItem) {
          await updateMenuItem(currentMenuItem.id, menuItemData, null) // Disable image upload for now
          toast({ title: "Éxito", description: "Platillo actualizado correctamente." })
        } else {
          await createMenuItem(menuItemData, undefined) // Disable image upload for now
          toast({ title: "Éxito", description: "Platillo creado correctamente." })
        }
      }
      onSaveSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el platillo.",
        variant: "destructive",
      })
    }
  }

  const renderFormContent = (isExistingTab = false) => (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      {isExistingTab && (
        <div className="mb-4">
          <Label className="text-sm font-medium mb-2 block">Selecciona un platillo existente</Label>
          {isLoadingReusableItems ? (
            <div className="text-center py-4">Cargando platillos...</div>
          ) : reusableMenuItems.length === 0 ? (
            <div className="text-center py-4 text-gray-500">
              No hay platillos reutilizables disponibles. Crea algunos primero.
            </div>
          ) : (
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {reusableMenuItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-md border cursor-pointer flex items-center gap-3 ${
                    selectedReusableItemId === item.id ? "border-primary bg-primary/10" : "border-gray-200"
                  }`}
                  onClick={() => handleSelectReusableItem(item)}
                >
                  {selectedReusableItemId === item.id && <Check className="h-5 w-5 text-primary flex-shrink-0" />}
                  <div className="flex-grow">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <span>${item.price.toFixed(2)}</span>
                      {item.category_name && (
                        <>
                          <span>•</span>
                          <span>{item.category_name}</span>
                        </>
                      )}
                      {item.ingredient_count > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <ChefHat className="h-3 w-3" />
                            {item.ingredient_count} ingredientes
                          </span>
                        </>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {(!isExistingTab || selectedReusableItemId) && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-right">
                Nombre *
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del platillo"
                required
                disabled={isExistingTab}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="text-right">
                Precio *
              </Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
                disabled={isExistingTab}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descripción del platillo"
              rows={3}
              disabled={isExistingTab}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category" className="text-right">
              Categoría *
            </Label>
            <div className="flex space-x-2">
              <select
                id="category"
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                required
              >
                <option value="">Selecciona una categoría</option>
                {safeCategories
                  .filter((cat) => cat.type === "menu_item")
                  .map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
              </select>
              {onOpenCategoryManager && (
                <Button type="button" variant="outline" onClick={handleOpenCategoryManager}>
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
            {safeCategories.filter((cat) => cat.type === "menu_item").length === 0 && (
              <p className="text-sm text-gray-500">
                No hay categorías disponibles. Usa el botón de configuración para gestionar categorías.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="image" className="text-right">
              Imagen
            </Label>
            <div className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">Image upload temporarily disabled</p>
              <p className="text-sm text-gray-400 mt-1">We're fixing upload issues</p>
            </div>
          </div>
        </>
      )}

      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={
            (isExistingTab && (!selectedReusableItemId || !selectedCategoryId)) ||
            (!isExistingTab && (!name || !price || !selectedCategoryId))
          }
        >
          {isReusableItemForm
            ? currentMenuItem
              ? "Actualizar Global"
              : "Crear Global"
            : currentMenuItem
              ? "Actualizar"
              : "Añadir al Menú"}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>
            {isReusableItemForm
              ? currentMenuItem
                ? "Editar Platillo Global"
                : "Nuevo Platillo Global"
              : currentMenuItem
                ? "Editar Platillo"
                : "Nuevo Platillo"}
          </DialogTitle>
          <DialogDescription>
            {isReusableItemForm
              ? currentMenuItem
                ? "Actualiza los detalles de este platillo global (receta)."
                : "Añade un nuevo platillo global que puede ser usado en múltiples menús y tener ingredientes."
              : currentMenuItem
                ? "Actualiza los detalles del platillo en tu menú."
                : "Añade un nuevo platillo a tu menú digital."}
          </DialogDescription>
        </DialogHeader>

        {isReusableItemForm ? (
          renderFormContent()
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Crear Nuevo</TabsTrigger>
              <TabsTrigger value="existing">Usar Platillo Existente</TabsTrigger>
            </TabsList>

            <TabsContent value="new" className="mt-0">
              {renderFormContent()}
            </TabsContent>

            <TabsContent value="existing" className="mt-0">
              {renderFormContent(true)}
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
