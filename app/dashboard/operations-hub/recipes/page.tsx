"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { getAllGlobalCategories, deleteDish } from "@/lib/actions/menu-studio-actions"
import { getReusableMenuItemsForRecipesPage } from "@/lib/actions/recipe-actions"
import { PlusCircle, Edit, Trash2, Loader2, Settings, Search, ChefHat } from "lucide-react"
import { formatCurrency } from "@/lib/utils/client-formatters"
import { MenuItemFormDialog } from "@/components/menu-item-form-dialog"
import { CategoryFormDialog } from "@/components/category-form-dialog"
import { DishRecipeDialog } from "@/components/dish-recipe-dialog"

interface Dish {
  id: number
  name: string
  description: string
  price: number
  menu_category_id: number
  category_name?: string
  image_url?: string | null
  is_available: boolean
  cost_per_serving?: number
}

interface Category {
  id: number
  name: string
  type: string
  order_index: number
}

export default function RecipesPage() {
  const { toast } = useToast()
  const [dishes, setDishes] = useState<Dish[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isCreateDishDialogOpen, setIsCreateDishDialogOpen] = useState(false)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isRecipeDialogOpen, setIsRecipeDialogOpen] = useState(false)
  const [editingDish, setEditingDish] = useState<Dish | null>(null)
  const [selectedDishForRecipe, setSelectedDishForRecipe] = useState<Dish | null>(null)
  const [deletingDishId, setDeletingDishId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dishesData, categoriesData] = await Promise.all([
        getReusableMenuItemsForRecipesPage(),
        getAllGlobalCategories(),
      ])
      setDishes(dishesData)
      setCategories(categoriesData)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Filter dishes based on search term
  const filteredDishes = useMemo(() => {
    if (!searchTerm) return dishes

    return dishes.filter(
      (dish) =>
        dish.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dish.category_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
  }, [dishes, searchTerm])

  const handleEditDish = (dish: Dish) => {
    setEditingDish(dish)
    setIsCreateDishDialogOpen(true)
  }

  const handleManageRecipe = (dish: Dish) => {
    setSelectedDishForRecipe(dish)
    setIsRecipeDialogOpen(true)
  }

  const handleDeleteDish = async (dishId: number, dishName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${dishName}"? This will remove it from all menus.`)) return

    setDeletingDishId(dishId)

    try {
      await deleteDish(dishId)
      toast({
        title: "Success",
        description: "Dish deleted successfully.",
      })
      fetchData() // Refresh the list
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete dish.",
        variant: "destructive",
      })
    } finally {
      setDeletingDishId(null)
    }
  }

  const handleDishSaved = () => {
    setIsCreateDishDialogOpen(false)
    setEditingDish(null)
    fetchData() // Refresh the list
  }

  const handleCategorySaved = () => {
    setIsCategoryDialogOpen(false)
    fetchData() // Refresh categories and dishes
  }

  const handleRecipeSaved = () => {
    setIsRecipeDialogOpen(false)
    setSelectedDishForRecipe(null)
    fetchData() // Refresh the list
  }

  if (loading) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <h1 className="text-2xl font-bold">Global Recipes & Dishes</h1>
        </div>
        <div className="flex-1 p-4">
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div>
          <h1 className="text-2xl font-bold">Global Recipes & Dishes</h1>
          <p className="text-gray-600">Manage your base dishes and recipes that can be used across all menus.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsCategoryDialogOpen(true)}>
            <Settings className="mr-2 h-4 w-4" /> Manage Categories
          </Button>
          <Button
            onClick={() => {
              setEditingDish(null)
              setIsCreateDishDialogOpen(true)
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
          </Button>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Dishes ({filteredDishes.length})</CardTitle>
                <CardDescription>
                  These dishes can be added to any digital menu. Changes here will reflect across all menus.
                </CardDescription>
              </div>
              <div className="relative w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search dishes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredDishes.length === 0 ? (
              <div className="text-center py-8">
                {searchTerm ? (
                  <p className="text-gray-500 mb-4">No dishes found matching "{searchTerm}".</p>
                ) : (
                  <p className="text-gray-500 mb-4">No dishes found. Create your first dish to get started.</p>
                )}
                {!searchTerm && (
                  <Button
                    onClick={() => {
                      setEditingDish(null)
                      setIsCreateDishDialogOpen(true)
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Add New Dish
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredDishes.map((dish) => (
                  <div
                    key={dish.id}
                    className="flex items-center justify-between rounded-md border p-4 shadow-sm bg-white"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      {dish.image_url && (
                        <img
                          src={dish.image_url || "/placeholder.svg"}
                          alt={dish.name}
                          className="h-16 w-16 rounded-md object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{dish.name}</h3>
                          {dish.category_name && (
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                              {dish.category_name}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{dish.description}</p>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-sm font-medium text-green-600">{formatCurrency(dish.price)}</p>
                          <p className={`text-sm font-medium ${dish.is_available ? "text-green-600" : "text-red-600"}`}>
                            {dish.is_available ? "Available" : "Not Available"}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleManageRecipe(dish)}
                        aria-label={`Manage recipe for ${dish.name}`}
                        title="Manage Recipe"
                      >
                        <ChefHat className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditDish(dish)}
                        aria-label={`Edit ${dish.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteDish(dish.id, dish.name)}
                        disabled={deletingDishId === dish.id}
                        aria-label={`Delete ${dish.name}`}
                      >
                        {deletingDishId === dish.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dish Form Dialog */}
      <MenuItemFormDialog
        isOpen={isCreateDishDialogOpen}
        onOpenChange={setIsCreateDishDialogOpen}
        digitalMenuId={0} // Not needed for global dishes
        menuItem={editingDish}
        onSave={handleDishSaved}
        categories={categories}
        dishes={dishes}
      />

      {/* Category Management Dialog */}
      {isCategoryDialogOpen && (
        <CategoryFormDialog
          isOpen={isCategoryDialogOpen}
          onOpenChange={setIsCategoryDialogOpen}
          digitalMenuId={0} // Not needed for global category management
          globalCategories={categories}
          digitalMenuCategories={[]} // Not needed for global category management
          onSaveSuccess={handleCategorySaved}
        />
      )}

      {/* Recipe Management Dialog */}
      {isRecipeDialogOpen && selectedDishForRecipe && (
        <DishRecipeDialog
          isOpen={isRecipeDialogOpen}
          onOpenChange={setIsRecipeDialogOpen}
          reusableMenuItemId={selectedDishForRecipe.id}
          reusableMenuItemName={selectedDishForRecipe.name}
          onSaveSuccess={handleRecipeSaved}
        />
      )}
    </div>
  )
}
