"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Save, Clock, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getRestaurantProfile, updateRestaurantProfile } from "@/lib/actions/restaurant-actions"

interface RestaurantProfileData {
  id: number
  name: string
  address_json: any // JSONB type
  phone: string
  email: string
  cuisine_type: string
  operating_hours_json: any // JSONB type
  currency_code: string
  timezone: string
  default_tax_rate_percentage: number
}

export default function RestaurantProfilePage() {
  const { toast } = useToast()
  const [profile, setProfile] = useState<RestaurantProfileData | null>(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    const data = await getRestaurantProfile()
    setProfile(data)
  }

  const handleUpdateProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!profile) return

    const formData = new FormData(event.currentTarget)
    const dataToUpdate: Partial<RestaurantProfileData> = {
      name: formData.get("name") as string,
      address_json: {
        street: formData.get("address_street"),
        city: formData.get("address_city"),
        state: formData.get("address_state"),
        zip: formData.get("address_zip"),
      },
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
      cuisine_type: formData.get("cuisine_type") as string,
      // operating_hours_json: {}, // Simplified for MVP, can be expanded
      currency_code: formData.get("currency_code") as string,
      timezone: formData.get("timezone") as string,
      default_tax_rate_percentage: Number.parseFloat(formData.get("default_tax_rate_percentage") as string),
    }

    const result = await updateRestaurantProfile(profile.id, dataToUpdate)
    if (result.success) {
      toast({ title: "Perfil Actualizado", description: "La información de tu restaurante ha sido guardada." })
      fetchProfile()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  if (!profile) {
    return (
      <div className="flex justify-center items-center h-64 text-neutral-500">Cargando perfil del restaurante...</div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Restaurant Profile</h1>
        <Button type="submit" form="profile-form" className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <p className="text-neutral-600">
        Configura la información básica de tu restaurante, horarios de operación y ajustes financieros.
      </p>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-800">Información General</CardTitle>
        </CardHeader>
        <CardContent>
          <form id="profile-form" onSubmit={handleUpdateProfile} className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del Restaurante</Label>
                <Input id="name" name="name" defaultValue={profile.name} required />
              </div>
              <div>
                <Label htmlFor="cuisine_type">Tipo de Cocina</Label>
                <Input
                  id="cuisine_type"
                  name="cuisine_type"
                  defaultValue={profile.cuisine_type}
                  placeholder="Ej: Mexicana, Italiana, Fusión"
                />
              </div>
              <div>
                <Label htmlFor="email">Email de Contacto</Label>
                <Input id="email" name="email" type="email" defaultValue={profile.email} required />
              </div>
              <div>
                <Label htmlFor="phone">Teléfono de Contacto</Label>
                <Input id="phone" name="phone" defaultValue={profile.phone} placeholder="Ej: +52 55 1234 5678" />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="address_street">Dirección</Label>
                <Input
                  id="address_street"
                  name="address_street"
                  defaultValue={profile.address_json?.street || ""}
                  placeholder="Calle y número"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="address_city">Ciudad</Label>
                  <Input id="address_city" name="address_city" defaultValue={profile.address_json?.city || ""} />
                </div>
                <div>
                  <Label htmlFor="address_state">Estado</Label>
                  <Input id="address_state" name="address_state" defaultValue={profile.address_json?.state || ""} />
                </div>
              </div>
              <div>
                <Label htmlFor="address_zip">Código Postal</Label>
                <Input id="address_zip" name="address_zip" defaultValue={profile.address_json?.zip || ""} />
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <Clock className="mr-2 h-5 w-5 text-neutral-500" /> Horarios de Operación
              </h3>
              <p className="text-sm text-neutral-600">Configura los horarios en los que tu restaurante está abierto.</p>
              {/* Simplified for MVP, in a real app this would be a more complex component */}
              <Textarea
                id="operating_hours"
                name="operating_hours_json"
                defaultValue={JSON.stringify(profile.operating_hours_json || {})}
                placeholder="Ej: Lunes-Viernes: 9 AM - 10 PM"
                rows={3}
              />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-lg font-semibold text-neutral-800 flex items-center">
                <DollarSign className="mr-2 h-5 w-5 text-neutral-500" /> Ajustes Financieros
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="currency_code">Moneda</Label>
                  <Select name="currency_code" defaultValue={profile.currency_code}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona moneda" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - Dólar Americano</SelectItem>
                      <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="timezone">Zona Horaria</Label>
                  <Input
                    id="timezone"
                    name="timezone"
                    defaultValue={profile.timezone}
                    placeholder="Ej: America/Mexico_City"
                  />
                </div>
                <div>
                  <Label htmlFor="default_tax_rate_percentage">Tasa de Impuesto (%)</Label>
                  <Input
                    id="default_tax_rate_percentage"
                    name="default_tax_rate_percentage"
                    type="number"
                    step="0.01"
                    defaultValue={profile.default_tax_rate_percentage}
                  />
                </div>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
