"use client"

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { Loader2, Plus, Trash2 } from "lucide-react"
import { getIngredientsForDish, updateDishIngredients } from "@/lib/actions/recipe-actions"

interface DishRecipeDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  dish: any
  ingredients: any[]
}

export function DishRecipeDialog({ isOpen, onOpenChange, dish, ingredients }: DishRecipeDialogProps) {
  const [dishIngredients, setDishIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch dish ingredients when dialog opens
  useEffect(() => {
    if (isOpen && dish) {
      fetchDishIngredients()
    }
  }, [isOpen, dish])

  const fetchDishIngredients = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getIngredientsForDish(dish.id)
      setDishIngredients(data || [])
    } catch (err: any) {
      console.error("Failed to fetch dish ingredients:", err)
      setError(err.message || "Failed to load ingredients")
      toast({
        title: "Error",
        description: "Failed to load ingredients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddIngredient = () => {
    setDishIngredients([
      ...dishIngredients,
      {
        id: `temp-${Date.now()}`,
        ingredient_id: "",
        quantity: "",
        unit: "",
      },
    ])
  }

  const handleRemoveIngredient = (index: number) => {
    const newIngredients = [...dishIngredients]
    newIngredients.splice(index, 1)
    setDishIngredients(newIngredients)
  }

  const handleIngredientChange = (index: number, field: string, value: string) => {
    const newIngredients = [...dishIngredients]
    newIngredients[index] = {
      ...newIngredients[index],
      [field]: value,
    }

    // If changing the ingredient, set the default unit
    if (field === "ingredient_id") {
      const selectedIngredient = ingredients.find((i) => i.id === Number.parseInt(value))
      if (selectedIngredient && selectedIngredient.unit) {
        newIngredients[index].unit = selectedIngredient.unit
      }
    }

    setDishIngredients(newIngredients)
  }

  const handleSave = async () => {
    // Validate ingredients
    const invalidIngredients = dishIngredients.filter((ing) => !ing.ingredient_id || !ing.quantity || !ing.unit)

    if (invalidIngredients.length > 0) {
      toast({
        title: "Validation Error",
        description: "All ingredients must have an ingredient, quantity, and unit selected.",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      // Format ingredients for saving
      const formattedIngredients = dishIngredients.map((ing) => ({
        ingredient_id: Number.parseInt(ing.ingredient_id),
        quantity: Number.parseFloat(ing.quantity),
        unit: ing.unit,
      }))

      await updateDishIngredients(dish.id, formattedIngredients)

      toast({
        title: "Success",
        description: "Recipe ingredients saved successfully.",
      })

      onOpenChange(false)
    } catch (err: any) {
      console.error("Failed to save ingredients:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to save ingredients. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recipe: {dish?.name}</DialogTitle>
          <DialogDescription>Manage ingredients for this dish.</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            <p className="ml-2">Loading ingredients...</p>
          </div>
        ) : error ? (
          <div className="text-center text-red-600 py-4">
            <p>{error}</p>
            <Button onClick={fetchDishIngredients} className="mt-2">
              Retry
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Ingredients</h3>
                <Button onClick={handleAddIngredient} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Add Ingredient
                </Button>
              </div>

              {dishIngredients.length === 0 ? (
                <p className="text-center text-gray-500 py-4">
                  No ingredients added yet. Click "Add Ingredient" to start.
                </p>
              ) : (
                <div className="space-y-4">
                  {dishIngredients.map((ingredient, index) => (
                    <div key={ingredient.id || index} className="flex items-end gap-2">
                      <div className="flex-1">
                        <Label htmlFor={`ingredient-${index}`}>Ingredient</Label>
                        <Select
                          value={ingredient.ingredient_id?.toString() || ""}
                          onValueChange={(value) => handleIngredientChange(index, "ingredient_id", value)}
                        >
                          <SelectTrigger id={`ingredient-${index}`}>
                            <SelectValue placeholder="Select ingredient" />
                          </SelectTrigger>
                          <SelectContent>
                            {ingredients.map((ing) => (
                              <SelectItem key={ing.id} value={ing.id.toString()}>
                                {ing.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="w-24">
                        <Label htmlFor={`quantity-${index}`}>Quantity</Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          step="0.01"
                          value={ingredient.quantity || ""}
                          onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                        />
                      </div>
                      <div className="w-24">
                        <Label htmlFor={`unit-${index}`}>Unit</Label>
                        <Input
                          id={`unit-${index}`}
                          value={ingredient.unit || ""}
                          onChange={(e) => handleIngredientChange(index, "unit", e.target.value)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveIngredient(index)}
                        className="mb-0.5"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Recipe"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
