import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ChefHat, Leaf, Truck, Warehouse, Plus } from "lucide-react"

export default function OperationsHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Operations Hub</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Plus className="mr-2 h-4 w-4" />
          Añadir Receta
        </Button>
      </div>

      <p className="text-neutral-600">
        Centraliza la gestión de datos fundamentales para recetas, ingredientes, proveedores e inventario, que impulsan
        tus herramientas principales.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/operations-hub/recipes">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Recipe Management
              </CardTitle>
              <ChefHat className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Define recetas para un costeo preciso y consistencia.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/operations-hub/ingredients">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Ingredient Management
              </CardTitle>
              <Leaf className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Gestiona todas tus materias primas, sus costos y proveedores.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/operations-hub/suppliers">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Supplier Directory
              </CardTitle>
              <Truck className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Mantén un registro de la información de tus proveedores.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/operations-hub/inventory">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Inventory Control
              </CardTitle>
              <Warehouse className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Rastrea los niveles de stock de tus ingredientes.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Recetas Recientes</h2>
      <Card className="shadow-lg border-none">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Hamburguesa Clásica</span>
              <span className="text-sm text-neutral-500">Costo: $12.50</span>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Ensalada de Quinoa</span>
              <span className="text-sm text-neutral-500">Costo: $8.20</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
