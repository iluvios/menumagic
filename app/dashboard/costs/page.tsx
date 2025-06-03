export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Filter, ArrowUpDown, MoreHorizontal } from "lucide-react"
import { getRecipeCosts } from "@/lib/actions/cost-actions"

export default async function CostsPage() {
  const costs = await getRecipeCosts()

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Costos</h1>
          <p className="text-sm text-gray-500">Gestiona los costos de tus recetas e ingredientes</p>
        </div>
        <Button>Nueva Receta</Button>
      </div>

      <Tabs defaultValue="recipes">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          <TabsTrigger value="recipes">Recetas</TabsTrigger>
          <TabsTrigger value="subrecipes">Subrecetas</TabsTrigger>
          <TabsTrigger value="ingredients">Ingredientes</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>

          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar" className="pl-10 w-full" />
          </div>
        </div>

        <TabsContent value="recipes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs uppercase bg-gray-50">
                    <tr>
                      <th className="px-4 py-3">SKU</th>
                      <th className="px-4 py-3">Receta</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Ingredientes</th>
                      <th className="px-4 py-3">Cantidad</th>
                      <th className="px-4 py-3">Costo/Unidad</th>
                      <th className="px-4 py-3">Costo Total</th>
                      <th className="px-4 py-3">Margen Seguro</th>
                      <th className="px-4 py-3">Precio Venta</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {costs.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="px-4 py-6 text-center text-gray-500">
                          No hay datos disponibles
                        </td>
                      </tr>
                    ) : (
                      costs.map((cost, index) => (
                        <tr
                          key={index}
                          className={`${index === 1 ? "bg-blue-50" : "bg-white"} border-b hover:bg-gray-50`}
                        >
                          <td className="px-4 py-3">{cost.sku}</td>
                          <td className="px-4 py-3 font-medium">{cost.name}</td>
                          <td className="px-4 py-3">{cost.category}</td>
                          <td className="px-4 py-3">{cost.ingredients_count}</td>
                          <td className="px-4 py-3">
                            {cost.quantity} {cost.unit}
                          </td>
                          <td className="px-4 py-3">${cost.cost_per_unit}/ml</td>
                          <td className="px-4 py-3">${cost.total_cost}</td>
                          <td className="px-4 py-3">{cost.margin_percentage}%</td>
                          <td className="px-4 py-3">${cost.selling_price}</td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {costs.length > 0 && (
                <div className="p-4 border-t">
                  <div className="text-sm text-gray-500">
                    Mostrando {costs.length} de {costs.length} resultados
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="mt-6">
            <h3 className="font-medium mb-4">Subrecetas</h3>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Subreceta</th>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Ingredientes</th>
                        <th className="px-4 py-3">Cantidad</th>
                        <th className="px-4 py-3">Rendimiento</th>
                        <th className="px-4 py-3">Costo / U. Medida</th>
                        <th className="px-4 py-3">Costo Total</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3].map((i) => (
                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-3">ABC{i}00</td>
                          <td className="px-4 py-3 font-medium">Nombre</td>
                          <td className="px-4 py-3">Categoría</td>
                          <td className="px-4 py-3">00</td>
                          <td className="px-4 py-3">0000 ml</td>
                          <td className="px-4 py-3">%000.000</td>
                          <td className="px-4 py-3">$000.000/ml</td>
                          <td className="px-4 py-3">$000.000</td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="mt-6">
            <h3 className="font-medium mb-4">Ingredientes</h3>

            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs uppercase bg-gray-50">
                      <tr>
                        <th className="px-4 py-3">SKU</th>
                        <th className="px-4 py-3">Ingrediente</th>
                        <th className="px-4 py-3">Categoría</th>
                        <th className="px-4 py-3">Referencia</th>
                        <th className="px-4 py-3">Cantidad</th>
                        <th className="px-4 py-3">Costo / U. Medida</th>
                        <th className="px-4 py-3">%Costo</th>
                        <th className="px-4 py-3">Costo Total</th>
                        <th className="px-4 py-3">Proveedor</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <tr key={i} className="bg-white border-b hover:bg-gray-50">
                          <td className="px-4 py-3">ABC{i}00</td>
                          <td className="px-4 py-3 font-medium">Nombre</td>
                          <td className="px-4 py-3">Categoría</td>
                          <td className="px-4 py-3">ABC{i}00</td>
                          <td className="px-4 py-3">0000 ml</td>
                          <td className="px-4 py-3">$000.000/ml</td>
                          <td className="px-4 py-3">000.00%</td>
                          <td className="px-4 py-3">$000.000</td>
                          <td className="px-4 py-3">Proveedor</td>
                          <td className="px-4 py-3">
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
