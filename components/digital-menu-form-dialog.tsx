"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface DigitalMenu {
  id: number
  name: string
  status: string
  qr_code_url?: string
}

interface DigitalMenuFormDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  onSubmit: (menuData: { name: string; status: string }) => void
  initialData?: DigitalMenu | null
}

export function DigitalMenuFormDialog({ isOpen, onOpenChange, onSubmit, initialData }: DigitalMenuFormDialogProps) {
  const [name, setName] = useState("")
  const [status, setStatus] = useState("draft")

  const isEditing = initialData !== null && initialData !== undefined

  useEffect(() => {
    if (isEditing && initialData) {
      setName(initialData.name)
      setStatus(initialData.status)
    } else {
      setName("")
      setStatus("draft")
    }
  }, [initialData, isEditing])

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ name, status })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Menú Digital" : "Crear Nuevo Menú Digital"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Actualiza los detalles de tu menú digital."
              : "Crea un nuevo menú digital para tu restaurante."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del menú"
              className="col-span-3"
              required
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-right">
              Estado
            </Label>
            <select
              id="status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              required
            >
              <option value="draft">Borrador</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </div>
          <DialogFooter>
            <Button type="submit">{isEditing ? "Actualizar Menú" : "Crear Menú"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
