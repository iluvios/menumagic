"use client"

import type React from "react" // Ensure React is imported for client components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface DigitalMenu {
  id: number
  name: string
  status: string
}

interface DigitalMenuFormContentProps {
  selectedMenu: DigitalMenu | null
  menus: DigitalMenu[] // To check if it's a new menu
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function DigitalMenuFormContent({ selectedMenu, menus, onSubmit }: DigitalMenuFormContentProps) {
  const isEditing = selectedMenu && menus.some((m) => m.id === selectedMenu.id)

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEditing ? "Editar Menú Digital" : "Crear Menú Digital"}</DialogTitle>
        <DialogDescription>
          {isEditing ? "Realiza cambios en tu menú digital." : "Crea un nuevo menú digital para tu restaurante."}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={onSubmit} className="grid gap-4 py-4">
        {!isEditing && <input type="hidden" name="is_new" value="true" />}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="name" className="text-right">
            Nombre
          </Label>
          <Input id="name" name="name" defaultValue={selectedMenu?.name || ""} className="col-span-3" required />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            Estado
          </Label>
          <Select name="status" defaultValue={selectedMenu?.status || "draft"}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Selecciona un estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Activo</SelectItem>
              <SelectItem value="draft">Borrador</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
            {isEditing ? "Guardar cambios" : "Crear Menú"}
          </Button>
        </DialogFooter>
      </form>
    </>
  )
}
