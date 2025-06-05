"use client"

import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CalendarIcon, LayoutTemplateIcon, EditIcon, TrashIcon, QrCodeIcon } from "lucide-react" // Added missing icons
import type { DigitalMenu } from "@/lib/types" // Assuming DigitalMenu type

interface DigitalMenusListProps {
  menus: DigitalMenu[]
  onEdit: (menu: DigitalMenu) => void
  onDelete: (id: number) => void
  onGenerateQr: (menu: DigitalMenu) => void
  selectedMenu: DigitalMenu | null // New prop
  onSelectMenu: (menu: DigitalMenu) => void // New prop
}

export function DigitalMenusList({
  menus,
  onEdit,
  onDelete,
  onGenerateQr,
  selectedMenu,
  onSelectMenu,
}: DigitalMenusListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {menus.map((menu) => (
        <Card
          key={menu.id}
          className={`relative group shadow-lg border-2 ${
            selectedMenu?.id === menu.id ? "border-warm-500" : "border-neutral-200"
          } hover:border-warm-400 transition-colors cursor-pointer`}
          onClick={() => onSelectMenu(menu)} // Handle selection on click
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold text-neutral-800">{menu.name}</CardTitle>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  menu.status === "active" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {menu.status === "active" ? "Activo" : "Borrador"}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{menu.description}</p>
            <div className="flex items-center text-sm text-neutral-500">
              <CalendarIcon className="mr-1 h-4 w-4" />
              <span>Creado: {new Date(menu.created_at).toLocaleDateString()}</span>
            </div>
            {menu.template_name && (
              <div className="flex items-center text-sm text-neutral-500 mt-1">
                <LayoutTemplateIcon className="mr-1 h-4 w-4" />
                <span>Plantilla: {menu.template_name}</span>
              </div>
            )}
          </CardContent>
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onEdit(menu)
              }}
              title="Edit Menu"
            >
              <EditIcon className="h-4 w-4 text-neutral-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(menu.id)
              }}
              title="Delete Menu"
            >
              <TrashIcon className="h-4 w-4 text-red-500" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation()
                onGenerateQr(menu)
              }}
              title="Generate QR"
            >
              <QrCodeIcon className="h-4 w-4 text-neutral-500" />
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}
