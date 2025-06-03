import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ReceiptText, LineChart, Upload } from "lucide-react"

export default function SmartAccountingPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Smart Accounting</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Upload className="mr-2 h-4 w-4" />
          Subir Factura
        </Button>
      </div>

      <p className="text-neutral-600">
        Simplifica el seguimiento financiero, reduce la entrada manual de datos y obtén información sobre costos y
        rentabilidad.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/smart-accounting/invoice-inbox">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Invoice Inbox & Digitizer
              </CardTitle>
              <ReceiptText className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Digitaliza facturas de proveedores para automatizar el seguimiento de gastos.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/smart-accounting/cost-sales-tracker">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Cost & Sales Tracker
              </CardTitle>
              <LineChart className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Obtén una visión general de los costos de alimentos, ventas y rentabilidad básica.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Resumen Financiero Rápido</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-lg border-none bg-soft-green text-green-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ventas Totales (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$1,250.00</div>
            <p className="text-xs opacity-90 mt-1">+5% vs. ayer</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-soft-red text-red-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Costo de Ventas (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$350.00</div>
            <p className="text-xs opacity-90 mt-1">+2% vs. ayer</p>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-none bg-soft-blue text-blue-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Ganancia Bruta (Hoy)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$900.00</div>
            <p className="text-xs opacity-90 mt-1">+7% vs. ayer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
