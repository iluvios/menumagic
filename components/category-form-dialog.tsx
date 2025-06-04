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
import { useToast } from "@/hooks/use-toast"
import {
  createCategory,
  updateCategory,
  deleteCategory,
  addCategoryToDigitalMenu,
  removeCategoryFromDigitalMenu,
} from "@/lib/actions/category-actions"
import { Plus, Trash2, Link, Unlink } from "lucide-react"

interface GlobalCategory {
  id: number
  name: string
  type: string
  order_index: number
}

interface DigitalMenuCategory {
  id: number // ID of the digital_menu_categories entry
  digital_menu_id: number
  category_id: number // ID of the global category
  category_name: string // Name of the global category
  order_index: number // Menu-specific order index
}

interface CategoryFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  currentCategory: GlobalCategory | null // For editing a global category
  digitalMenuId: number // The ID of the currently selected digital menu
  globalCategories: GlobalCategory[] // All categories from the 'categories' table
  digitalMenuCategories: DigitalMenuCategory[] // Categories linked to the current digital menu
  onSaveSuccess: () => void // Callback to refresh categories in parent
}

export function CategoryFormDialog({
  isOpen,
  onOpenChange,
  currentCategory,
  digitalMenuId,
  globalCategories,
  digitalMenuCategories,
  onSaveSuccess,
}: CategoryFormDialogProps) {
  const { toast } = useToast()
  const [newGlobalCategoryName, setNewGlobalCategoryName] = useState("")
  const [editingGlobalCategoryName, setEditingGlobalCategoryName] = useState(currentCategory?.name || "")

  useEffect(() => {
    if (isOpen) {
      setNewGlobalCategoryName("")
      setEditingGlobalCategoryName(currentCategory?.name || "")
    }
  }, [isOpen, currentCategory])

  const handleCreateGlobalCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newGlobalCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la nueva categoría no puede estar vacío.",
        variant: "destructive",
      })
      return
    }
    try {
      await createCategory(newGlobalCategoryName.trim(), "menu_item")
      toast({ title: "Éxito", description: `Categoría global "${newGlobalCategoryName}" creada.` })
      setNewGlobalCategoryName("")
      onSaveSuccess() // Refresh all category lists
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la categoría global.",
        variant: "destructive",
      })
    }
  }

  const handleUpdateGlobalCategory = async (categoryId: number) => {
    if (!editingGlobalCategoryName.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío.",
        variant: "destructive",
      })
      return
    }
    try {
      await updateCategory(categoryId, editingGlobalCategoryName.trim())
      toast({ title: "Éxito", description: `Categoría global actualizada a "${editingGlobalCategoryName}".` })
      onSaveSuccess() // Refresh all category lists
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo actualizar la categoría global.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteGlobalCategory = async (categoryId: number) => {
    if (
      confirm(
        "¿Estás seguro de que quieres eliminar esta categoría global? Esto también la eliminará de todos los menús a los que esté vinculada.",
      )
    ) {
      try {
        await deleteCategory(categoryId)
        toast({ title: "Éxito", description: "Categoría global eliminada." })
        onSaveSuccess() // Refresh all category lists
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar la categoría global.",
          variant: "destructive",
        })
      }
    }
  }

  const handleAddCategoryToMenu = async (categoryId: number) => {
    try {
      await addCategoryToDigitalMenu(digitalMenuId, categoryId)
      toast({ title: "Éxito", description: "Categoría añadida a este menú." })
      onSaveSuccess() // Refresh all category lists
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo añadir la categoría al menú.",
        variant: "destructive",
      })
    }
  }

  const handleRemoveCategoryFromMenu = async (digitalMenuCategoryId: number) => {
    if (
      confirm(
        "¿Estás seguro de que quieres desvincular esta categoría de este menú? Los elementos de menú asociados a ella seguirán existiendo, pero no aparecerán bajo esta categoría en este menú.",
      )
    ) {
      try {
        await removeCategoryFromDigitalMenu(digitalMenuId, digitalMenuCategoryId)
        toast({ title: "Éxito", description: "Categoría desvinculada de este menú." })
        onSaveSuccess() // Refresh all category lists
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo desvincular la categoría del menú.",
          variant: "destructive",
        })
      }
    }
  }

  const categoriesNotInMenu = globalCategories.filter(
    (gCat) => !digitalMenuCategories.some((dmc) => dmc.category_id === gCat.id),
  )

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>Gestionar Categorías del Menú</DialogTitle>
          <DialogDescription>
            Añade nuevas categorías globales, edita las existentes o gestiona las categorías vinculadas a este menú.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          {/* Section for creating new global categories */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Crear Nueva Categoría Global</h3>
            <form onSubmit={handleCreateGlobalCategory} className="flex gap-2">
              <Input
                placeholder="Nombre de la nueva categoría"
                value={newGlobalCategoryName}
                onChange={(e) => setNewGlobalCategoryName(e.target.value)}
                className="flex-grow"
                required
              />
              <Button type="submit">
                <Plus className="mr-2 h-4 w-4" /> Crear
              </Button>
            </form>
          </div>

          {/* Section for categories linked to this menu */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Categorías en este Menú ({digitalMenuCategories.length})</h3>
            {digitalMenuCategories.length === 0 ? (
              <p className="text-neutral-500">
                No hay categorías vinculadas a este menú. Añade algunas desde la lista global.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {digitalMenuCategories.map((dmc) => (
                  <li key={dmc.id} className="flex items-center justify-between p-2 border rounded-md bg-neutral-50">
                    <span className="font-medium">{dmc.category_name}</span>
                    <div className="flex gap-2">
                      {/* Option to edit global category name directly from here */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingGlobalCategoryName(dmc.category_name)
                          // You might want a separate dialog or inline edit for this
                          // For now, let's just set the state for potential future inline edit
                          toast({
                            title: "Editar Categoría",
                            description: `Edita "${dmc.category_name}" en la sección de categorías globales.`,
                          })
                        }}
                      >
                        Editar
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleRemoveCategoryFromMenu(dmc.id)}>
                        <Unlink className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section for global categories not in this menu */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">
              Categorías Globales Disponibles ({categoriesNotInMenu.length})
            </h3>
            {categoriesNotInMenu.length === 0 ? (
              <p className="text-neutral-500">
                Todas las categorías globales están vinculadas a este menú o no hay categorías globales.
              </p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {categoriesNotInMenu.map((gCat) => (
                  <li key={gCat.id} className="flex items-center justify-between p-2 border rounded-md bg-neutral-50">
                    <span className="font-medium">{gCat.name}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleAddCategoryToMenu(gCat.id)}>
                        <Link className="mr-2 h-4 w-4" /> Añadir a Menú
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => handleDeleteGlobalCategory(gCat.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Section for editing/deleting any global category */}
          <div className="border p-4 rounded-md">
            <h3 className="text-lg font-semibold mb-3">Editar/Eliminar Categoría Global</h3>
            <div className="grid gap-3">
              <Label htmlFor="select-global-category">Seleccionar Categoría</Label>
              <select
                id="select-global-category"
                value={currentCategory?.id || ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value)
                  const selectedCat = globalCategories.find((cat) => cat.id === selectedId) || null
                  setEditingGlobalCategoryName(selectedCat?.name || "")
                  // This dialog doesn't directly support changing currentCategory prop,
                  // but we can use this selection to populate the editing field.
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">-- Selecciona una categoría global --</option>
                {globalCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>

              {currentCategory && ( // Only show edit/delete if a category is selected for editing
                <>
                  <Label htmlFor="edit-global-category-name">Nombre de la Categoría</Label>
                  <Input
                    id="edit-global-category-name"
                    value={editingGlobalCategoryName}
                    onChange={(e) => setEditingGlobalCategoryName(e.target.value)}
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      onClick={() => handleUpdateGlobalCategory(currentCategory.id)}
                      disabled={!editingGlobalCategoryName.trim()}
                    >
                      Actualizar Nombre
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleDeleteGlobalCategory(currentCategory.id)}
                    >
                      Eliminar Globalmente
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
