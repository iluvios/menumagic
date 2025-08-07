import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BarChart2, Lightbulb, TrendingUp } from 'lucide-react'
import React from 'react';

export default function GrowthInsightsPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Growth Insights Dashboard</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <BarChart2 className="mr-2 h-4 w-4" />
          Ver Reporte Completo
        </Button>
      </div>

      <p className="text-neutral-600">
        This is where growth insights data will be displayed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/dashboard/growth-insights/performance">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Performance Dashboard
              </CardTitle>
              <BarChart2 className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Visualiza tus KPIs clave y el rendimiento general del restaurante.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/growth-insights/ai-recommendations">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                AI-Powered Recommendations
              </CardTitle>
              <Lightbulb className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Recibe sugerencias proactivas basadas en los datos de tu plataforma.
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Resumen de Rendimiento</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Ventas Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">$15,230</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" /> +8% (últimos 30 días)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Valor Promedio Orden</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">$35.50</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" /> +2% (últimos 30 días)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Órdenes Totales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">430</div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-4 w-4 mr-1" /> +5% (últimos 30 días)
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-lg border-neutral-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600">Platillo Más Popular</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-neutral-900">Tacos al Pastor</div>
            <p className="text-xs text-neutral-500 mt-1">120 unidades vendidas</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
