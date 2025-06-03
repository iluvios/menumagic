"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { useActionState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Plus, Search, Edit3, Trash2, ImageIcon, Eye, Filter, Star, TrendingUp, Loader2 } from "lucide-react"
import { getMenuItemsByMenuId, createMenuItem, updateMenuItem, deleteMenuItem } from "@/lib/actions/menu-studio-actions"
import { getCategories } from "@/lib/actions/category-actions"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/db"

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name: string
  image_url?: string | null
  // isActive: boolean; // Assuming all items are active for now, or status is managed elsewhere
  // isPopular?: boolean;
  // views: number;
  // orders: number;
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
  const [editingDish, setEditingDish] = useState<MenuItem | null>(null)

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

  const DishForm = ({
    dish,
    onSave,
    onCancel,
  }: { dish?: MenuItem | null; onSave: () => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState({
      name: dish?.name || "",
      description: dish?.description || "",
      price: dish?.price || 0,
      menu_category_id: dish?.menu_category_id?.toString() || "",
      imageFile: null as File | null,
      current_image_url: dish?.image_url || null,
    })

    const [state, formAction] = useActionState(async (prevState: any, data: FormData) => {
      const name = data.get("name") as string
      const description = data.get("description") as string
      const price = Number.parseFloat(data.get("price") as string)
      const menu_category_id = Number.parseInt(data.get("menu_category_id") as string)
      const imageFile = data.get("imageFile") as File | null

      if (!name || !description || isNaN(price) || !menu_category_id) {
        return { success: false, message: "All fields must be completed." }
      }

      try {
        if (dish) {
          // Update existing item
          await updateMenuItem(
            dish.id,
            {
              name,
              description,
              price,
              menu_category_id,
              image_url: formData.current_image_url === null ? null : undefined, // Only send null if explicitly cleared
            },
            imageFile && imageFile.size > 0 ? imageFile : undefined,
          )
          toast({ title: "Success", description: "Dish updated successfully." })
        } else {
          // Create new item
          await createMenuItem(
            {
              digital_menu_id: digitalMenuId,
              name,
              description,
              price,
              menu_category_id,
            },
            imageFile && imageFile.size > 0 ? imageFile : undefined,
          )
          toast({ title: "Success", description: "Dish added successfully." })
        }
        onSave()
        fetchInitialData() // Re-fetch data to update the list
        return { success: true }
      } catch (err: any) {
        console.error("Form action error:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to save dish. Please try again.",
          variant: "destructive",
        })
        return { success: false, message: err.message || "Failed to save dish." }
      }
    }, null)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
        setFormData({ ...formData, imageFile: e.target.files[0], current_image_url: null })
      }
    }

    const handleRemoveImage = () => {
      setFormData({ ...formData, imageFile: null, current_image_url: null })
    }

    return (
      <form action={formAction} className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre del platillo</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Tacos al Pastor"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe los ingredientes y preparación..."
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                className="pl-8"
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="menu_category_id">Categoría</Label>
            <Select
              value={formData.menu_category_id}
              onValueChange={(value) => setFormData({ ...formData, menu_category_id: value })}
              name="menu_category_id"
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
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
        </div>

        <div>
          <Label htmlFor="imageFile">Imagen del platillo</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center relative">
            {formData.current_image_url && !formData.imageFile ? (
              <>
                <img
                  src={formData.current_image_url || "/placeholder.svg"}
                  alt="Current dish image"
                  className="mx-auto h-24 w-24 object-cover rounded-md mb-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-red-500"
                  onClick={handleRemoveImage}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            )}
            <p className="text-sm text-gray-600">Arrastra una imagen o haz clic para seleccionar</p>
            <Input
              id="imageFile"
              name="imageFile"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
            />
          </div>
        </div>

        {state?.message && (
          <p className={`text-sm ${state.success ? "text-green-600" : "text-red-600"}`}>{state.message}</p>
        )}

        <DialogFooter className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel} type="button">
            Cancelar
          </Button>
          <Button type="submit" className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            {state?.pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
              </>
            ) : dish ? (
              "Actualizar Platillo"
            ) : (
              "Agregar Platillo"
            )}
          </Button>
        </DialogFooter>
      </form>
    )
  }

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this dish?")) {
      try {
        await deleteMenuItem(id)
        toast({ title: "Success", description: "Dish deleted successfully." })
        fetchInitialData()
      } catch (err: any) {
        console.error("Delete error:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to delete dish. Please try again.",
          variant: "destructive",
        })
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <p className="ml-2 text-gray-600">Loading dishes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>{error}</p>
        <Button onClick={fetchInitialData} className="mt-4">
          Retry
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
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Agregar Platillo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Agregar Nuevo Platillo</DialogTitle>
            </DialogHeader>
            <DishForm onSave={() => setIsAddDialogOpen(false)} onCancel={() => setIsAddDialogOpen(false)} />
          </DialogContent>
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
              <p className="text-center text-gray-500">No dishes found for this menu. Add one!</p>
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
                          {/* {dish.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-current" />} */}
                          <Badge variant="outline" className="text-xs">
                            {dish.category_name}
                          </Badge>
                          {/* {!dish.isActive && (
                            <Badge variant="secondary" className="text-xs">
                              Inactivo
                            </Badge>
                          )} */}
                        </div>
                        <p className={`text-sm mb-2 text-gray-600`}>{dish.description}</p>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          {/* <span>{dish.views} vistas</span>
                          <span>{dish.orders} órdenes</span> */}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-xl font-bold text-orange-600`}>{formatCurrency(dish.price)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      {/* <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleDishStatus(dish.id)}
                        className={dish.isActive ? "text-gray-600" : "text-green-600"}
                      >
                        {dish.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button> */}
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
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Editar Platillo</DialogTitle>
                          </DialogHeader>
                          <DishForm
                            dish={editingDish}
                            onSave={() => setEditingDish(null)}
                            onCancel={() => setEditingDish(null)}
                          />
                        </DialogContent>
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
