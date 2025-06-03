import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Utensils, ShoppingCart, DollarSign, BarChart2, LayoutDashboard, Settings } from "lucide-react"

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Bienvenido a MenuMagic</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Utensils className="mr-2 h-4 w-4" />
          Crear Nuevo Menú
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-lg border-none bg-gradient-to-br from-warm-500 to-warm-600 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vistas del Menú Digital</CardTitle>
            <Utensils className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2,847</div>
            <p className="text-xs opacity-90 mt-1">+12% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-neutral-700 to-neutral-800 text-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Órdenes Online</CardTitle>
            <ShoppingCart className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">156</div>
            <p className="text-xs opacity-90 mt-1">+8% desde el mes pasado</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-gradient-to-br from-soft-blue to-blue-400 text-blue-900">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Costo Promedio Receta</CardTitle>
            <DollarSign className="h-5 w-5 opacity-80" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$12.40</div>
            <p className="text-xs opacity-90 mt-1">Por porción</p>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Explora los Módulos</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/menu-studio/digital-menu">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Menu Studio
              </CardTitle>
              <Utensils className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Crea y gestiona tus menús digitales y físicos.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/order-hub/online-ordering">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Order Hub
              </CardTitle>
              <ShoppingCart className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Centraliza y gestiona todas tus órdenes.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/smart-accounting/cost-sales-tracker">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Smart Accounting
              </CardTitle>
              <DollarSign className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Optimiza costos y rastrea tu rentabilidad.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/growth-insights/performance">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Growth Insights
              </CardTitle>
              <BarChart2 className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Obtén análisis y recomendaciones inteligentes.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/operations-hub/recipes">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Operations Hub
              </CardTitle>
              <LayoutDashboard className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Gestiona recetas, ingredientes, proveedores e inventario.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings/profile">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Settings
              </CardTitle>
              <Settings className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Configura tu restaurante y cuenta.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Actividad Reciente</h2>
      <Tabs defaultValue="orders">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto">
          <TabsTrigger value="orders">Órdenes</TabsTrigger>
          <TabsTrigger value="menus">Menús</TabsTrigger>
          <TabsTrigger value="invoices">Facturas</TabsTrigger>
        </TabsList>
        <TabsContent value="orders" className="mt-4">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Orden #1234 - Mesa 5</span>
                  <span className="text-sm text-neutral-500">Hace 10 minutos</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Orden #1233 - Online</span>
                  <span className="text-sm text-neutral-500">Hace 30 minutos</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Orden #1232 - POS</span>
                  <span className="text-sm text-neutral-500">Hace 1 hora</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="menus" className="mt-4">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Menú Digital actualizado</span>
                  <span className="text-sm text-neutral-500">Ayer</span>
                </div>
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Nueva receta: Tacos al Pastor</span>
                  <span className="text-sm text-neutral-500">Hace 2 días</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="invoices" className="mt-4">
          <Card className="shadow-lg border-none">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between text-neutral-700">
                  <span className="font-medium">Factura #INV-2024-001 de Carnes Premium S.A.</span>
                  <span className="text-sm text-neutral-500">Hace 3 días</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
