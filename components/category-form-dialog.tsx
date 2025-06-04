"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createCategory, updateCategory } from "@/lib/actions/category-actions"
import { useToast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"

interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

interface CategoryFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  currentCategory?: Category | null
  onSaveSuccess: () => void
}

export function CategoryFormDialog({ isOpen, onOpenChange, currentCategory, onSaveSuccess }: CategoryFormDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState(currentCategory?.name || "")
  const [type, setType] = useState(currentCategory?.type || "menu_item") // Default to 'menu_item'
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(currentCategory?.name || "")
      setType(currentCategory?.type || "menu_item")
    }
  }, [isOpen, currentCategory])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      if (currentCategory) {
        await updateCategory(currentCategory.id, name)
        toast({ title: "Categoría actualizada", description: "La categoría ha sido actualizada exitosamente." })
      } else {
        await createCategory(name, type)
        toast({ title: "Categoría creada", description: "La nueva categoría ha sido creada exitosamente." })
      }
      onSaveSuccess()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la categoría.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle>{currentCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              required
              disabled={isSaving}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Tipo
            </Label>
            <Select value={type} onValueChange={setType} disabled={isSaving || !!currentCategory}>
              {" "}
              {/* Disable type change for existing categories */}
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="menu_item">Elemento de Menú</SelectItem>
                <SelectItem value="ingredient">Ingrediente</SelectItem>
                {/* Add other types as needed */}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...
                </>
              ) : (
                "Guardar Cambios"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
