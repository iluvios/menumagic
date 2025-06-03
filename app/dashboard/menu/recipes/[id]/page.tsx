import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Edit, Trash } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { getRecipeById } from "@/lib/actions/recipe-actions"

export default async function RecipeDetailPage({ params }: { params: { id: string } }) {
  const recipe = await getRecipeById(Number.parseInt(params.id))

  if (!recipe) {
    return (
      <div className="p-6">
        <div className="mb-4">
          <Link href="/dashboard/menu/recipes" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Listado de Entradas
          </Link>
        </div>

        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Receta no encontrada</p>
            <Button className="mt-4">Volver a recetas</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="mb-4">
        <Link href="/dashboard/menu/recipes" className="flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Listado de Entradas
        </Link>
      </div>

      <div className="flex justify-between items-start">
        <div className="flex items-center">
          <h1 className="text-2xl font-bold">{recipe.name}</h1>
          <span className="ml-2 text-gray-500">/</span>
          <span className="ml-2 text-gray-500">{recipe.category}</span>

          <div className="flex -space-x-2 ml-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs"
              >
                {i}
              </div>
            ))}
          </div>

          <Badge className="ml-4 bg-green-500">Estado</Badge>
          <span className="ml-4 text-gray-500">{recipe.created_at}</span>
        </div>

        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" className="text-red-500">
            <Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">SKU</div>
                  <div>{recipe.sku}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Ingredientes</div>
                  <div>{recipe.ingredients_count || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Costo * Unidad</div>
                  <div className="font-medium">${recipe.cost_per_unit || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Costo Total</div>
                  <div className="font-medium">${recipe.total_cost || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Margen Imprevistos</div>
                  <div className="font-medium">${recipe.margin || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Precio Sugerido</div>
                  <div className="font-medium">${recipe.suggested_price || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Precio Venta</div>
                  <div className="font-medium">${recipe.selling_price || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Rendimiento</div>
                  <div className="font-medium">{recipe.yield || 0}%</div>
                </div>

                <div className="col-span-2">
                  <div className="text-sm text-gray-500 mb-1">Alergias</div>
                  <div className="flex flex-wrap gap-2">
                    {recipe.allergens?.map((allergen, index) => (
                      <Badge key={index} variant="outline">
                        {allergen}
                      </Badge>
                    )) || "No hay alergias registradas"}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="ingredients" className="mt-6">
            <TabsList>
              <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
              <TabsTrigger value="subrecipes">Subrecetas</TabsTrigger>
              <TabsTrigger value="steps">Paso a paso</TabsTrigger>
              <TabsTrigger value="profitability">Rentabilidad</TabsTrigger>
            </TabsList>

            <TabsContent value="ingredients" className="mt-4 space-y-4">
              {recipe.ingredients?.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No hay ingredientes registrados</p>
                    <Button className="mt-4">Agregar ingredientes</Button>
                  </CardContent>
                </Card>
              ) : (
                recipe.ingredients?.map((ingredient, index) => (
                  <Card key={index}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{ingredient.name}</h3>
                          <div className="text-sm text-gray-500">Categoría: {ingredient.category}</div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div>
                            <div className="text-xs text-gray-500">SKU</div>
                            <div className="text-sm">{ingredient.sku}</div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Ingredientes</div>
                            <div className="text-sm">
                              {ingredient.quantity} {ingredient.unit}
                            </div>
                          </div>

                          <div>
                            <div className="text-xs text-gray-500">Costo</div>
                            <div className="text-sm">${ingredient.cost}</div>
                          </div>
                        </div>

                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div
                              key={i}
                              className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs"
                            >
                              {i}
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardContent className="p-0">
              <div className="aspect-square relative">
                <Image
                  src={recipe.image_url || "/placeholder.svg?height=400&width=400&query=food dish"}
                  alt={recipe.name}
                  fill
                  className="object-cover"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
