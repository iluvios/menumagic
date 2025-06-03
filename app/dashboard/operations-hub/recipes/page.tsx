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
import { getRecipes, createRecipe, updateRecipe, deleteRecipe, getCategoriesByType } from "@/lib/actions/recipe-actions"
import { formatCurrency } from "@/lib/utils/formatters" // Corrected import
import { Plus, Edit, Trash2, ChefHat, XCircle, Search } from "lucide-react"

interface Recipe {
  id: number
  name: string
  description: string
  instructions: string
  prep_time_minutes: number
  cook_time_minutes: number
  servings: number
  category_id: number
  category_name?: string
  cost_per_serving?: number
}

interface Category {
  id: number
  name: string
}

export default function RecipeManagementPage() {
  const { toast } = useToast()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentRecipe, setCurrentRecipe] = useState<Recipe | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")

  useEffect(() => {
    fetchRecipes()
    fetchCategories()
  }, [])

  const fetchRecipes = async () => {
    const data = await getRecipes()
    setRecipes(data)
  }

  const fetchCategories = async () => {
    const data = await getCategoriesByType("recipe")
    setCategories(data)
  }

  const handleCreateUpdateRecipe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const description = formData.get("description") as string
    const instructions = formData.get("instructions") as string
    const prep_time_minutes = Number.parseInt(formData.get("prep_time_minutes") as string)
    const cook_time_minutes = Number.parseInt(formData.get("cook_time_minutes") as string)
    const servings = Number.parseInt(formData.get("servings") as string)
    const category_id = Number.parseInt(formData.get("category_id") as string)

    const data = {
      name,
      description,
      instructions,
      prep_time_minutes,
      cook_time_minutes,
      servings,
      category_id,
    }

    try {
      if (currentRecipe?.id) {
        await updateRecipe(currentRecipe.id, data)
        toast({ title: "Receta Actualizada", description: "La receta ha sido actualizada exitosamente." })
      } else {
        await createRecipe(data)
        toast({ title: "Receta Creada", description: "La nueva receta ha sido creada exitosamente." })
      }
      fetchRecipes()
      setIsDialogOpen(false)
      setCurrentRecipe(null)
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "No se pudo guardar la receta.", variant: "destructive" })
    }
  }

  const handleDeleteRecipe = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta receta?")) {
      try {
        await deleteRecipe(id)
        toast({ title: "Receta Eliminada", description: "La receta ha sido eliminada." })
        fetchRecipes()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar la receta.",
          variant: "destructive",
        })
      }
    }
  }

  const filteredRecipes = useMemo(() => {
    let filtered = recipes.filter(
      (recipe) =>
        recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        recipe.description.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    if (filterCategory !== "all") {
      filtered = filtered.filter((recipe) => recipe.category_id === Number.parseInt(filterCategory))
    }

    return filtered
  }, [recipes, searchTerm, filterCategory])

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Gestión de Recetas</h1>
            <p className="text-neutral-600">Crea, edita y organiza todas las recetas de tu restaurante.</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                className="bg-warm-500 hover:bg-warm-600 text-white shadow-md whitespace-nowrap"
                onClick={() => setCurrentRecipe(null)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Receta
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white p-6 rounded-lg shadow-xl">
              <DialogHeader>
                <DialogTitle>{currentRecipe ? "Editar Receta" : "Crear Nueva Receta"}</DialogTitle>
                <DialogDescription>
                  {currentRecipe ? "Realiza cambios en esta receta." : "Añade una nueva receta a tu colección."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUpdateRecipe} className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Nombre
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    defaultValue={currentRecipe?.name || ""}
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
                    defaultValue={currentRecipe?.description || ""}
                    className="col-span-3"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="instructions" className="text-right">
                    Instrucciones
                  </Label>
                  <Textarea
                    id="instructions"
                    name="instructions"
                    defaultValue={currentRecipe?.instructions || ""}
                    className="col-span-3"
                    rows={5}
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="prep_time_minutes" className="text-right">
                    Tiempo Prep. (min)
                  </Label>
                  <Input
                    id="prep_time_minutes"
                    name="prep_time_minutes"
                    type="number"
                    step="1"
                    defaultValue={currentRecipe?.prep_time_minutes || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="cook_time_minutes" className="text-right">
                    Tiempo Cocción (min)
                  </Label>
                  <Input
                    id="cook_time_minutes"
                    name="cook_time_minutes"
                    type="number"
                    step="1"
                    defaultValue={currentRecipe?.cook_time_minutes || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="servings" className="text-right">
                    Porciones
                  </Label>
                  <Input
                    id="servings"
                    name="servings"
                    type="number"
                    step="1"
                    defaultValue={currentRecipe?.servings || ""}
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="category_id" className="text-right">
                    Categoría
                  </Label>
                  <Select name="category_id" defaultValue={currentRecipe?.category_id?.toString() || ""} required>
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
                    {currentRecipe ? "Guardar cambios" : "Crear Receta"}
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
              placeholder="Buscar recetas..."
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
            <CardTitle className="text-xl font-semibold text-neutral-800">Lista de Recetas</CardTitle>
            <CardDescription>{filteredRecipes.length} recetas encontradas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12 text-neutral-500">
                <XCircle className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
                <p className="text-lg">No se encontraron recetas.</p>
                <p className="text-sm">Intenta ajustar tus filtros o añade una nueva receta.</p>
              </div>
            ) : (
              filteredRecipes.map((recipe) => (
                <Card
                  key={recipe.id}
                  className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-center space-x-3">
                    <ChefHat className="h-8 w-8 text-neutral-500" />
                    <div>
                      <h3 className="font-medium text-neutral-800">{recipe.name}</h3>
                      <p className="text-xs text-neutral-500 max-w-xs truncate" title={recipe.description}>
                        {recipe.description || "Sin descripción"}
                      </p>
                      <p className="text-xs text-neutral-500">
                        Categoría: {recipe.category_name || "N/A"} | Porciones: {recipe.servings}
                      </p>
                      {recipe.cost_per_serving !== undefined && (
                        <p className="text-xs text-neutral-500">
                          Costo por porción: {formatCurrency(recipe.cost_per_serving)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setCurrentRecipe(recipe)
                            setIsDialogOpen(true)
                          }}
                        >
                          <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Editar Receta</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleDeleteRecipe(recipe.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Eliminar Receta</p>
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
