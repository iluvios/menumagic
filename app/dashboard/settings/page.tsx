"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  User,
  Building,
  Bell,
  CreditCard,
  Users,
  Shield,
  Crown,
  Save,
  Upload,
  Trash2,
  Plug,
  SettingsIcon,
} from "lucide-react"
import Link from "next/link"

export default function SettingsPage() {
  const [restaurantInfo, setRestaurantInfo] = useState({
    name: "Mi Restaurante",
    description: "Auténtica comida mexicana en el corazón de la ciudad",
    address: "Calle Principal 123",
    city: "Ciudad de México",
    state: "CDMX",
    zipCode: "12345",
    phone: "+52 55 1234 5678",
    email: "contacto@mirestaurante.com",
    website: "www.mirestaurante.com",
  })

  const [notifications, setNotifications] = useState({
    newOrders: true,
    menuViews: false,
    weeklyReports: true,
    promotions: true,
    systemUpdates: false,
  })

  const [teamMembers] = useState([
    { id: 1, name: "Juan Pérez", email: "juan@mirestaurante.com", role: "Administrador", status: "Activo" },
    { id: 2, name: "María González", email: "maria@mirestaurante.com", role: "Editor", status: "Activo" },
    { id: 3, name: "Carlos López", email: "carlos@mirestaurante.com", role: "Visor", status: "Pendiente" },
  ])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Settings</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <SettingsIcon className="mr-2 h-4 w-4" />
          Guardar Configuración
        </Button>
      </div>

      <p className="text-neutral-600">
        Administra la configuración de tu restaurante, cuenta de usuario, integraciones y suscripción.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link href="/dashboard/settings/profile">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Restaurant Profile
              </CardTitle>
              <Building className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Configura la información básica de tu restaurante.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings/account">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                User Account
              </CardTitle>
              <User className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Gestiona tu perfil, contraseña y roles de equipo.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings/integrations">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Integrations
              </CardTitle>
              <Plug className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Conecta con pasarelas de pago y otras herramientas.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/settings/billing">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Subscription & Billing
              </CardTitle>
              <CreditCard className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Gestiona tu plan, límites de uso e historial de facturación.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Configuración Rápida</h2>
      <Card className="shadow-lg border-none">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Nombre del Restaurante: Mi Restaurante</span>
              <Button variant="outline" size="sm">
                Editar
              </Button>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Plan Actual: Gratuito</span>
              <Button variant="outline" size="sm">
                Actualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="restaurant" className="space-y-6 mt-8">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="restaurant" className="flex items-center space-x-2">
            <Building className="w-4 h-4" />
            <span>Restaurante</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notificaciones</span>
          </TabsTrigger>
          <TabsTrigger value="team" className="flex items-center space-x-2">
            <Users className="w-4 h-4" />
            <span>Equipo</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="w-4 h-4" />
            <span>Facturación</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Seguridad</span>
          </TabsTrigger>
        </TabsList>

        {/* Restaurant Settings */}
        <TabsContent value="restaurant">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Información del Restaurante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="restaurantName">Nombre del restaurante</Label>
                  <Input
                    id="restaurantName"
                    value={restaurantInfo.name}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, name: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    value={restaurantInfo.description}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="address">Dirección</Label>
                  <Input
                    id="address"
                    value={restaurantInfo.address}
                    onChange={(e) => setRestaurantInfo({ ...restaurantInfo, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city">Ciudad</Label>
                    <Input
                      id="city"
                      value={restaurantInfo.city}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">Estado</Label>
                    <Input
                      id="state"
                      value={restaurantInfo.state}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, state: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      value={restaurantInfo.phone}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={restaurantInfo.email}
                      onChange={(e) => setRestaurantInfo({ ...restaurantInfo, email: e.target.value })}
                    />
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo y Branding</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Logo del restaurante</Label>
                  <div className="mt-2 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-3 flex items-center justify-center">
                      <Building className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-3">Sube el logo de tu restaurante</p>
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Subir Logo
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Colores de marca</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="primaryColor" className="text-sm">
                        Color principal
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input type="color" value="#f97316" className="w-12 h-10 p-1" />
                        <Input value="#f97316" className="flex-1" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="secondaryColor" className="text-sm">
                        Color secundario
                      </Label>
                      <div className="flex items-center space-x-2 mt-1">
                        <Input type="color" value="#ea580c" className="w-12 h-10 p-1" />
                        <Input value="#ea580c" className="flex-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Horarios de operación</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Lunes - Viernes</span>
                      <span className="text-sm font-medium">9:00 AM - 10:00 PM</span>
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span className="text-sm">Sábado - Domingo</span>
                      <span className="text-sm font-medium">10:00 AM - 11:00 PM</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    Editar Horarios
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Preferencias de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Nuevas órdenes</h4>
                  <p className="text-sm text-gray-600">Recibe notificaciones cuando lleguen nuevas órdenes</p>
                </div>
                <Switch
                  checked={notifications.newOrders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, newOrders: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Vistas del menú</h4>
                  <p className="text-sm text-gray-600">Notificaciones sobre el rendimiento de tu menú</p>
                </div>
                <Switch
                  checked={notifications.menuViews}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, menuViews: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Reportes semanales</h4>
                  <p className="text-sm text-gray-600">Resumen semanal de estadísticas y rendimiento</p>
                </div>
                <Switch
                  checked={notifications.weeklyReports}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, weeklyReports: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Promociones y ofertas</h4>
                  <p className="text-sm text-gray-600">Información sobre nuevas características y ofertas</p>
                </div>
                <Switch
                  checked={notifications.promotions}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, promotions: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium text-gray-900">Actualizaciones del sistema</h4>
                  <p className="text-sm text-gray-600">Notificaciones sobre mantenimiento y actualizaciones</p>
                </div>
                <Switch
                  checked={notifications.systemUpdates}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, systemUpdates: checked })}
                />
              </div>

              <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Save className="w-4 h-4 mr-2" />
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Management */}
        <TabsContent value="team">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Gestión de Equipo</CardTitle>
              <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <Users className="w-4 h-4 mr-2" />
                Invitar Miembro
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{member.name}</h4>
                        <p className="text-sm text-gray-600">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant={member.status === "Activo" ? "default" : "secondary"}>{member.status}</Badge>
                      <Badge variant="outline">{member.role}</Badge>
                      <Button variant="outline" size="sm">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing */}
        <TabsContent value="billing">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                  Plan Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Plan Gratuito</h3>
                    <p className="text-gray-600">Acceso a características básicas</p>
                  </div>
                  <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Actualizar a Pro</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Historial de Facturación</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No hay facturas disponibles</p>
                  <p className="text-sm text-gray-500">
                    Las facturas aparecerán aquí cuando actualices a un plan de pago
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Cambiar Contraseña</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="currentPassword">Contraseña actual</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div>
                  <Label htmlFor="newPassword">Nueva contraseña</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                  Actualizar Contraseña
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Autenticación de Dos Factores</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Autenticación 2FA</h4>
                    <p className="text-sm text-gray-600">Agrega una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <Button variant="outline">Configurar 2FA</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-900">Zona de Peligro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-red-900">Eliminar cuenta</h4>
                    <p className="text-sm text-red-700">
                      Esta acción eliminará permanentemente tu cuenta y todos los datos asociados
                    </p>
                  </div>
                  <Button variant="destructive">Eliminar Cuenta</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
