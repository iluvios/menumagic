"use client"

import { useState } from "react"
import { Card, CardDescription, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditIcon, TrashIcon, GripVerticalIcon } from "lucide-react"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import type { MenuItem } from "@/lib/types" // Assuming MenuItem type
import { formatCurrency } from "@/lib/utils/client-formatters"
import { deleteMenuItem, updateMenuItem, createMenuItem, updateMenuItemOrder } from "@/lib/actions/menu-studio-actions" // Import from consolidated actions
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

interface MenuItemsListProps {
  digitalMenuId: number
  items: MenuItem[]
  onItemUpdated: () => void
  onItemDeleted: () => void
}

interface SortableMenuItemProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (id: number) => void
}

function SortableMenuItem({ item, onEdit, onDelete }: SortableMenuItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card ref={setNodeRef} style={style} className="flex flex-col md:flex-row items-center p-4 gap-4">
      <Button variant="ghost" size="icon" {...listeners} {...attributes} className="cursor-grab">
        <GripVerticalIcon className="h-5 w-5 text-gray-500" />
      </Button>
      {item.image_url && (
        <img
          src={item.image_url || "/placeholder.svg"}
          alt={item.name}
          className="h-24 w-24 object-cover rounded-md flex-shrink-0"
        />
      )}
      <div className="flex-grow">
        <CardTitle className="text-lg font-medium">{item.name}</CardTitle>
        <CardDescription className="text-sm text-gray-500 mb-1 line-clamp-2">{item.description}</CardDescription>
        <p className="text-lg font-semibold mb-1">{formatCurrency(item.price)}</p>
        <p className="text-sm text-gray-600">Category: {item.category_name}</p>
        <p className={`text-sm font-medium ${item.is_available ? "text-green-600" : "text-red-600"}`}>
          {item.is_available ? "Available" : "Not Available"}
        </p>
      </div>
      <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-auto">
        <Button variant="ghost" size="icon" onClick={() => onEdit(item)} title="Edit Item">
          <EditIcon className="h-4 w-4 text-gray-500" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(item.id)} title="Delete Item">
          <TrashIcon className="h-4 w-4 text-red-500" />
        </Button>
      </div>
    </Card>
  )
}

export function MenuItemsList({ digitalMenuId, items, onItemUpdated, onItemDeleted }: MenuItemsListProps) {
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>(items)

  // Update local state when props change (e.g., after fetch)
  useState(() => {
    setMenuItems(items)
  }, [items])

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setIsFormDialogOpen(true)
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteMenuItem(id)
        onItemDeleted()
      } catch (error) {
        console.error("Failed to delete menu item:", error)
        alert("Failed to delete menu item. Please try again.")
      }
    }
  }

  const handleSave = async (data: any) => {
    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, data)
      } else {
        await createMenuItem({ ...data, digital_menu_id: digitalMenuId })
      }
      onItemUpdated()
      setIsFormDialogOpen(false)
      setEditingItem(null)
    } catch (error) {
      console.error("Failed to save menu item:", error)
      alert("Failed to save menu item. Please try again.")
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = menuItems.findIndex((item) => item.id === active.id)
      const newIndex = menuItems.findIndex((item) => item.id === over?.id)

      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = Array.from(menuItems)
      const [movedItem] = newOrder.splice(oldIndex, 1)
      newOrder.splice(newIndex, 0, movedItem)

      // Update local state immediately for smooth UI
      setMenuItems(newOrder)

      // Prepare updates for the server
      const updates = newOrder.map((item, index) => ({
        id: item.id,
        order_index: index + 1, // Assuming 1-based indexing for order_index
      }))

      try {
        await updateMenuItemOrder(updates)
        onItemUpdated() // Trigger a full re-fetch to ensure server state is reflected
      } catch (error) {
        console.error("Failed to update menu item order:", error)
        alert("Failed to update menu item order. Please refresh the page.")
        onItemUpdated() // Re-fetch to revert to server state if update failed
      }
    }
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={menuItems.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="grid gap-4">
            {menuItems.map((item) => (
              <SortableMenuItem key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <MenuItemFormDialog
        isOpen={isFormDialogOpen}
        onOpenChange={setIsFormDialogOpen}
        onSubmit={handleSave}
        initialData={editingItem}
        digitalMenuId={digitalMenuId}
      />
    </>
  )
}
