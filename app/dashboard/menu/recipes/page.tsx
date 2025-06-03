export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, MoreHorizontal } from "lucide-react"
import Image from "next/image"
import { getRecipes } from "@/lib/actions/recipe-actions"

export default async function RecipesPage() {
  const recipes = await getRecipes()

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Recetas</h1>
          <p className="text-sm text-gray-500">Gestiona tus recetas y subrecetas</p>
        </div>
        <Button>Crear Receta</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="recipes">Recetas</TabsTrigger>
          <TabsTrigger value="subrecipes">Subrecetas</TabsTrigger>
          <TabsTrigger value="specials">Especiales</TabsTrigger>
        </TabsList>

        <div className="mt-4">
          <Tabs defaultValue="todos" className="w-full">
            <TabsList>
              <TabsTrigger value="todos">Todos</TabsTrigger>
              <TabsTrigger value="entradas">Entradas</TabsTrigger>
              <TabsTrigger value="platos">Platos fuertes</TabsTrigger>
              <TabsTrigger value="postres">Postres</TabsTrigger>
            </TabsList>

            <div className="mt-4 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input placeholder="Buscar" className="pl-10 w-full" />
            </div>

            <TabsContent value="todos" className="mt-4 space-y-4">
              {recipes.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center">
                    <p className="text-gray-500">No hay recetas disponibles</p>
                    <Button className="mt-4">Crear primera receta</Button>
                  </CardContent>
                </Card>
              ) : (
                recipes.map((recipe, index) => (
                  <Card key={index} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex justify-between items-start p-4">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <h3 className="font-semibold text-lg">{recipe.name}</h3>
                            <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded ml-2">
                              {recipe.category}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-2">
                            <div>
                              <div className="text-xs text-gray-500">SKU</div>
                              <div className="text-sm">{recipe.sku}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Creación</div>
                              <div className="text-sm">{recipe.created_at}</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500">Ingredientes</div>
                              <div className="text-sm">{recipe.ingredients_count}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">% Costo</div>
                              <div className="text-sm">{recipe.cost_percentage}%</div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div>
                              <div className="text-xs text-gray-500">% Venta</div>
                              <div className="text-sm">${recipe.selling_price}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500">Precio Venta</div>
                              <div className="text-sm">${recipe.selling_price}</div>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end ml-4">
                          <div className="flex -space-x-2 mb-2">
                            {[1, 2, 3].map((i) => (
                              <div
                                key={i}
                                className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs"
                              >
                                {i}
                              </div>
                            ))}
                          </div>

                          <div className="px-3 py-1 rounded-full bg-green-500 text-white text-xs mb-2">Estado</div>

                          <div className="relative">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <div className="ml-4">
                          <div className="w-32 h-32 bg-gray-200 rounded-lg overflow-hidden">
                            <Image
                              src={recipe.image_url || "/placeholder.svg?height=128&width=128&query=food"}
                              alt={recipe.name}
                              width={128}
                              height={128}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>
          </Tabs>
        </div>
      </Tabs>
    </div>
  )
}
