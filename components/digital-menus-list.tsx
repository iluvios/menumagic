"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditIcon, TrashIcon, QrCodeIcon, EyeIcon } from "lucide-react"
import Link from "next/link"
import type { DigitalMenu } from "@/lib/types"
import { format } from "date-fns"

interface DigitalMenusListProps {
  menus: DigitalMenu[]
  onEdit: (menu: DigitalMenu) => void
  onDelete: (id: number) => void
  onGenerateQr: (menu: DigitalMenu) => void
}

export function DigitalMenusList({ menus, onEdit, onDelete, onGenerateQr }: DigitalMenusListProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {menus.map((menu) => (
        <Card key={menu.id} className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-medium">{menu.name}</CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => onGenerateQr(menu)} title="Generate QR Code">
                <QrCodeIcon className="h-4 w-4 text-gray-500" />
              </Button>
              <Link href={`/dashboard/menu-studio/digital-menu/${menu.id}`} passHref>
                <Button variant="ghost" size="icon" title="View Menu Items">
                  <EyeIcon className="h-4 w-4 text-gray-500" />
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={() => onEdit(menu)} title="Edit Menu">
                <EditIcon className="h-4 w-4 text-gray-500" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(menu.id)} title="Delete Menu">
                <TrashIcon className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <CardDescription className="text-sm text-gray-500 mb-2">Status: {menu.status}</CardDescription>
            {menu.template_name && <p className="text-sm text-gray-600 mb-2">Template: {menu.template_name}</p>}
            <p className="text-sm text-gray-600">Created: {format(new Date(menu.created_at), "MMM dd, yyyy")}</p>
            {menu.qr_code_url && (
              <div className="mt-4">
                <img
                  src={menu.qr_code_url || "/placeholder.svg"}
                  alt={`QR Code for ${menu.name}`}
                  className="w-24 h-24 object-contain"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
