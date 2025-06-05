"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditIcon, TrashIcon, UtensilsCrossedIcon } from "lucide-react"
import MenuItemFormDialog from "@/components/menu-item-form-dialog"
import type { ReusableMenuItem } from "@/lib/types" // Assuming ReusableMenuItem type
import { formatCurrency } from "@/lib/utils/client-formatters"
import { DishRecipeDialog } from "./dish-recipe-dialog"
import {
  deleteReusableMenuItem,
  updateReusableMenuItem,
  createReusableMenuItem,
} from "@/lib/actions/menu-studio-actions" // Import from consolidated actions

interface ReusableMenuItemsListProps {
  items: ReusableMenuItem[]
  onItemUpdated: () => void
  onItemDeleted: () => void
}

export function ReusableMenuItemsList({ items, onItemUpdated, onItemDeleted }: ReusableMenuItemsListProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ReusableMenuItem | null>(null)
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [selectedRecipeItem, setSelectedRecipeItem] = useState<ReusableMenuItem | null>(null)

  const handleEdit = (item: ReusableMenuItem) => {
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
        onItemDeleted()
      } catch (error) {
        console.error("Failed to delete reusable menu item:", error)
        alert("Failed to delete global dish. Please try again.")
      }
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await updateReusableMenuItem(editingItem.id, data)
      } else {
        await createReusableMenuItem(data)
      }
      onItemUpdated()
      setIsFormDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error("Failed to save reusable menu item:", error)
      alert("Failed to save global dish. Please try again.")
    }
  }

  const handleOpenRecipe = (item: ReusableMenuItem) => {
    setSelectedRecipeItem(item)
    setIsRecipeDialogOpen(true)
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
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
        onOpenChange={setIsFormDialogOpen}
        onSubmit={handleSave}
        initialData={editingItem}
        isReusable={true} // Indicate that this is for reusable items
      />

      {selectedRecipeItem && (
        <DishRecipeDialog
          isOpen={isRecipeDialogOpen}
          onOpenChange={setIsRecipeDialogOpen}
          reusableMenuItem={selectedRecipeItem}
        />
      )}
    </div>
  )
}
