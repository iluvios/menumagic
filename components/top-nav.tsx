"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Bell, Search, User, ChevronDown, Settings, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getCurrentUserAndRestaurant, logoutUser } from "@/lib/auth"

export function TopNav() {
  const [restaurantName, setRestaurantName] = useState("Cargando...")
  const [userName, setUserName] = useState("Usuario")
  const [location, setLocation] = useState("")

  useEffect(() => {
    const fetchUserData = async () => {
      const { user, restaurant } = await getCurrentUserAndRestaurant()
      if (user) {
        setUserName(user.name || "Usuario Demo")
      }
      if (restaurant) {
        setRestaurantName(restaurant.name || "Mi Restaurante")
        // Assuming address_json has city/state, or you can derive location from it
        if (
          restaurant.address_json &&
          typeof restaurant.address_json === "object" &&
          "city" in restaurant.address_json
        ) {
          setLocation(restaurant.address_json.city as string)
        } else {
          setLocation("Ubicación Desconocida")
        }
      } else {
        setRestaurantName("Mi Restaurante")
        setLocation("Ciudad de México")
      }
    }
    fetchUserData()
  }, [])

  const handleLogout = async () => {
    await logoutUser()
  }

  return (
    <header className="h-16 border-b border-neutral-200 bg-white flex items-center justify-between px-6 shadow-sm">
      <div className="flex items-center space-x-2 text-neutral-700">
        <span className="font-semibold">{restaurantName}</span>
        {location && (
          <>
            <span className="text-neutral-300">/</span>
            <span>{location}</span>
          </>
        )}
      </div>

      <div className="relative w-80">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <Input
          placeholder="Buscar en la plataforma..."
          className="pl-10 h-10 bg-neutral-100 border-0 rounded-lg focus:ring-2 focus:ring-warm-200"
        />
      </div>

      <div className="flex items-center space-x-4">
        <button className="text-neutral-500 hover:text-warm-600 transition-colors relative">
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-2 text-sm text-neutral-700 hover:text-warm-600 transition-colors cursor-pointer">
              <div className="w-9 h-9 bg-warm-100 rounded-full flex items-center justify-center text-warm-700 font-medium">
                <User className="h-5 w-5" />
              </div>
              <span>{userName}</span>
              <ChevronDown className="h-4 w-4 text-neutral-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Perfil</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Configuración</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
