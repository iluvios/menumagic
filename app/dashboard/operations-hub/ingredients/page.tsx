"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  getCategoriesByType,
} from "@/lib/actions/ingredient-actions"
import { formatCurrency } from "@/lib/utils/formatters" // Corrected import
import { Plus, Edit, Trash2, Package, XCircle, Search } from "lucide-react"

interface Ingredient {
  id: number
  name: string
  description: string
  unit_of_measure: string
  cost_per_unit: number
  category_id: number
  category_name?: string
  supplier_id?: number
  supplier_name?: string
}

interface Category {
  id: number
  name: string
}

export default function IngredientManagementPage() {
  const { toast } = useToast()
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentIngredient, setCurrentIngredient] = useState<Ingredient | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    fetchIngredients()
    fetchCategories()
  }, [])

  const fetchIngredients = async () => {
    const data = await getIngredients()
    setIngredients(data)
  }

  const fetchCategories = async () => {
    const data = await getCategoriesByType("ingredient")
    setCategories(data)
  }

  const handleCreateUpdateIngredient = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const unit_of_measure = formData.get("unit_of_measure") as string
    const cost_per_unit = Number.parseFloat(formData.get("cost_per_unit") as string)
    const category_id = Number.parseInt(formData.get("category_id") as string)

    const data = {
      name,
      description,
      unit_of_measure,
      cost_per_unit,
      category_id,
    }

    try {
      if (currentIngredient?.id) {
        await updateIngredient(currentIngredient.id, data)
        toast({ title: "Ingrediente Actualizado", description: "El ingrediente ha sido actualizado exitosamente." })
      } else {
        await createIngredient(data)
        toast({ title: "Ingrediente Creado", description: "El nuevo ingrediente ha sido creado exitosamente." })
      }
      fetchIngredients()
      setIsDialogOpen(false)
      setCurrentIngredient(null)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el ingrediente.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteIngredient = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este ingrediente?")) {
      try {
        await deleteIngredient(id)
        toast({ title: "Ingrediente Eliminado", description: "El ingrediente ha sido eliminado." })
        fetchIngredients()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar el ingrediente.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredIngredients = useMemo(() => {
    let filtered = ingredients.filter(
      (ingredient) =>
        ingredient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ingredient.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterCategory !== "all") {
      filtered = filtered.filter((ingredient) => ingredient.category_id === Number.parseInt(filterCategory))
    }

    return filtered
  }, [ingredients, searchTerm, filterCategory])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Gestión de Ingredientes</h1>
            <p className="text-neutral-600">Centraliza y gestiona todos los ingredientes de tu restaurante.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
                onClick={() => setCurrentIngredient(null)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Ingrediente
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle>{currentIngredient ? "Editar Ingrediente" : "Crear Nuevo Ingrediente"}</DialogTitle>
                <DialogDescription>
                  {currentIngredient
                    ? "Realiza cambios en este ingrediente."
                    : "Añade un nuevo ingrediente a tu inventario."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUpdateIngredient} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={currentIngredient?.name || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    name="description"
                    defaultValue={currentIngredient?.description || ""}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="unit_of_measure" className="text-right">
                    Unidad de Medida
                  </Label>
                  <Input
                    id="unit_of_measure"
                    name="unit_of_measure"
                    defaultValue={currentIngredient?.unit_of_measure || ""}
                    className="col-span-3"
                    placeholder="Ej: kg, litros, unidades"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cost_per_unit" className="text-right">
                    Costo por Unidad
                  </Label>
                  <Input
                    id="cost_per_unit"
                    name="cost_per_unit"
                    type="number"
                    step="0.01"
                    defaultValue={currentIngredient?.cost_per_unit || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category_id" className="text-right">
                    Categoría
                  </Label>
                  <Select name="category_id" defaultValue={currentIngredient?.category_id?.toString() || ""} required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecciona una categoría" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <DialogFooter>
                  <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                    {currentIngredient ? "Guardar cambios" : "Crear Ingrediente"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar ingredientes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-2 border border-neutral-300 rounded-md w-full"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filtrar por categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-neutral-800">Lista de Ingredientes</CardTitle>
            <CardDescription>{filteredIngredients.length} ingredientes encontrados.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredIngredients.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <XCircle className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
                <p className="text-lg">No se encontraron ingredientes.</p>
                <p className="text-sm">Intenta ajustar tus filtros o añade un nuevo ingrediente.</p>
              </div>
            ) : (
              filteredIngredients.map((ingredient) => (
                <Card
                  key={ingredient.id}
                  className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <Package className="h-8 w-8 text-neutral-500" />
                    <div>
                      <h3 className="font-medium text-neutral-800">{ingredient.name}</h3>
                      <p className="text-xs text-neutral-500 max-w-xs truncate" title={ingredient.description}>
                        {ingredient.description || "Sin descripción"}
                      </p>
                      <p className="text-xs text-neutral-500">Categoría: {ingredient.category_name || "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-neutral-900 text-sm">
                      {formatCurrency(ingredient.cost_per_unit)} / {ingredient.unit_of_measure}
                    </span>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setCurrentIngredient(ingredient)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar Ingrediente</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteIngredient(ingredient.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar Ingrediente</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </Card>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  )
}
