"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditIcon, TrashIcon, UtensilsCrossedIcon } from "lucide-react"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
// import type { ReusableMenuItem } from "@/lib/types" // Temporarily removed for linting
import { formatCurrency } from "@/lib/utils/client-formatters"
import { DishRecipeDialog } from "@/components/dish-recipe-dialog" // Changed from "./dish-recipe-dialog" to absolute path
import {
  deleteReusableMenuItem,
  // updateReusableMenuItem, // No longer directly called from here for dialog
  // createReusableMenuItem, // No longer directly called from here for dialog
} from "@/lib/actions/menu-studio-actions"

interface ReusableMenuItemsListProps {
  items: any[] // Temporarily using any[] for ReusableMenuItem
  onItemUpdated: () => void
  onItemDeleted: () => void
}

export function ReusableMenuItemsList({ items, onItemUpdated, onItemDeleted }: ReusableMenuItemsListProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<any | null>(null) // Temporarily using any
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<any | null>(null) // Temporarily using any

  const handleEdit = (item: any) => {
    // Temporarily using any
    setEditingItem(item)
    setIsFormDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (
      window.confirm(
        "Are you sure you want to delete this global dish? This will also remove it from any digital menus.",
      )
    ) {
      try {
        await deleteReusableMenuItem(id)
        onItemDeleted() // Corrected: was onItemUpdated, should be onItemDeleted
      } catch (error) {
        console.error("Failed to delete reusable menu item:", error)
        alert("Failed to delete global dish. Please try again.")
      }
    }
  }

  // The MenuItemFormDialog will now handle its own save operations for reusable items.
  // This handleSave is no longer directly wired to the dialog's save mechanism.
  // const handleSave = async (data: any) => { ... }

  const handleOpenRecipe = (item: any) => {
    // Temporarily using any
    setSelectedRecipeItem(item)
    setIsRecipeDialogOpen(true)
  }

  // Defensive check for items prop
  if (!items || !Array.isArray(items)) {
    console.error("[ReusableMenuItemsList] items prop is undefined or not an array. Received:", items)
    // return <div className="text-center py-4">Error: Items data is not available.</div>;
  }

  const safeItems = Array.isArray(items) ? items : []

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {safeItems.map((item) => (
        <Card key={item.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleOpenRecipe(item)}
                title="View Recipe/Ingredients"
              >
                <UtensilsCrossedIcon className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Edit Dish">
                <EditIcon className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)} title="Delete Dish">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            {item.image_url && (
              <img
                src={item.image_url || "/placeholder.svg"}
                alt={item.name}
                className="mb-4 h-32 w-full object-cover rounded-md"
              />
            )}
            <CardDescription className="text-sm text-gray-500 mb-2 line-clamp-2">{item.description}</CardDescription>
            <p className="text-lg font-semibold mb-1">{formatCurrency(item.price)}</p>
            <p className="text-sm text-gray-600">Category: {item.category_name}</p>
            {item.cost_per_serving !== undefined && item.cost_per_serving !== null && (
              <p className="text-sm text-gray-600">Cost per serving: {formatCurrency(item.cost_per_serving)}</p>
            )}
            <p className={`text-sm font-medium ${item.is_available ? "text-green-600" : "text-red-600"}`}>
              {item.is_available ? "Available" : "Not Available"}
            </p>
          </CardContent>
        </Card>
      ))}

      <MenuItemFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={(isOpen) => {
          setIsFormDialogOpen(isOpen)
          if (!isOpen) setEditingItem(null) // Clear editing item when dialog closes
        }}
        onSaveSuccess={() => {
          onItemUpdated() // Call prop from parent
          setIsFormDialogOpen(false) // Close dialog
          setEditingItem(null) // Clear editing item
        }}
        currentMenuItem={editingItem}
        isReusableItemForm={true}
        categories={[]}
        onCategoriesUpdated={() => {}}
      />

      {selectedRecipeItem && (
        <DishRecipeDialog
          isOpen={isRecipeDialogOpen}
          onOpenChange={setIsRecipeDialogOpen}
          reusableMenuItemId={selectedRecipeItem.id}
          reusableMenuItemName={selectedRecipeItem.name}
          onSaveSuccess={onItemUpdated}
        />
      )}
    </div>
  )
}
