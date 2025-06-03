"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, CheckCircle2 } from "lucide-react"
import { getCurrentUserAndRestaurant } from "@/lib/auth"
import { updateRestaurantProfile } from "@/lib/actions/restaurant-actions"
import { useRouter } from "next/navigation"

interface RestaurantProfile {
  id: number
  name: string
  address_json: { street?: string; city?: string; state?: string; zip?: string } | null
  phone: string
  email: string
  cuisine_type: string | null
  operating_hours_json: any | null
  currency_code: string | null
  timezone: string | null
  default_tax_rate_percentage: number | null
}

export default function OnboardingPage() {
  const router = useRouter()
  const [restaurant, setRestaurant] = useState<RestaurantProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRestaurantData() {
      const { restaurant } = await getCurrentUserAndRestaurant()
      if (restaurant) {
        setRestaurant({
          ...restaurant,
          address_json: restaurant.address_json || {},
          operating_hours_json: restaurant.operating_hours_json || {},
        })
      } else {
        // If no restaurant, redirect to login or registration
        router.push("/login")
      }
      setIsLoading(false)
    }
    fetchRestaurantData()
  }, [router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setRestaurant((prev) => {
      if (!prev) return null
      if (id.startsWith("address_")) {
        const addressKey = id.replace("address_", "")
        return {
          ...prev,
          address_json: {
            ...prev.address_json,
            [addressKey]: value,
          },
        }
      }
      return { ...prev, [id]: value }
    })
  }

  const handleSelectChange = (id: string, value: string) => {
    setRestaurant((prev) => {
      if (!prev) return null
      return { ...prev, [id]: value }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!restaurant) return

    setIsSaving(true)
    setError(null)
    setSaveSuccess(false)

    try {
      const result = await updateRestaurantProfile(restaurant.id, restaurant)
      if (result.success) {
        setSaveSuccess(true)
        setTimeout(() => {
          setSaveSuccess(false)
          router.push("/dashboard") // Redirect to dashboard after successful onboarding
        }, 1500)
      } else {
        setError(result.error || "Failed to update profile.")
      }
    } catch (err) {
      console.error("Error saving restaurant profile:", err)
      setError("An unexpected error occurred.")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-700">Cargando perfil del restaurante...</span>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 text-red-600">
        No se pudo cargar el perfil del restaurante. Por favor, inicia sesión de nuevo.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-2xl border-0">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center text-gray-900">¡Bienvenido a MenuMagic!</CardTitle>
          <p className="text-center text-gray-600">Completa la información de tu restaurante para empezar.</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Restaurant Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre del Restaurante</Label>
              <Input id="name" value={restaurant.name || ""} onChange={handleChange} required />
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label>Dirección del Restaurante</Label>
              <Input
                id="address_street"
                placeholder="Calle y número"
                value={restaurant.address_json?.street || ""}
                onChange={handleChange}
                className="mb-2"
              />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <Input
                  id="address_city"
                  placeholder="Ciudad"
                  value={restaurant.address_json?.city || ""}
                  onChange={handleChange}
                />
                <Input
                  id="address_state"
                  placeholder="Estado"
                  value={restaurant.address_json?.state || ""}
                  onChange={handleChange}
                />
                <Input
                  id="address_zip"
                  placeholder="Código Postal"
                  value={restaurant.address_json?.zip || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input id="phone" type="tel" value={restaurant.phone || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input id="email" type="email" value={restaurant.email || ""} onChange={handleChange} />
              </div>
            </div>

            {/* Cuisine Type & Currency */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cuisine_type">Tipo de Cocina</Label>
                <Input id="cuisine_type" value={restaurant.cuisine_type || ""} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency_code">Moneda</Label>
                <Select
                  value={restaurant.currency_code || "USD"}
                  onValueChange={(value) => handleSelectChange("currency_code", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona moneda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - Dólar Estadounidense</SelectItem>
                    <SelectItem value="MXN">MXN - Peso Mexicano</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    {/* Add more currencies as needed */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Timezone & Tax Rate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="timezone">Zona Horaria</Label>
                <Input
                  id="timezone"
                  value={restaurant.timezone || ""}
                  onChange={handleChange}
                  placeholder="Ej: America/Mexico_City"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="default_tax_rate_percentage">Tasa de Impuesto (%)</Label>
                <Input
                  id="default_tax_rate_percentage"
                  type="number"
                  step="0.01"
                  value={restaurant.default_tax_rate_percentage || ""}
                  onChange={handleChange}
                />
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

            <Button
              type="submit"
              className="w-full h-12 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-medium transition-all duration-200 disabled:opacity-50"
              disabled={isSaving}
            >
              {isSaving ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Guardando...</span>
                </div>
              ) : saveSuccess ? (
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-5 w-5" />
                  <span>¡Guardado! Redirigiendo...</span>
                </div>
              ) : (
                "Guardar y Continuar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
