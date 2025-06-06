"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getIngredients, deleteIngredient } from "@/lib/actions/ingredient-actions"
import { PlusCircle, Edit, Trash2, Loader2, Search, Package } from "lucide-react"
import { IngredientFormDialog } from "@/components/ingredient-form-dialog"

interface Ingredient {
  id: number
  name: string
  unit_of_measure: string
  current_stock?: number
  cost_per_unit?: number
  supplier_id?: number
  supplier_name?: string
  category?: string
}

export default function IngredientsPage() {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateIngredientDialogOpen, setIsCreateIngredientDialogOpen] = useState(false)
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null)
  const [deletingIngredientId, setDeletingIngredientId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const ingredientsData = await getIngredients()
      setIngredients(ingredientsData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load ingredients.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter ingredients based on search term
  const filteredIngredients = useMemo(() => {
    if (!searchTerm) return ingredients

    return ingredients.filter(
      (ingredient) =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.unit_of_measure.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.category?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [ingredients, searchTerm])

  const handleEditIngredient = (ingredient: Ingredient) => {
    setEditingIngredient(ingredient)
    setIsCreateIngredientDialogOpen(true)
  }

  const handleDeleteIngredient = async (ingredientId: number, ingredientName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${ingredientName}"?`)) return

    setDeletingIngredientId(ingredientId)

    try {
      await deleteIngredient(ingredientId)
      toast({
        title: "Success",
        description: "Ingredient deleted successfully.",
      })
      fetchData() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete ingredient.",
        variant: "destructive",
      })
    } finally {
      setDeletingIngredientId(null)
    }
  }

  const handleIngredientSaved = () => {
    setIsCreateIngredientDialogOpen(false)
    setEditingIngredient(null)
    fetchData() // Refresh the list
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h1 className="text-2xl font-bold">Ingredients Management</h1>
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold">Ingredients Management</h1>
          <p className="text-gray-600">Manage your inventory ingredients and their details.</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingIngredient(null)
              setIsCreateIngredientDialogOpen(true)
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Ingredient
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Ingredients ({filteredIngredients.length})</CardTitle>
                <CardDescription>Manage your restaurant's ingredient inventory and costs.</CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? (
                  <p className="text-gray-500 mb-4">No ingredients found matching "{searchTerm}".</p>
                ) : (
                  <p className="text-gray-500 mb-4">
                    No ingredients found. Create your first ingredient to get started.
                  </p>
                )}
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      setEditingIngredient(null)
                      setIsCreateIngredientDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Ingredient
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredIngredients.map((ingredient) => (
                  <div
                    key={ingredient.id}
                    className="flex items-center justify-between rounded-md border p-4 shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="h-16 w-16 rounded-md bg-gray-100 flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{ingredient.name}</h3>
                          <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                            {ingredient.unit_of_measure}
                          </span>
                          {ingredient.category && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              {ingredient.category}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          {ingredient.current_stock !== undefined && (
                            <p className="text-sm text-gray-500">
                              Stock: <span className="font-medium">{ingredient.current_stock}</span>
                            </p>
                          )}
                          {ingredient.cost_per_unit !== undefined && (
                            <p className="text-sm text-green-600">
                              Cost: <span className="font-medium">${ingredient.cost_per_unit.toFixed(2)}</span>
                            </p>
                          )}
                          {ingredient.supplier_name && (
                            <p className="text-sm text-gray-500">
                              Supplier: <span className="font-medium">{ingredient.supplier_name}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditIngredient(ingredient)}
                        aria-label={`Edit ${ingredient.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteIngredient(ingredient.id, ingredient.name)}
                        disabled={deletingIngredientId === ingredient.id}
                        aria-label={`Delete ${ingredient.name}`}
                      >
                        {deletingIngredientId === ingredient.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ingredient Form Dialog */}
      {isCreateIngredientDialogOpen && (
        <IngredientFormDialog
          isOpen={isCreateIngredientDialogOpen}
          onOpenChange={setIsCreateIngredientDialogOpen}
          ingredient={editingIngredient}
          onSave={handleIngredientSaved}
        />
      )}
    </div>
  )
}
