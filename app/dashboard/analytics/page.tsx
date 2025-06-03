"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Eye,
  QrCode,
  Smartphone,
  Users,
  Clock,
  Calendar,
  Download,
} from "lucide-react"

export default function AnalyticsPage() {
  const stats = [
    {
      title: "Vistas Totales del Menú",
      value: "12,847",
      change: "+15.3%",
      trend: "up",
      icon: Eye,
      period: "vs mes anterior",
    },
    {
      title: "Escaneos de QR",
      value: "8,234",
      change: "+22.1%",
      trend: "up",
      icon: QrCode,
      period: "vs mes anterior",
    },
    {
      title: "Visitantes Únicos",
      value: "3,456",
      change: "+8.7%",
      trend: "up",
      icon: Users,
      period: "vs mes anterior",
    },
    {
      title: "Tiempo Promedio",
      value: "2m 34s",
      change: "-5.2%",
      trend: "down",
      icon: Clock,
      period: "vs mes anterior",
    },
  ]

  const topDishes = [
    { name: "Tacos al Pastor", views: 1234, orders: 89, conversion: "7.2%" },
    { name: "Enchiladas Verdes", views: 987, orders: 67, conversion: "6.8%" },
    { name: "Quesadilla de Flor", views: 856, orders: 45, conversion: "5.3%" },
    { name: "Pozole Rojo", views: 743, orders: 38, conversion: "5.1%" },
    { name: "Agua de Horchata", views: 654, orders: 78, conversion: "11.9%" },
  ]

  const hourlyData = [
    { hour: "09:00", views: 45 },
    { hour: "10:00", views: 67 },
    { hour: "11:00", views: 89 },
    { hour: "12:00", views: 156 },
    { hour: "13:00", views: 234 },
    { hour: "14:00", views: 198 },
    { hour: "15:00", views: 123 },
    { hour: "16:00", views: 89 },
    { hour: "17:00", views: 112 },
    { hour: "18:00", views: 167 },
    { hour: "19:00", views: 245 },
    { hour: "20:00", views: 289 },
    { hour: "21:00", views: 234 },
    { hour: "22:00", views: 156 },
  ]

  const deviceData = [
    { device: "Móvil", percentage: 78, count: 6234 },
    { device: "Desktop", percentage: 15, count: 1198 },
    { device: "Tablet", percentage: 7, count: 559 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analíticas</h2>
          <p className="text-gray-600">Monitorea el rendimiento de tu menú digital</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select defaultValue="30days">
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Últimos 7 días</SelectItem>
              <SelectItem value="30days">Últimos 30 días</SelectItem>
              <SelectItem value="90days">Últimos 90 días</SelectItem>
              <SelectItem value="1year">Último año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <div className="flex items-center mt-1">
                    {stat.trend === "up" ? (
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-500 mr-1" />
                    )}
                    <span className={`text-sm ${stat.trend === "up" ? "text-green-600" : "text-red-600"}`}>
                      {stat.change}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">{stat.period}</span>
                  </div>
                </div>
                <div className="p-3 rounded-full bg-gray-100">
                  <stat.icon className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hourly Views Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Vistas por Hora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hourlyData.map((data) => (
                <div key={data.hour} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 w-16">{data.hour}</span>
                  <div className="flex-1 mx-3">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                        style={{ width: `${(data.views / 300) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 w-12 text-right">{data.views}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top Dishes */}
        <Card>
          <CardHeader>
            <CardTitle>Platillos Más Vistos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topDishes.map((dish, index) => (
                <div key={dish.name} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-red-500 text-white flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{dish.name}</h4>
                      <p className="text-sm text-gray-600">
                        {dish.views} vistas • {dish.orders} órdenes
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    {dish.conversion}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Device Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Smartphone className="w-5 h-5 mr-2" />
              Dispositivos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deviceData.map((device) => (
                <div key={device.device}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">{device.device}</span>
                    <span className="text-sm text-gray-600">{device.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full"
                      style={{ width: `${device.percentage}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{device.count.toLocaleString()} visitantes</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Peak Hours */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Horas Pico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                <div>
                  <p className="font-medium text-orange-900">Almuerzo</p>
                  <p className="text-sm text-orange-700">12:00 - 14:00</p>
                </div>
                <Badge className="bg-orange-500 text-white">Pico</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-red-900">Cena</p>
                  <p className="text-sm text-red-700">19:00 - 21:00</p>
                </div>
                <Badge className="bg-red-500 text-white">Pico</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Mañana</p>
                  <p className="text-sm text-gray-700">09:00 - 11:00</p>
                </div>
                <Badge variant="outline">Moderado</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Pico de tráfico detectado</p>
                  <p className="text-xs text-gray-500">Hace 2 horas</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Nuevo récord de escaneos QR</p>
                  <p className="text-xs text-gray-500">Ayer</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Platillo trending: Tacos al Pastor</p>
                  <p className="text-xs text-gray-500">Hace 3 días</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-900">💡 Insights y Recomendaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 bg-white rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Optimización de Horarios</h4>
              <p className="text-sm text-blue-800">
                Tus horas pico son 12-14h y 19-21h. Considera promociones especiales durante las horas de menor tráfico.
              </p>
            </div>
            <div className="p-4 bg-white rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Platillos Populares</h4>
              <p className="text-sm text-blue-800">
                Los Tacos al Pastor tienen la mayor conversión. Considera destacarlos más en tu menú digital.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
