"use client"

import { DialogDescription } from "@/components/ui/dialog"

import { cn } from "@/lib/utils"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { getCostAnalysis, updateIngredientCost } from "@/lib/actions/cost-actions"
import { formatCurrency, formatPercentage } from "@/lib/db"
import { Edit, DollarSign } from "lucide-react"

interface RecipeCost {
  id: number
  name: string
  sku: string
  category: string
  cost: number
  selling_price: number
  margin_percentage: number
  profit: number
  ingredients_count: number
}

interface IngredientCost {
  id: number
  name: string
  sku: string
  category: string
  cost_per_unit: number
  unit: string
  supplier_name: string
  used_in_recipes: number
}

interface CostSummary {
  total_recipes: number
  total_ingredients: number
  avg_recipe_cost: number
  avg_margin: number
  total_recipe_costs: number
}

export default function CostSalesTrackerPage() {
  const { toast } = useToast()
  const [recipeCosts, setRecipeCosts] = useState<RecipeCost[]>([])
  const [ingredientCosts, setIngredientCosts] = useState<IngredientCost[]>([])
  const [summary, setSummary] = useState<CostSummary | null>(null)
  const [isIngredientDialogOpen, setIsIngredientDialogOpen] = useState(false)
  const [currentIngredient, setCurrentIngredient] = useState<IngredientCost | null>(null)
  const [newCostPerUnit, setNewCostPerUnit] = useState<number>(0)

  useEffect(() => {
    fetchCostData()
  }, [])

  const fetchCostData = async () => {
    const data = await getCostAnalysis()
    setRecipeCosts(data.recipes)
    setIngredientCosts(data.ingredients)
    setSummary(data.summary)
  }

  const handleOpenIngredientDialog = (ingredient: IngredientCost) => {
    setCurrentIngredient(ingredient)
    setNewCostPerUnit(ingredient.cost_per_unit)
    setIsIngredientDialogOpen(true)
  }

  const handleUpdateIngredientCost = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentIngredient) return

    const result = await updateIngredientCost(currentIngredient.id, newCostPerUnit)
    if (result.success) {
      toast({ title: "Costo de Ingrediente Actualizado", description: "El costo del ingrediente ha sido guardado." })
      fetchCostData()
      setIsIngredientDialogOpen(false)
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Cost & Sales Tracker</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <DollarSign className="mr-2 h-4 w-4" />
          Nuevo Costeo de Receta
        </Button>
      </div>

      <p className="text-neutral-600">
        Obtén una visión general de los costos de alimentos, ventas y rentabilidad básica de tu restaurante.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Total Recetas Costeadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{summary?.total_recipes || 0}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Costo Promedio Receta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatCurrency(summary?.avg_recipe_cost || 0)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Margen Promedio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">{formatPercentage(summary?.avg_margin || 0)}</div>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Costo Total de Ingredientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">
              {formatCurrency(summary?.total_recipe_costs || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="recipes">
        <TabsList className="grid w-full grid-cols-2 lg:w-auto">
          <TabsTrigger value="recipes">Costos de Recetas</TabsTrigger>
          <TabsTrigger value="ingredients">Costos de Ingredientes</TabsTrigger>
        </TabsList>

        <TabsContent value="recipes" className="mt-4">
          <Card className="shadow-lg border-neutral-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-neutral-800">Análisis de Costos por Receta</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Costo</TableHead>
                    <TableHead>Precio Venta</TableHead>
                    <TableHead>Margen</TableHead>
                    <TableHead>Ganancia</TableHead>
                    <TableHead>Ingredientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recipeCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-neutral-500">
                        No hay datos de costos de recetas disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    recipeCosts.map((recipe) => (
                      <TableRow key={recipe.id}>
                        <TableCell className="font-medium">{recipe.name}</TableCell>
                        <TableCell>{recipe.category}</TableCell>
                        <TableCell>{formatCurrency(recipe.cost)}</TableCell>
                        <TableCell>{formatCurrency(recipe.selling_price)}</TableCell>
                        <TableCell
                          className={cn(
                            "font-medium",
                            recipe.margin_percentage >= 50 ? "text-green-600" : "text-warm-600",
                          )}
                        >
                          {formatPercentage(recipe.margin_percentage)}
                        </TableCell>
                        <TableCell>{formatCurrency(recipe.profit)}</TableCell>
                        <TableCell>{recipe.ingredients_count}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ingredients" className="mt-4">
          <Card className="shadow-lg border-neutral-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-neutral-800">Costos de Ingredientes</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Costo/Unidad</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Usado en Recetas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientCosts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center text-neutral-500">
                        No hay datos de costos de ingredientes disponibles.
                      </TableCell>
                    </TableRow>
                  ) : (
                    ingredientCosts.map((ingredient) => (
                      <TableRow key={ingredient.id}>
                        <TableCell className="font-medium">{ingredient.name}</TableCell>
                        <TableCell>{ingredient.sku}</TableCell>
                        <TableCell>{ingredient.category}</TableCell>
                        <TableCell>{formatCurrency(ingredient.cost_per_unit)}</TableCell>
                        <TableCell>{ingredient.unit}</TableCell>
                        <TableCell>{ingredient.supplier_name || "N/A"}</TableCell>
                        <TableCell>{ingredient.used_in_recipes}</TableCell>
                        <TableCell className="text-right">
                          <Dialog
                            open={isIngredientDialogOpen && currentIngredient?.id === ingredient.id}
                            onOpenChange={setIsIngredientDialogOpen}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenIngredientDialog(ingredient)}
                              >
                                <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
                              <DialogHeader>
                                <DialogTitle>Editar Costo de Ingrediente</DialogTitle>
                                <DialogDescription>
                                  Actualiza el costo por unidad de {currentIngredient?.name}.
                                </DialogDescription>
                              </DialogHeader>
                              <form onSubmit={handleUpdateIngredientCost} className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                  <Label htmlFor="newCost" className="text-right">
                                    Nuevo Costo
                                  </Label>
                                  <Input
                                    id="newCost"
                                    type="number"
                                    step="0.01"
                                    value={newCostPerUnit}
                                    onChange={(e) => setNewCostPerUnit(Number.parseFloat(e.target.value))}
                                    className="col-span-3"
                                    required
                                  />
                                </div>
                                <DialogFooter>
                                  <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                                    Guardar Cambios
                                  </Button>
                                </DialogFooter>
                              </form>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
