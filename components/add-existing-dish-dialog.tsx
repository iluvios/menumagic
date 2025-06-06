"use client"

import { useState, useMemo } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Search, Plus, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/client-formatters"
import { createMenuItem } from "@/lib/actions/menu-studio-actions"
import { toast } from "sonner"
import Image from "next/image"

interface Dish {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  cost_per_serving?: number
}

interface AddExistingDishDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  digitalMenuId: number
  dishes: Dish[]
  onSave: () => void
}

export function AddExistingDishDialog({
  isOpen,
  onOpenChange,
  digitalMenuId,
  dishes,
  onSave,
}: AddExistingDishDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [addingDishId, setAddingDishId] = useState<number | null>(null)

  const filteredDishes = useMemo(() => {
    if (!Array.isArray(dishes)) return []
    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [dishes, searchTerm])

  const handleAddDishToMenu = async (dish: Dish) => {
    setAddingDishId(dish.id)
    try {
      await createMenuItem({
        digital_menu_id: digitalMenuId,
        dish_id: dish.id,
      })
      toast.success(`"${dish.name}" added to menu successfully.`)
      onSave() // Refresh the menu items list
    } catch (error: any) {
      toast.error(error.message || `Failed to add "${dish.name}" to menu.`)
    } finally {
      setAddingDishId(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Existing Dish to Menu</DialogTitle>
          <DialogDescription>Search and select from your existing dishes to add to this menu.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search dishes by name, description, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Dishes List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredDishes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {searchTerm ? "No dishes found matching your search." : "No dishes available."}
              </div>
            ) : (
              filteredDishes.map((dish) => (
                <Card key={dish.id} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{dish.name}</h3>
                        <Badge variant="secondary">{dish.category_name}</Badge>
                        {!dish.is_available && <Badge variant="destructive">Unavailable</Badge>}
                      </div>
                      {dish.description && <p className="text-sm text-gray-600">{dish.description}</p>}
                      <p className="text-lg font-bold text-green-600">{formatCurrency(dish.price)}</p>
                    </div>
                    {dish.image_url && (
                      <div className="ml-4">
                        <Image
                          src={dish.image_url || "/placeholder.svg"}
                          alt={dish.name}
                          width={80}
                          height={80}
                          className="rounded-md object-cover"
                        />
                      </div>
                    )}
                    <div className="ml-4">
                      <Button onClick={() => handleAddDishToMenu(dish)} disabled={addingDishId === dish.id} size="sm">
                        {addingDishId === dish.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          <>
                            <Plus className="mr-2 h-4 w-4" />
                            Add to Menu
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
