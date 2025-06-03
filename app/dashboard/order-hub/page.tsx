import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ShoppingCart, Store, Tablet, Calculator, Clock } from "lucide-react"

export default function OrderHubPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Order Hub</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Nueva Orden POS
        </Button>
      </div>

      <p className="text-neutral-600">
        Centraliza y gestiona todas tus órdenes de diferentes canales, mejorando la eficiencia y la experiencia del
        cliente.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/order-hub/online-ordering">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Online Ordering Portal
              </CardTitle>
              <Store className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Acepta órdenes directamente desde tu sitio web o un enlace dedicado.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/order-hub/table-ordering">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Table Ordering System
              </CardTitle>
              <Tablet className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Permite a los clientes ordenar y pagar desde sus mesas usando QR/NFC.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/order-hub/pos-lite">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                POS Lite
              </CardTitle>
              <Calculator className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Un sistema básico para que el personal tome órdenes y procese pagos.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Órdenes Recientes</h2>
      <Card className="shadow-lg border-none">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-neutral-700">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">Orden Online #1235 - $45.00</span>
              </div>
              <span className="text-sm text-neutral-500">Hace 5 minutos</span>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <div className="flex items-center space-x-2">
                <Tablet className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">Orden de Mesa #101 - Mesa 7 - $78.50</span>
              </div>
              <span className="text-sm text-neutral-500">Hace 20 minutos</span>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <div className="flex items-center space-x-2">
                <Calculator className="h-4 w-4 text-neutral-500" />
                <span className="font-medium">Orden POS #5678 - $120.00</span>
              </div>
              <span className="text-sm text-neutral-500">Hace 1 hora</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
