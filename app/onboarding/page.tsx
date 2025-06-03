"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Menu, Store, MapPin, Users, Clock, ChefHat, ArrowRight, CheckCircle } from "lucide-react"
import Link from "next/link"

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantType: "",
    address: "",
    city: "",
    state: "",
    zipCode: "",
    description: "",
    capacity: "",
    openingHours: "",
    specialties: [] as string[],
  })

  const restaurantTypes = [
    "Restaurante casual",
    "Restaurante fino",
    "Comida rápida",
    "Cafetería",
    "Bar/Cantina",
    "Pizzería",
    "Marisquería",
    "Taquería",
    "Panadería",
    "Food truck",
    "Otro",
  ]

  const specialtyOptions = [
    "Comida mexicana",
    "Comida italiana",
    "Comida asiática",
    "Comida americana",
    "Mariscos",
    "Carnes",
    "Vegetariano/Vegano",
    "Postres",
    "Bebidas especiales",
    "Comida internacional",
  ]

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSpecialtyToggle = (specialty: string) => {
    setFormData((prev) => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter((s) => s !== specialty)
        : [...prev.specialties, specialty],
    }))
  }

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)

    // Simular llamada a API
    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Onboarding completed:", formData)

    // Simular redirección al dashboard
    window.location.href = "/dashboard"

    setIsLoading(false)
  }

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.restaurantName && formData.restaurantType
      case 2:
        return formData.address && formData.city && formData.state
      case 3:
        return true // Opcional
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-10"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-red-400 to-orange-400 rounded-full opacity-10"></div>
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Menu className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">MenuMagic</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Bienvenido a MenuMagic!</h2>
          <p className="text-gray-600">Cuéntanos sobre tu restaurante para personalizar tu experiencia</p>
        </div>

        {/* Progress indicator */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    step <= currentStep
                      ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step < currentStep ? <CheckCircle className="w-5 h-5" /> : step}
                </div>
                {step < 3 && (
                  <div
                    className={`w-12 h-1 mx-2 transition-colors ${
                      step < currentStep ? "bg-gradient-to-r from-orange-500 to-red-500" : "bg-gray-200"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <Card className="shadow-2xl border-0">
          <CardHeader className="pb-6">
            <CardTitle className="text-xl font-bold text-gray-900">
              {currentStep === 1 && "Información básica"}
              {currentStep === 2 && "Ubicación"}
              {currentStep === 3 && "Detalles adicionales"}
            </CardTitle>
          </CardHeader>

          <CardContent>
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="restaurantName" className="text-sm font-medium text-gray-700">
                    Nombre del restaurante *
                  </Label>
                  <div className="relative">
                    <Store className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="restaurantName"
                      type="text"
                      placeholder="El nombre de tu restaurante"
                      value={formData.restaurantName}
                      onChange={(e) => handleInputChange("restaurantName", e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restaurantType" className="text-sm font-medium text-gray-700">
                    Tipo de restaurante *
                  </Label>
                  <Select
                    value={formData.restaurantType}
                    onValueChange={(value) => handleInputChange("restaurantType", value)}
                  >
                    <SelectTrigger className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500">
                      <SelectValue placeholder="Selecciona el tipo de restaurante" />
                    </SelectTrigger>
                    <SelectContent>
                      {restaurantTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                    Descripción breve (opcional)
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe tu restaurante en pocas palabras..."
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    className="border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    rows={3}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Location */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Dirección *
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <Input
                      id="address"
                      type="text"
                      placeholder="Calle y número"
                      value={formData.address}
                      onChange={(e) => handleInputChange("address", e.target.value)}
                      className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      Ciudad *
                    </Label>
                    <Input
                      id="city"
                      type="text"
                      placeholder="Ciudad"
                      value={formData.city}
                      onChange={(e) => handleInputChange("city", e.target.value)}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="state" className="text-sm font-medium text-gray-700">
                      Estado *
                    </Label>
                    <Input
                      id="state"
                      type="text"
                      placeholder="Estado"
                      value={formData.state}
                      onChange={(e) => handleInputChange("state", e.target.value)}
                      className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-sm font-medium text-gray-700">
                    Código postal (opcional)
                  </Label>
                  <Input
                    id="zipCode"
                    type="text"
                    placeholder="12345"
                    value={formData.zipCode}
                    onChange={(e) => handleInputChange("zipCode", e.target.value)}
                    className="h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Additional Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="capacity" className="text-sm font-medium text-gray-700">
                      Capacidad (personas)
                    </Label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="capacity"
                        type="number"
                        placeholder="50"
                        value={formData.capacity}
                        onChange={(e) => handleInputChange("capacity", e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="openingHours" className="text-sm font-medium text-gray-700">
                      Horario principal
                    </Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <Input
                        id="openingHours"
                        type="text"
                        placeholder="9:00 AM - 10:00 PM"
                        value={formData.openingHours}
                        onChange={(e) => handleInputChange("openingHours", e.target.value)}
                        className="pl-10 h-12 border-gray-200 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700 flex items-center">
                    <ChefHat className="w-4 h-4 mr-2" />
                    Especialidades (selecciona las que apliquen)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {specialtyOptions.map((specialty) => (
                      <Badge
                        key={specialty}
                        variant={formData.specialties.includes(specialty) ? "default" : "outline"}
                        className={`cursor-pointer transition-colors ${
                          formData.specialties.includes(specialty)
                            ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
                            : "hover:bg-orange-50 hover:border-orange-200"
                        }`}
                        onClick={() => handleSpecialtyToggle(specialty)}
                      >
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="px-6"
              >
                Anterior
              </Button>

              {currentStep < 3 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6"
                >
                  Siguiente
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isLoading}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-6"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Configurando...</span>
                    </div>
                  ) : (
                    <>
                      Completar configuración
                      <CheckCircle className="ml-2 w-4 h-4" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Skip option */}
        <div className="mt-6 text-center">
          <Link href="/dashboard" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
            Saltar por ahora y completar después
          </Link>
        </div>
      </div>
    </div>
  )
}
