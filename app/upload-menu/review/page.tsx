"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Menu, ArrowLeft, ArrowRight, Edit3, Trash2, Plus, CheckCircle } from "lucide-react"
import Link from "next/link"

interface Dish {
  id: string
  name: string
  description: string
  price: string
  category: string
}

export default function ReviewPage() {
  const [dishes, setDishes] = useState<Dish[]>([
    {
      id: "1",
      name: "Tacos al Pastor",
      description: "Deliciosos tacos con carne al pastor, piña, cebolla y cilantro",
      price: "45.00",
      category: "Tacos",
    },
    {
      id: "2",
      name: "Quesadilla de Flor de Calabaza",
      description: "Quesadilla artesanal con flor de calabaza fresca y queso oaxaca",
      price: "65.00",
      category: "Quesadillas",
    },
    {
      id: "3",
      name: "Pozole Rojo",
      description: "Pozole tradicional con carne de cerdo, maíz pozolero y chile guajillo",
      price: "85.00",
      category: "Sopas",
    },
    {
      id: "4",
      name: "Agua de Horchata",
      description: "Refrescante agua de horchata con canela y vainilla",
      price: "25.00",
      category: "Bebidas",
    },
    {
      id: "5",
      name: "Enchiladas Verdes",
      description: "Enchiladas bañadas en salsa verde con pollo, crema y queso",
      price: "75.00",
      category: "Platillos Principales",
    },
    {
      id: "6",
      name: "Flan Napolitano",
      description: "Postre tradicional con caramelo y vainilla",
      price: "35.00",
      category: "Postres",
    },
  ])

  const [editingDish, setEditingDish] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Dish | null>(null)

  const categories = [...new Set(dishes.map((dish) => dish.category))]

  const handleEdit = (dish: Dish) => {
    setEditingDish(dish.id)
    setEditForm({ ...dish })
  }

  const handleSave = () => {
    if (editForm) {
      setDishes(dishes.map((dish) => (dish.id === editForm.id ? editForm : dish)))
      setEditingDish(null)
      setEditForm(null)
    }
  }

  const handleCancel = () => {
    setEditingDish(null)
    setEditForm(null)
  }

  const handleDelete = (id: string) => {
    setDishes(dishes.filter((dish) => dish.id !== id))
  }

  const handleAddDish = () => {
    const newDish: Dish = {
      id: Date.now().toString(),
      name: "Nuevo Platillo",
      description: "Descripción del platillo",
      price: "0.00",
      category: "Sin Categoría",
    }
    setDishes([...dishes, newDish])
    handleEdit(newDish)
  }

  const handleContinue = () => {
    window.location.href = "/upload-menu/template"
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/upload-menu"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">MenuMagic</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="w-12 h-1 bg-green-500" />
            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
            </div>
            <div className="w-12 h-1 bg-orange-500" />
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-medium">
              3
            </div>
            <div className="w-12 h-1 bg-gray-200" />
            <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">
              4
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Revisa y edita tu menú</h2>
          <p className="text-gray-600">
            Nuestra IA ha extraído {dishes.length} platillos. Revisa la información y haz los ajustes necesarios
          </p>
        </div>

        {/* Summary */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-orange-500">{dishes.length}</div>
              <div className="text-sm text-gray-600">Platillos detectados</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-green-500">{categories.length}</div>
              <div className="text-sm text-gray-600">Categorías</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-blue-500">
                ${Math.round(dishes.reduce((sum, dish) => sum + Number.parseFloat(dish.price), 0) / dishes.length)}
              </div>
              <div className="text-sm text-gray-600">Precio promedio</div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg">
            <CardContent className="p-6 text-center">
              <Button
                onClick={handleAddDish}
                className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Agregar platillo
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Dishes by category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <Card key={category} className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{category}</span>
                  <Badge variant="outline">
                    {dishes.filter((dish) => dish.category === category).length} platillos
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {dishes
                    .filter((dish) => dish.category === category)
                    .map((dish) => (
                      <div key={dish.id} className="border border-gray-200 rounded-lg p-4">
                        {editingDish === dish.id && editForm ? (
                          <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="name">Nombre del platillo</Label>
                                <Input
                                  id="name"
                                  value={editForm.name}
                                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor="price">Precio</Label>
                                <div className="relative mt-1">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                    $
                                  </span>
                                  <Input
                                    id="price"
                                    value={editForm.price}
                                    onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                                    className="pl-8"
                                  />
                                </div>
                              </div>
                            </div>
                            <div>
                              <Label htmlFor="description">Descripción</Label>
                              <Textarea
                                id="description"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                className="mt-1"
                                rows={2}
                              />
                            </div>
                            <div>
                              <Label htmlFor="category">Categoría</Label>
                              <Input
                                id="category"
                                value={editForm.category}
                                onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                className="mt-1"
                              />
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                onClick={handleSave}
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                Guardar
                              </Button>
                              <Button onClick={handleCancel} variant="outline" size="sm">
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3 mb-2">
                                <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                                <span className="text-lg font-bold text-orange-600">${dish.price}</span>
                              </div>
                              <p className="text-gray-600 text-sm">{dish.description}</p>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              <Button
                                onClick={() => handleEdit(dish)}
                                variant="outline"
                                size="sm"
                                className="text-blue-600 border-blue-200 hover:bg-blue-50"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => handleDelete(dish.id)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Continue button */}
        <div className="flex justify-end mt-8">
          <Button
            onClick={handleContinue}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8"
          >
            Continuar con plantillas
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </main>
    </div>
  )
}
