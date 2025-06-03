"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Edit, Trash2, Search } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { getCategories, createCategory, updateCategory, deleteCategory } from "@/lib/actions/category-actions"
import { Filter } from "lucide-react" // Import Filter component

interface Category {
  id: number
  name: string
  type: string
  restaurant_id: number
}

export default function CategoryManagementPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null)

  // TODO: Replace with actual restaurant_id from auth context
  const restaurantId = 1

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const data = await getCategories(restaurantId)
      setCategories(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías.",
        variant: "destructive",
      })
    }
  }

  const handleCreateUpdateCategory = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const name = formData.get("name") as string
    const type = formData.get("type") as string

    try {
      if (currentCategory?.id) {
        await updateCategory(currentCategory.id, { name, type })
        toast({ title: "Categoría Actualizada", description: "La categoría ha sido actualizada exitosamente." })
      } else {
        await createCategory({ name, type, restaurant_id: restaurantId })
        toast({ title: "Categoría Creada", description: "La nueva categoría ha sido creada exitosamente." })
      }
      fetchCategories()
      setIsDialogOpen(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar la categoría.",
        variant: "destructive",
      })
    }
  }

  const handleDeleteCategory = async (id: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar esta categoría?")) {
      try {
        await deleteCategory(id)
        toast({ title: "Categoría Eliminada", description: "La categoría ha sido eliminada." })
        fetchCategories()
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "No se pudo eliminar la categoría.",
          variant: "destructive",
        })
      }
    }
  }

  const handleOpenDialog = (category?: Category) => {
    setCurrentCategory(category || null)
    setIsDialogOpen(true)
  }

  const filteredCategories = categories.filter((category) => {
    const matchesSearch = category.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === "all" || category.type === filterType
    return matchesSearch && matchesType
  })

  const uniqueTypes = Array.from(new Set(categories.map((cat) => cat.type))).filter(Boolean)

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Category Management</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md" onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle>{currentCategory ? "Editar Categoría" : "Crear Nueva Categoría"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateUpdateCategory} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Nombre
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={currentCategory?.name || ""}
                  className="col-span-3"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Tipo
                </Label>
                <Select name="type" defaultValue={currentCategory?.type || ""}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="recipe">Receta / Plato</SelectItem>
                    <SelectItem value="ingredient">Ingrediente</SelectItem>
                    <SelectItem value="expense">Gasto</SelectItem>
                    {uniqueTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                  {currentCategory ? "Guardar cambios" : "Crear Categoría"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-neutral-600">Gestiona las categorías para tus recetas, ingredientes y gastos.</p>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-800">Lista de Categorías</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Buscar por nombre..."
                className="pl-10 h-10 bg-neutral-100 border-0 rounded-lg focus:ring-2 focus:ring-warm-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <select
                className="pl-10 h-10 bg-neutral-100 border-0 rounded-lg focus:ring-2 focus:ring-warm-200 appearance-none pr-4 w-full md:w-auto"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="all">Todos los Tipos</option>
                <option value="recipe">Receta / Plato</option>
                <option value="ingredient">Ingrediente</option>
                <option value="expense">Gasto</option>
                {uniqueTypes.map((type) => (
                  <option key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center text-neutral-500">
                    No se encontraron categorías.
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 text-xs rounded-full bg-neutral-100 text-neutral-800">
                        {category.type.charAt(0).toUpperCase() + category.type.slice(1)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(category)}>
                        <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteCategory(category.id)}>
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
