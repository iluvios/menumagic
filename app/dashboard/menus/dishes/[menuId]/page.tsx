"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit3, Trash2, ImageIcon, Eye, Filter, Star, TrendingUp, Loader2 } from "lucide-react"
import { getMenuItemsByMenuId, deleteMenuItem } from "@/lib/actions/menu-studio-actions" // Removed create/updateMenuItem
import { getCategories } from "@/lib/actions/category-actions"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/db" // Assuming formatCurrency is here
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog" // Import the new dialog

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name: string
  image_url?: string | null
}

interface Category {
  id: number
  name: string
  type: string
}

export default function DishManagementPage() {
  const params = useParams()
  const digitalMenuId = Number.parseInt(params.menuId as string)

  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null) // State for editing

  const fetchInitialData = async () => {
    setLoading(true)
    setError(null)
    try {
      const fetchedItems = await getMenuItemsByMenuId(digitalMenuId)
      setMenuItems(fetchedItems)
      const fetchedCategories = await getCategories() // Fetch all categories
      setCategories(fetchedCategories.filter((cat) => cat.type === "menu_item")) // Filter for menu item categories
    } catch (err) {
      console.error("Failed to fetch initial data:", err)
      setError("Failed to load dishes or categories.")
      toast({
        title: "Error",
        description: "Failed to load dishes or categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (digitalMenuId) {
      fetchInitialData()
    }
  }, [digitalMenuId])

  const filteredDishes = menuItems.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategoryFilter === "all" || dish.menu_category_id === Number.parseInt(selectedCategoryFilter)
    return matchesSearch && matchesCategory
  })

  const handleDelete = async (id: number) => {
    if (window.confirm("¿Estás seguro de que quieres eliminar este platillo?")) {
      try {
        await deleteMenuItem(id)
        toast({ title: "Éxito", description: "Platillo eliminado exitosamente." })
        fetchInitialData() // Re-fetch data to update the list
      } catch (err: any) {
        console.error("Delete error:", err)
        toast({
          title: "Error",
          description: err.message || "No se pudo eliminar el platillo. Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="ml-2 text-gray-600">Cargando platillos...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>{error}</p>
        <Button onClick={fetchInitialData} className="mt-4">
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Platillos</h2>
          <p className="text-gray-600">Administra los platillos de tu menú (ID: {digitalMenuId})</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
              onClick={() => {
                setEditingDish(null) // Ensure we're creating a new dish
                setIsAddDialogOpen(true)
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Agregar Platillo
            </Button>
          </DialogTrigger>
          <MenuItemFormDialog
            isOpen={isAddDialogOpen}
            onOpenChange={setIsAddDialogOpen}
            currentMenuItem={editingDish}
            digitalMenuId={digitalMenuId}
            categories={categories}
            onSaveSuccess={fetchInitialData} // Callback to refresh list
          />
        </Dialog>
      </div>

      {/* Stats - These will need to be dynamic from DB in a real app */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Platillos</p>
                <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <Plus className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platillos Activos</p>
                <p className="text-2xl font-bold text-gray-900">{menuItems.length}</p> {/* All are active for now */}
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <Eye className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  {menuItems.length > 0
                    ? formatCurrency(menuItems.reduce((sum, dish) => sum + dish.price, 0) / menuItems.length)
                    : formatCurrency(0)}
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Más Popular</p>
                <p className="text-lg font-bold text-gray-900">N/A</p> {/* Needs analytics integration */}
              </div>
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <Star className="w-6 h-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar platillos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
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
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dishes List */}
      <Card>
        <CardHeader>
          <CardTitle>Platillos ({filteredDishes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDishes.length === 0 ? (
              <p className="text-center text-gray-500">No se encontraron platillos para este menú. ¡Añade uno!</p>
            ) : (
              filteredDishes.map((dish) => (
                <div key={dish.id} className={`border rounded-lg p-4 transition-all ${"border-gray-200 bg-white"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                        {dish.image_url ? (
                          <img
                            src={dish.image_url || "/placeholder.svg"}
                            alt={dish.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className={`font-semibold text-gray-900`}>{dish.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {dish.category_name}
                          </Badge>
                        </div>
                        <p className={`text-sm mb-2 text-gray-600`}>{dish.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500"></div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold text-orange-600`}>{formatCurrency(dish.price)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Dialog
                        open={editingDish?.id === dish.id}
                        onOpenChange={(open) => {
                          if (!open) setEditingDish(null)
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingDish(dish)}
                            className="text-blue-600"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <MenuItemFormDialog
                          isOpen={editingDish?.id === dish.id}
                          onOpenChange={(open) => {
                            if (!open) setEditingDish(null)
                          }}
                          currentMenuItem={editingDish}
                          digitalMenuId={digitalMenuId}
                          categories={categories}
                          onSaveSuccess={fetchInitialData}
                        />
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(dish.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
