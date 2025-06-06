"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button" // Re-import Button
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Loader2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/client-formatters"

interface MenuItem {
  id: number
  digital_menu_id: number
  dish_id: number
  order_index: number
  name: string
  description: string
  price: number
  image_url: string | null
  menu_category_id: number
  category_name: string
  is_available: boolean
}

interface MenuItemCardProps {
  item: MenuItem
  onEdit: (item: MenuItem) => void
  onDelete: (itemId: number, itemName: string) => void
  isDeleting: boolean
}

export function MenuItemCard({ item, onEdit, onDelete, isDeleting }: MenuItemCardProps) {
  return (
    <div className="flex items-center justify-between rounded-md border p-4 shadow-sm bg-white">
      <div className="flex items-center gap-4 flex-1">
        {item.image_url && (
          <Image
            src={item.image_url || "/placeholder.svg"}
            alt={item.name}
            width={64}
            height={64}
            className="h-16 w-16 rounded-md object-cover"
          />
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{item.name}</h3>
            <Badge variant="secondary">{item.category_name}</Badge>
          </div>
          <p className="text-sm text-gray-500 mt-1">{item.description}</p>
          <p className="text-sm font-medium text-green-600 mt-1">{formatCurrency(item.price)}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation() // Prevent any parent click handlers
            onEdit(item)
          }}
          aria-label={`Edit ${item.name}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={(e) => {
            e.stopPropagation() // Prevent any parent click handlers
            onDelete(item.id, item.name)
          }}
          disabled={isDeleting}
          aria-label={`Delete ${item.name}`}
        >
          {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4 text-red-500" />}
        </Button>
      </div>
    </div>
  )
}
