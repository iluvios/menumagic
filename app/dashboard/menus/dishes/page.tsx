"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Search, Edit3, Trash2, ImageIcon, Eye, EyeOff, Filter, Star, TrendingUp } from "lucide-react"

interface Dish {
  id: string
  name: string
  description: string
  price: number
  category: string
  image?: string
  isActive: boolean
  isPopular?: boolean
  views: number
  orders: number
}

export default function DishManagementPage() {
  const [dishes, setDishes] = useState<Dish[]>([
    {
      id: "1",
      name: "Tacos al Pastor",
      description: "Deliciosos tacos con carne al pastor, piña, cebolla y cilantro",
      price: 45,
      category: "Tacos",
      isActive: true,
      isPopular: true,
      views: 234,
      orders: 89,
    },
    {
      id: "2",
      name: "Quesadilla de Flor de Calabaza",
      description: "Quesadilla artesanal con flor de calabaza fresca y queso oaxaca",
      price: 65,
      category: "Quesadillas",
      isActive: true,
      views: 156,
      orders: 45,
    },
    {
      id: "3",
      name: "Pozole Rojo",
      description: "Pozole tradicional con carne de cerdo, maíz pozolero y chile guajillo",
      price: 85,
      category: "Sopas",
      isActive: false,
      views: 98,
      orders: 23,
    },
    {
      id: "4",
      name: "Enchiladas Verdes",
      description: "Enchiladas bañadas en salsa verde con pollo, crema y queso",
      price: 75,
      category: "Platillos Principales",
      isActive: true,
      views: 189,
      orders: 67,
    },
    {
      id: "5",
      name: "Agua de Horchata",
      description: "Refrescante agua de horchata con canela y vainilla",
      price: 25,
      category: "Bebidas",
      isActive: true,
      views: 145,
      orders: 78,
    },
  ])

  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)

  const categories = ["all", ...new Set(dishes.map((dish) => dish.category))]

  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || dish.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const toggleDishStatus = (id: string) => {
    setDishes(dishes.map((dish) => (dish.id === id ? { ...dish, isActive: !dish.isActive } : dish)))
  }

  const deleteDish = (id: string) => {
    setDishes(dishes.filter((dish) => dish.id !== id))
  }

  const DishForm = ({ dish, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState(
      dish || {
        name: "",
        description: "",
        price: 0,
        category: "",
        isActive: true,
      },
    )

    const handleSave = () => {
      if (dish) {
        setDishes(dishes.map((d) => (d.id === dish.id ? { ...d, ...formData } : d)))
      } else {
        const newDish = {
          ...formData,
          id: Date.now().toString(),
          views: 0,
          orders: 0,
        }
        setDishes([...dishes, newDish])
      }
      onSave()
    }

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre del platillo</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Ej: Tacos al Pastor"
          />
        </div>

        <div>
          <Label htmlFor="description">Descripción</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Describe los ingredientes y preparación..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="price">Precio</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number.parseFloat(e.target.value) })}
                className="pl-8"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="category">Categoría</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Tacos">Tacos</SelectItem>
                <SelectItem value="Quesadillas">Quesadillas</SelectItem>
                <SelectItem value="Sopas">Sopas</SelectItem>
                <SelectItem value="Platillos Principales">Platillos Principales</SelectItem>
                <SelectItem value="Bebidas">Bebidas</SelectItem>
                <SelectItem value="Postres">Postres</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Imagen del platillo</Label>
          <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">Arrastra una imagen o haz clic para seleccionar</p>
            <Button variant="outline" size="sm" className="mt-2">
              Subir imagen
            </Button>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={handleSave} className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
            {dish ? "Actualizar" : "Agregar"} Platillo
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Platillos</h2>
          <p className="text-gray-600">Administra los platillos de tu menú</p>
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Platillos</p>
                <p className="text-2xl font-bold text-gray-900">{dishes.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{dishes.filter((d) => d.isActive).length}</p>
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
                  ${Math.round(dishes.reduce((sum, dish) => sum + dish.price, 0) / dishes.length)}
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
                <p className="text-lg font-bold text-gray-900">Tacos al Pastor</p>
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
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  {categories.slice(1).map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
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
            {filteredDishes.map((dish) => (
              <div
                key={dish.id}
                className={`border rounded-lg p-4 transition-all ${
                  dish.isActive ? "border-gray-200 bg-white" : "border-gray-100 bg-gray-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className={`font-semibold ${dish.isActive ? "text-gray-900" : "text-gray-500"}`}>
                          {dish.name}
                        </h3>
                        {dish.isPopular && <Star className="w-4 h-4 text-yellow-500 fill-current" />}
                        <Badge variant="outline" className="text-xs">
                          {dish.category}
                        </Badge>
                        {!dish.isActive && (
                          <Badge variant="secondary" className="text-xs">
                            Inactivo
                          </Badge>
                        )}
                      </div>
                      <p className={`text-sm mb-2 ${dish.isActive ? "text-gray-600" : "text-gray-400"}`}>
                        {dish.description}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{dish.views} vistas</span>
                        <span>{dish.orders} órdenes</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${dish.isActive ? "text-orange-600" : "text-gray-400"}`}>
                        ${dish.price}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleDishStatus(dish.id)}
                      className={dish.isActive ? "text-gray-600" : "text-green-600"}
                    >
                      {dish.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                    <Dialog>
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
                    <Button variant="outline" size="sm" onClick={() => deleteDish(dish.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
