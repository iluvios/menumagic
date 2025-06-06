"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getAllDishes, getAllIngredients } from "@/lib/actions/recipe-actions"
import { getCategories } from "@/lib/actions/category-actions"
import { DishRecipeDialog } from "@/components/dish-recipe-dialog"
import { DishFormDialog } from "@/components/dish-form-dialog"
import { Loader2, Plus, Search, Edit, ImageIcon } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils/client-formatters"

interface Dish {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name?: string
  image_url?: string | null
}

interface Category {
  id: number
  name: string
  type: string
}

export default function RecipesPage() {
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all")
  const [isAddDishDialogOpen, setIsAddDishDialogOpen] = useState(false)
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [selectedDish, setSelectedDish] = useState<Dish | null>(null)

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)
      try {
        const [dishesData, categoriesData, ingredientsData] = await Promise.all([
          getAllDishes(),
          getCategories(),
          getAllIngredients(),
        ])

        setDishes(dishesData)
        setCategories(categoriesData.filter((cat) => cat.type === "menu_item"))
        setIngredients(ingredientsData)
      } catch (err) {
        console.error("Failed to fetch data:", err)
        setError("Failed to load data. Please try again.")
        toast({
          title: "Error",
          description: "Failed to load data. Please try again.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Filter dishes based on search term and category
  const filteredDishes = dishes.filter((dish) => {
    const matchesSearch = dish.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory =
      selectedCategoryFilter === "all" || dish.menu_category_id === Number.parseInt(selectedCategoryFilter)
    return matchesSearch && matchesCategory
  })

  // Handle opening the recipe dialog for a dish
  const handleOpenRecipeDialog = (dish: Dish) => {
    setSelectedDish(dish)
    setIsRecipeDialogOpen(true)
  }

  // Handle dish creation/update success
  const handleDishSaved = async () => {
    try {
      const updatedDishes = await getAllDishes()
      setDishes(updatedDishes)
      toast({
        title: "Success",
        description: "Dish saved successfully.",
      })
    } catch (err) {
      console.error("Failed to refresh dishes:", err)
      toast({
        title: "Error",
        description: "Failed to refresh dishes list.",
        variant: "destructive",
      })
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
        <Button onClick={() => window.location.reload()} className="mt-4">
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
          <h2 className="text-2xl font-bold text-gray-900">Recipe Management</h2>
          <p className="text-gray-600">Manage your dishes and their ingredients</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsAddDishDialogOpen(true)}
            className="bg-gradient-to-r from-orange-500 to-red-500 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Dish
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="md:w-48">
              <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dishes List */}
      <Card>
        <CardHeader>
          <CardTitle>Dishes ({filteredDishes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredDishes.length === 0 ? (
              <p className="text-center text-gray-500">No dishes found. Add your first dish to get started!</p>
            ) : (
              filteredDishes.map((dish) => (
                <div
                  key={dish.id}
                  className="border rounded-lg p-4 transition-all border-gray-200 bg-white hover:bg-gray-50"
                >
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
                          <h3 className="font-semibold text-gray-900">{dish.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {dish.category_name || "Uncategorized"}
                          </Badge>
                        </div>
                        <p className="text-sm mb-2 text-gray-600 line-clamp-2">{dish.description}</p>
                        <div className="text-sm font-medium text-green-600">{formatCurrency(dish.price)}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenRecipeDialog(dish)}
                        className="text-blue-600"
                      >
                        Ingredients
                      </Button>
                      <DishFormDialog
                        isOpen={false}
                        onOpenChange={() => {}}
                        dish={dish}
                        categories={categories}
                        onSaveSuccess={handleDishSaved}
                      >
                        <Button variant="outline" size="sm" className="text-blue-600">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </DishFormDialog>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Dish Dialog */}
      <DishFormDialog
        isOpen={isAddDishDialogOpen}
        onOpenChange={setIsAddDishDialogOpen}
        categories={categories}
        onSaveSuccess={handleDishSaved}
      />

      {/* Recipe Dialog */}
      {selectedDish && (
        <DishRecipeDialog
          isOpen={isRecipeDialogOpen}
          onOpenChange={setIsRecipeDialogOpen}
          dish={selectedDish}
          ingredients={ingredients}
        />
      )}
    </div>
  )
}
