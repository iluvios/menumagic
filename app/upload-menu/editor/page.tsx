"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Menu, ArrowLeft, Save, Eye, Upload, Palette, ImageIcon, Settings } from "lucide-react"
import Link from "next/link"

export default function EditorPage() {
  const [menuConfig, setMenuConfig] = useState({
    restaurantName: "Mi Restaurante",
    logo: null as string | null,
    backgroundImage: null as string | null,
    primaryColor: "#f97316",
    secondaryColor: "#ea580c",
    textColor: "#1f2937",
    font: "Inter",
    fontSize: 16,
    borderRadius: 8,
    spacing: "normal",
  })

  const [previewMode, setPreviewMode] = useState(false)

  const fonts = [
    { value: "Inter", label: "Inter (Moderno)" },
    { value: "Playfair Display", label: "Playfair Display (Elegante)" },
    { value: "Roboto", label: "Roboto (Limpio)" },
    { value: "Merriweather", label: "Merriweather (Clásico)" },
    { value: "Poppins", label: "Poppins (Amigable)" },
  ]

  const colorPresets = [
    { name: "Naranja", primary: "#f97316", secondary: "#ea580c" },
    { name: "Azul", primary: "#3b82f6", secondary: "#2563eb" },
    { name: "Verde", primary: "#10b981", secondary: "#059669" },
    { name: "Púrpura", primary: "#8b5cf6", secondary: "#7c3aed" },
    { name: "Rosa", primary: "#ec4899", secondary: "#db2777" },
    { name: "Rojo", primary: "#ef4444", secondary: "#dc2626" },
  ]

  const handleSave = () => {
    console.log("Saving menu configuration:", menuConfig)
    // Simular guardado y redirección al dashboard
    window.location.href = "/dashboard"
  }

  const handleImageUpload = (type: "logo" | "background") => {
    // Simular subida de imagen
    const fakeUrl = "/placeholder.svg?height=100&width=100"
    setMenuConfig((prev) => ({
      ...prev,
      [type === "logo" ? "logo" : "backgroundImage"]: fakeUrl,
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Link
                href="/upload-menu/template"
                className="flex items-center space-x-2 text-gray-600 hover:text-orange-500 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Volver</span>
              </Link>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <Menu className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">Editor de Plantillas</h1>
            </div>

            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                onClick={() => setPreviewMode(!previewMode)}
                className="flex items-center space-x-2"
              >
                <Eye className="w-4 h-4" />
                <span>{previewMode ? "Editar" : "Vista previa"}</span>
              </Button>
              <Button
                onClick={handleSave}
                className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar menú
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Editor Panel */}
          {!previewMode && (
            <div className="lg:col-span-1">
              <Card className="shadow-lg border-0">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="w-5 h-5 mr-2" />
                    Personalización
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="general" className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                      <TabsTrigger value="general">General</TabsTrigger>
                      <TabsTrigger value="colors">Colores</TabsTrigger>
                      <TabsTrigger value="typography">Texto</TabsTrigger>
                      <TabsTrigger value="layout">Diseño</TabsTrigger>
                    </TabsList>

                    <TabsContent value="general" className="space-y-4">
                      <div>
                        <Label htmlFor="restaurantName">Nombre del restaurante</Label>
                        <Input
                          id="restaurantName"
                          value={menuConfig.restaurantName}
                          onChange={(e) => setMenuConfig((prev) => ({ ...prev, restaurantName: e.target.value }))}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Logo del restaurante</Label>
                        <div className="mt-2">
                          {menuConfig.logo ? (
                            <div className="flex items-center space-x-3">
                              <img
                                src={menuConfig.logo || "/placeholder.svg"}
                                alt="Logo"
                                className="w-12 h-12 object-cover rounded"
                              />
                              <Button variant="outline" size="sm" onClick={() => handleImageUpload("logo")}>
                                Cambiar logo
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" onClick={() => handleImageUpload("logo")} className="w-full">
                              <Upload className="w-4 h-4 mr-2" />
                              Subir logo
                            </Button>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label>Imagen de fondo</Label>
                        <div className="mt-2">
                          {menuConfig.backgroundImage ? (
                            <div className="flex items-center space-x-3">
                              <img
                                src={menuConfig.backgroundImage || "/placeholder.svg"}
                                alt="Fondo"
                                className="w-12 h-12 object-cover rounded"
                              />
                              <Button variant="outline" size="sm" onClick={() => handleImageUpload("background")}>
                                Cambiar fondo
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleImageUpload("background")}
                              className="w-full"
                            >
                              <ImageIcon className="w-4 h-4 mr-2" />
                              Subir imagen de fondo
                            </Button>
                          )}
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="colors" className="space-y-4">
                      <div>
                        <Label>Colores predefinidos</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {colorPresets.map((preset) => (
                            <button
                              key={preset.name}
                              onClick={() =>
                                setMenuConfig((prev) => ({
                                  ...prev,
                                  primaryColor: preset.primary,
                                  secondaryColor: preset.secondary,
                                }))
                              }
                              className="flex flex-col items-center p-2 border rounded-lg hover:bg-gray-50 transition-colors"
                            >
                              <div className="flex space-x-1 mb-1">
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.primary }}></div>
                                <div className="w-4 h-4 rounded" style={{ backgroundColor: preset.secondary }}></div>
                              </div>
                              <span className="text-xs text-gray-600">{preset.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="primaryColor">Color principal</Label>
                        <div className="flex items-center space-x-3 mt-1">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={menuConfig.primaryColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={menuConfig.primaryColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, primaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="secondaryColor">Color secundario</Label>
                        <div className="flex items-center space-x-3 mt-1">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={menuConfig.secondaryColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={menuConfig.secondaryColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, secondaryColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="textColor">Color del texto</Label>
                        <div className="flex items-center space-x-3 mt-1">
                          <Input
                            id="textColor"
                            type="color"
                            value={menuConfig.textColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, textColor: e.target.value }))}
                            className="w-12 h-10 p-1 border rounded"
                          />
                          <Input
                            value={menuConfig.textColor}
                            onChange={(e) => setMenuConfig((prev) => ({ ...prev, textColor: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="typography" className="space-y-4">
                      <div>
                        <Label htmlFor="font">Fuente</Label>
                        <Select
                          value={menuConfig.font}
                          onValueChange={(value) => setMenuConfig((prev) => ({ ...prev, font: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fonts.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                {font.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label>Tamaño de fuente: {menuConfig.fontSize}px</Label>
                        <Slider
                          value={[menuConfig.fontSize]}
                          onValueChange={(value) => setMenuConfig((prev) => ({ ...prev, fontSize: value[0] }))}
                          max={24}
                          min={12}
                          step={1}
                          className="mt-2"
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="layout" className="space-y-4">
                      <div>
                        <Label>Bordes redondeados: {menuConfig.borderRadius}px</Label>
                        <Slider
                          value={[menuConfig.borderRadius]}
                          onValueChange={(value) => setMenuConfig((prev) => ({ ...prev, borderRadius: value[0] }))}
                          max={20}
                          min={0}
                          step={1}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label htmlFor="spacing">Espaciado</Label>
                        <Select
                          value={menuConfig.spacing}
                          onValueChange={(value) => setMenuConfig((prev) => ({ ...prev, spacing: value }))}
                        >
                          <SelectTrigger className="mt-1">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="compact">Compacto</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="spacious">Espacioso</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview Panel */}
          <div className={previewMode ? "lg:col-span-3" : "lg:col-span-2"}>
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Vista previa del menú
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="bg-white rounded-lg p-6 min-h-[600px]"
                  style={{
                    fontFamily: menuConfig.font,
                    fontSize: `${menuConfig.fontSize}px`,
                    color: menuConfig.textColor,
                    backgroundImage: menuConfig.backgroundImage ? `url(${menuConfig.backgroundImage})` : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  {/* Header */}
                  <div className="text-center mb-8">
                    {menuConfig.logo && (
                      <img
                        src={menuConfig.logo || "/placeholder.svg"}
                        alt="Logo"
                        className="w-16 h-16 mx-auto mb-4 rounded"
                      />
                    )}
                    <h1 className="text-3xl font-bold mb-2" style={{ color: menuConfig.primaryColor }}>
                      {menuConfig.restaurantName}
                    </h1>
                    <div className="w-24 h-1 mx-auto" style={{ backgroundColor: menuConfig.secondaryColor }}></div>
                  </div>

                  {/* Sample menu items */}
                  <div className="space-y-6">
                    <div>
                      <h2
                        className="text-xl font-semibold mb-4 pb-2 border-b"
                        style={{
                          color: menuConfig.primaryColor,
                          borderColor: menuConfig.secondaryColor,
                        }}
                      >
                        Tacos
                      </h2>
                      <div className="space-y-3">
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            borderRadius: `${menuConfig.borderRadius}px`,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">Tacos al Pastor</h3>
                              <p className="text-sm opacity-75">
                                Deliciosos tacos con carne al pastor, piña, cebolla y cilantro
                              </p>
                            </div>
                            <span className="font-bold text-lg" style={{ color: menuConfig.primaryColor }}>
                              $45.00
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2
                        className="text-xl font-semibold mb-4 pb-2 border-b"
                        style={{
                          color: menuConfig.primaryColor,
                          borderColor: menuConfig.secondaryColor,
                        }}
                      >
                        Platillos Principales
                      </h2>
                      <div className="space-y-3">
                        <div
                          className="p-4 rounded-lg"
                          style={{
                            borderRadius: `${menuConfig.borderRadius}px`,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold">Enchiladas Verdes</h3>
                              <p className="text-sm opacity-75">
                                Enchiladas bañadas en salsa verde con pollo, crema y queso
                              </p>
                            </div>
                            <span className="font-bold text-lg" style={{ color: menuConfig.primaryColor }}>
                              $75.00
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
