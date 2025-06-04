"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, GripVertical } from "lucide-react" // Import GripVertical for drag handle
import { updateDigitalMenuCategoryOrder } from "@/lib/actions/category-actions" // Use new action
import { useToast } from "@/hooks/use-toast"

// DND Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

// Interface for menu-specific category
interface DigitalMenuCategory {
  id: number // ID of the digital_menu_categories entry
  digital_menu_id: number
  category_id: number // ID of the global category
  category_name: string // Name of the global category
  order_index: number // Menu-specific order index
}

interface CategoryReorderCardProps {
  categories: DigitalMenuCategory[] // Receive menu-specific categories
  onCategoriesUpdated: () => void // Callback to notify parent of changes
  onAddCategoryClick: () => void // Prop for adding category
}

// SortableItem component for DND Kit
function SortableItem({ category }: { category: DigitalMenuCategory }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: category.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 0, // Bring dragged item to front
    opacity: isDragging ? 0.7 : 1, // Make dragged item slightly transparent
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200 relative"
    >
      <div className="flex items-center gap-2">
        <button
          className="cursor-grab touch-action-none p-1 -ml-1" // Add touch-action-none for better mobile drag
          {...listeners}
          {...attributes}
          aria-label={`Drag to reorder ${category.category_name}`}
        >
          <GripVertical className="h-5 w-5 text-neutral-400" />
        </button>
        <span className="font-medium text-neutral-800">{category.category_name}</span>
      </div>
      {/* Removed individual up/down buttons as DND handles reordering */}
    </div>
  )
}

export function CategoryReorderCard({
  categories: initialCategories,
  onCategoriesUpdated,
  onAddCategoryClick,
}: CategoryReorderCardProps) {
  console.log("[CategoryReorderCard] Props - initialCategories:", initialCategories)
  const { toast } = useToast()
  const [categories, setCategories] = useState<DigitalMenuCategory[]>(initialCategories)
  const [isSaving, setIsSaving] = useState(false) // New state for saving status
  const [showSavedIndicator, setShowSavedIndicator] = useState(false)
  const savedIndicatorTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // DND Kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Update internal state when initialCategories prop changes
  useEffect(() => {
    // Ensure categories are sorted by order_index when prop updates
    setCategories(initialCategories.sort((a, b) => a.order_index - b.order_index))
    console.log("[CategoryReorderCard] State - categories after useEffect:", categories)
  }, [initialCategories])

  const handleSaveOrder = async (updatedCategories: DigitalMenuCategory[]) => {
    // Clear any existing timeout to prevent multiple indicators
    if (savedIndicatorTimeoutRef.current) {
      clearTimeout(savedIndicatorTimeoutRef.current)
    }

    setIsSaving(true) // Indicate saving
    setShowSavedIndicator(true) // Show indicator immediately

    try {
      const categoriesToUpdate = updatedCategories.map((cat, idx) => ({
        id: cat.id, // This is the digital_menu_categories ID
        order_index: idx + 1, // Assign new order_index based on current array position
      }))
      await updateDigitalMenuCategoryOrder(categoriesToUpdate)
      onCategoriesUpdated() // Notify parent that categories might have changed (order)
      toast({ title: "Orden guardado", description: "El orden de las categorías ha sido actualizado." })
    } catch (error: any) {
      console.error("Failed to save category order:", error)
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el orden de las categorías.",
        variant: "destructive",
      })
      // On error, hide indicator immediately and revert to original order
      setShowSavedIndicator(false)
      setCategories(initialCategories.sort((a, b) => a.order_index - b.order_index)) // Revert to prop state
    } finally {
      setIsSaving(false) // End saving
      // Set timeout to hide indicator after a short delay
      savedIndicatorTimeoutRef.current = setTimeout(() => {
        setShowSavedIndicator(false)
      }, 1500) // Show for 1.5 seconds
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id)
        const newIndex = items.findIndex((item) => item.id === over?.id)

        if (oldIndex === -1 || newIndex === -1) return items // Should not happen

        const newItems = [...items]
        const [movedItem] = newItems.splice(oldIndex, 1)
        newItems.splice(newIndex, 0, movedItem)

        // Update order_index for all items in the new order
        const updatedCategoriesWithOrder = newItems.map((cat, idx) => ({
          ...cat,
          order_index: idx + 1,
        }))

        handleSaveOrder(updatedCategoriesWithOrder) // Save the new order
        return updatedCategoriesWithOrder
      })
    }
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
          onClick={onAddCategoryClick}
          disabled={isSaving}
        >
          <Plus className="mr-2 h-4 w-4" />
          Añadir/Gestionar Categorías
        </Button>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[40vh] overflow-y-auto">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <p>No hay categorías de menú para reordenar.</p>
            <p className="text-sm">Añade algunas usando el botón de arriba.</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={categories.map((c) => c.id)} strategy={verticalListSortingStrategy}>
              {categories.map((category) => {
                console.log("[CategoryReorderCard] Rendering category:", category.category_name, "ID:", category.id)
                return <SortableItem key={category.id} category={category} />
              })}
            </SortableContext>
          </DndContext>
        )}
        {showSavedIndicator && (
          <div className="absolute bottom-4 right-4 text-xs font-semibold text-green-600 bg-green-50 px-3 py-1.5 rounded-full shadow-md animate-fade-in-out">
            Guardado!
          </div>
        )}
      </CardContent>
    </Card>
  )
}
