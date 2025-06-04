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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import {
  getIngredientsForReusableDish,
  addReusableDishIngredient,
  updateReusableDishIngredient,
  removeReusableDishIngredient,
} from "@/lib/actions/recipe-actions"
import { getIngredients } from "@/lib/actions/ingredient-actions"
import { Edit, Trash2, XCircle, Plus } from "lucide-react"

interface ReusableDishIngredient {
  id: number
  reusable_menu_item_id: number
  ingredient_id: number
  ingredient_name: string
  quantity_used: number
  unit_used: string
  cost_per_unit: number
  total_cost: number
  ingredient_base_unit: string
}

interface Ingredient {
  id: number
  name: string
  unit_of_measure: string
  current_stock?: number
}

interface DishRecipeDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  reusableMenuItemId: number
  reusableMenuItemName: string
  onSaveSuccess: () => void
}

export function DishRecipeDialog({
  isOpen,
  onOpenChange,
  reusableMenuItemId,
  reusableMenuItemName,
  onSaveSuccess,
}: DishRecipeDialogProps) {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<ReusableDishIngredient[]>([])
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddingIngredient, setIsAddingIngredient] = useState(false)

  // Form state for adding/editing ingredients
  const [selectedIngredientId, setSelectedIngredientId] = useState<string>("")
  const [quantity, setQuantity] = useState<string>("")
  const [unit, setUnit] = useState<string>("")
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null)

  useEffect(() => {
    if (isOpen && reusableMenuItemId) {
      fetchIngredients()
      fetchAllIngredients()
      resetForm()
    }
  }, [isOpen, reusableMenuItemId])

  const fetchIngredients = async () => {
    setIsLoading(true)
    try {
      const data = await getIngredientsForReusableDish(reusableMenuItemId)
      setIngredients(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar los ingredientes del platillo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAllIngredients = async () => {
    try {
      const data = await getIngredients()
      setAllIngredients(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar la lista de ingredientes.",
        variant: "destructive",
      })
    }
  }

  const resetForm = () => {
    setSelectedIngredientId("")
    setQuantity("")
    setUnit("")
    setEditingIngredientId(null)
    setIsAddingIngredient(false)
  }

  const handleAddUpdateIngredient = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedIngredientId || !quantity || !unit) {
      toast({
        title: "Error",
        description: "Por favor, completa todos los campos.",
        variant: "destructive",
      })
      return
    }

    const parsedQuantity = Number.parseFloat(quantity)
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      toast({
        title: "Error",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      })
      return
    }

    try {
      if (editingIngredientId) {
        await updateReusableDishIngredient(editingIngredientId, {
          quantity_used: parsedQuantity,
          unit_used: unit,
        })
        toast({ title: "Éxito", description: "Ingrediente actualizado." })
      } else {
        await addReusableDishIngredient({
          reusable_menu_item_id: reusableMenuItemId,
          ingredient_id: Number(selectedIngredientId),
          quantity_used: parsedQuantity,
          unit_used: unit,
        })
        toast({ title: "Éxito", description: "Ingrediente añadido." })
      }
      fetchIngredients()
      onSaveSuccess()
      resetForm()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el ingrediente.",
        variant: "destructive",
      })
    }
  }

  const handleEditClick = (ingredient: ReusableDishIngredient) => {
    setSelectedIngredientId(ingredient.ingredient_id.toString())
    setQuantity(ingredient.quantity_used.toString())
    setUnit(ingredient.unit_used)
    setEditingIngredientId(ingredient.id)
    setIsAddingIngredient(true)
  }

  const handleDeleteIngredient = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este ingrediente de la receta?")) {
      try {
        await removeReusableDishIngredient(id)
        toast({ title: "Éxito", description: "Ingrediente eliminado." })
        fetchIngredients()
        onSaveSuccess()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el ingrediente.",
          variant: "destructive",
        })
      }
    }
  }

  const totalCost = ingredients.reduce((sum, ing) => sum + (ing.total_cost || 0), 0)

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[900px] bg-white p-6 rounded-lg shadow-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Receta: {reusableMenuItemName}</DialogTitle>
          <DialogDescription>
            Define los ingredientes y cantidades necesarias para preparar este platillo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Ingredientes de la Receta</h3>
            <Button
              type="button"
              onClick={() => setIsAddingIngredient(!isAddingIngredient)}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              {isAddingIngredient ? (
                "Cancelar"
              ) : (
                <>
                  <Plus className="h-4 w-4" /> Añadir Ingrediente
                </>
              )}
            </Button>
          </div>

          {isAddingIngredient && (
            <form onSubmit={handleAddUpdateIngredient} className="bg-gray-50 p-4 rounded-md space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ingredient">Ingrediente *</Label>
                  <Select
                    value={selectedIngredientId}
                    onValueChange={(value) => {
                      setSelectedIngredientId(value)
                      const selectedIng = allIngredients.find((ing) => ing.id === Number(value))
                      if (selectedIng) {
                        setUnit(selectedIng.unit_of_measure)
                      }
                    }}
                    disabled={!!editingIngredientId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un ingrediente" />
                    </SelectTrigger>
                    <SelectContent>
                      {allIngredients.map((ing) => (
                        <SelectItem key={ing.id} value={ing.id.toString()}>
                          {ing.name} ({ing.unit_of_measure})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quantity">Cantidad *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.01"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="unit">Unidad *</Label>
                  <Input
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="ej. gramos, ml, unidades"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button type="submit">{editingIngredientId ? "Actualizar Ingrediente" : "Añadir Ingrediente"}</Button>
              </div>
            </form>
          )}

          <div className="border rounded-md overflow-hidden">
            {isLoading ? (
              <div className="text-center py-8">Cargando ingredientes...</div>
            ) : ingredients.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <XCircle className="mx-auto h-12 w-12 mb-4 text-neutral-400" />
                <p>No hay ingredientes añadidos a esta receta.</p>
                <p className="text-sm">Haz clic en "Añadir Ingrediente" para comenzar.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ingrediente</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Costo por Unidad</TableHead>
                    <TableHead>Costo Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredients.map((ing) => (
                    <TableRow key={ing.id}>
                      <TableCell className="font-medium">{ing.ingredient_name}</TableCell>
                      <TableCell>{ing.quantity_used}</TableCell>
                      <TableCell>{ing.unit_used}</TableCell>
                      <TableCell>${(ing.cost_per_unit || 0).toFixed(2)}</TableCell>
                      <TableCell>${(ing.total_cost || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEditClick(ing)}>
                            <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteIngredient(ing.id)}>
                            <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {ingredients.length > 0 && (
            <div className="text-right">
              <div className="text-lg font-semibold">
                Costo Total de la Receta: <span className="text-green-600">${totalCost.toFixed(2)}</span>
              </div>
              <div className="text-sm text-gray-500">
                Costo por porción: ${ingredients.length > 0 ? (totalCost / 1).toFixed(2) : "0.00"}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
