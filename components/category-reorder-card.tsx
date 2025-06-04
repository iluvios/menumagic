"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowUp, ArrowDown, Loader2, Plus } from "lucide-react" // Import Plus icon
import { updateCategoryOrder } from "@/lib/actions/category-actions" // Removed getCategoriesByType
import { useToast } from "@/hooks/use-toast"

interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

interface CategoryReorderCardProps {
  categories: Category[] // NEW: Receive categories as prop
  onCategoriesUpdated: () => void // NEW: Callback to notify parent of changes
  onAddCategoryClick: () => void // Prop for adding category
}

export function CategoryReorderCard({
  categories: initialCategories,
  onCategoriesUpdated,
  onAddCategoryClick,
}: CategoryReorderCardProps) {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>(initialCategories) // Use initialCategories
  const [loading, setLoading] = useState(false) // No longer loading internally
  const [lastMovedCategoryId, setLastMovedCategoryId] = useState<number | null>(null)
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null) // Ref for timeout

  // Update internal state when initialCategories prop changes
  useEffect(() => {
    setCategories(initialCategories.sort((a, b) => a.order_index - b.order_index))
  }, [initialCategories])

  const handleSaveOrder = async (updatedCategories: Category[], movedCategoryId: number) => {
    // Clear any existing timeout to prevent multiple indicators
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current)
    }

    setLastMovedCategoryId(movedCategoryId)
    setShowSavedIndicator(true)

    try {
      const categoriesToUpdate = updatedCategories.map((cat) => ({
        id: cat.id,
        order_index: cat.order_index,
      }))
      await updateCategoryOrder(categoriesToUpdate)
      onCategoriesUpdated() // Notify parent that categories might have changed (order)
      // Success: indicator will fade out
    } catch (error: any) {
      console.error("Failed to save category order:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el orden de las categorías.",
        variant: "destructive",
      })
      // On error, hide indicator immediately and revert to original order
      setShowSavedIndicator(false)
      setLastMovedCategoryId(null)
      setCategories(initialCategories.sort((a, b) => a.order_index - b.order_index)) // Revert to prop state
    } finally {
      // Set timeout to hide indicator after a short delay
      savedIndicatorTimeoutRef.current = setTimeout(() => {
        setShowSavedIndicator(false)
        setLastMovedCategoryId(null)
      }, 1500) // Show for 1.5 seconds
    }
  }

  const moveCategory = (index: number, direction: "up" | "down") => {
    const newCategories = [...categories]
    const categoryToMove = newCategories[index]

    if (direction === "up") {
      if (index === 0) return
      newCategories.splice(index, 1)
      newCategories.splice(index - 1, 0, categoryToMove)
    } else {
      if (index === newCategories.length - 1) return
      newCategories.splice(index, 1)
      newCategories.splice(index + 1, 0, categoryToMove)
    }

    const updatedCategoriesWithOrder = newCategories.map((cat, idx) => ({
      ...cat,
      order_index: idx + 1,
    }))

    setCategories(updatedCategoriesWithOrder)
    handleSaveOrder(updatedCategoriesWithOrder, categoryToMove.id) // Pass the ID of the moved category
  }

  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-semibold text-neutral-800">Orden de Categorías</CardTitle>
          <CardDescription>Organiza el orden en que aparecen tus categorías de menú.</CardDescription>
        </div>
        <Button
          className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
          onClick={onAddCategoryClick} // Use the new prop
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir Nueva Categoría
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[40vh] overflow-y-auto">
        {loading ? ( // This loading state will now always be false, as parent handles loading
          <div className="text-center py-8 text-neutral-500">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-3 text-neutral-400" />
            <p>Cargando categorías...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>No hay categorías de menú para reordenar.</p>
            <p className="text-sm">Crea algunas en la sección de elementos del menú.</p>
          </div>
        ) : (
          categories.map((category, index) => (
            <div
              key={category.id}
              className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 relative" // Added relative for positioning
            >
              <span className="font-medium text-neutral-800">{category.name}</span>
              {lastMovedCategoryId === category.id && showSavedIndicator && (
                <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full opacity-0 animate-fade-in-out">
                  Guardado!
                </span>
              )}
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveCategory(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4 text-neutral-500" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => moveCategory(index, "down")}
                  disabled={index === categories.length - 1}
                >
                  <ArrowDown className="h-4 w-4 text-neutral-500" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
