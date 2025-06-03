"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { QrCode, Download, Eye, Copy, Share2, Printer, Crown } from "lucide-react"

export default function QRGeneratePage() {
  const [qrConfig, setQrConfig] = useState({
    name: "Mesa 1",
    size: "medium",
    style: "square",
    color: "#000000",
    backgroundColor: "#ffffff",
    logo: false,
  })

  const [generatedQRs, setGeneratedQRs] = useState([
    {
      id: "1",
      name: "Mesa 1",
      url: "https://menumagic.com/menu/restaurant123/mesa1",
      downloads: 5,
      scans: 23,
      createdAt: "2024-01-15",
    },
    {
      id: "2",
      name: "Mesa 2",
      url: "https://menumagic.com/menu/restaurant123/mesa2",
      downloads: 3,
      scans: 18,
      createdAt: "2024-01-15",
    },
    {
      id: "3",
      name: "Barra",
      url: "https://menumagic.com/menu/restaurant123/barra",
      downloads: 2,
      scans: 12,
      createdAt: "2024-01-14",
    },
  ])

  const sizes = [
    { value: "small", label: "Pequeño (200x200px)", price: "Gratis" },
    { value: "medium", label: "Mediano (400x400px)", price: "Gratis" },
    { value: "large", label: "Grande (800x800px)", price: "Gratis" },
  ]

  const styles = [
    { value: "square", label: "Cuadrado", price: "Gratis" },
    { value: "rounded", label: "Redondeado", price: "Pro" },
    { value: "circular", label: "Circular", price: "Pro" },
    { value: "custom", label: "Personalizado", price: "Pro" },
  ]

  const handleGenerate = () => {
    const newQR = {
      id: Date.now().toString(),
      name: qrConfig.name,
      url: `https://menumagic.com/menu/restaurant123/${qrConfig.name.toLowerCase().replace(/\s+/g, "")}`,
      downloads: 0,
      scans: 0,
      createdAt: new Date().toISOString().split("T")[0],
    }
    setGeneratedQRs([newQR, ...generatedQRs])
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Generador de Códigos QR</h2>
        <p className="text-gray-600">Crea códigos QR para que tus clientes accedan al menú digital</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* QR Generator */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <QrCode className="w-5 h-5 mr-2" />
              Crear Nuevo Código QR
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="name">Nombre del código QR</Label>
              <Input
                id="name"
                value={qrConfig.name}
                onChange={(e) => setQrConfig({ ...qrConfig, name: e.target.value })}
                placeholder="Ej: Mesa 1, Barra, Terraza..."
              />
            </div>

            <div>
              <Label htmlFor="size">Tamaño</Label>
              <Select value={qrConfig.size} onValueChange={(value) => setQrConfig({ ...qrConfig, size: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map((size) => (
                    <SelectItem key={size.value} value={size.value}>
                      <div className="flex items-center justify-between w-full">
                        <span>{size.label}</span>
                        <Badge variant="outline" className="ml-2">
                          {size.price}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="style">Estilo</Label>
              <Select value={qrConfig.style} onValueChange={(value) => setQrConfig({ ...qrConfig, style: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {styles.map((style) => (
                    <SelectItem key={style.value} value={style.value} disabled={style.price === "Pro"}>
                      <div className="flex items-center justify-between w-full">
                        <span>{style.label}</span>
                        <div className="flex items-center space-x-1">
                          {style.price === "Pro" && <Crown className="w-3 h-3 text-yellow-500" />}
                          <Badge variant={style.price === "Pro" ? "secondary" : "outline"} className="ml-2">
                            {style.price}
                          </Badge>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="color">Color del QR</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="color"
                    type="color"
                    value={qrConfig.color}
                    onChange={(e) => setQrConfig({ ...qrConfig, color: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={qrConfig.color}
                    onChange={(e) => setQrConfig({ ...qrConfig, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="backgroundColor">Color de fondo</Label>
                <div className="flex items-center space-x-2 mt-1">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={qrConfig.backgroundColor}
                    onChange={(e) => setQrConfig({ ...qrConfig, backgroundColor: e.target.value })}
                    className="w-12 h-10 p-1 border rounded"
                  />
                  <Input
                    value={qrConfig.backgroundColor}
                    onChange={(e) => setQrConfig({ ...qrConfig, backgroundColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            <Button onClick={handleGenerate} className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white">
              <QrCode className="w-4 h-4 mr-2" />
              Generar Código QR
            </Button>
          </CardContent>
        </Card>

        {/* QR Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <div className="inline-block p-6 border-2 border-dashed border-gray-300 rounded-lg">
                <div
                  className="w-48 h-48 mx-auto flex items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: qrConfig.backgroundColor,
                    color: qrConfig.color,
                  }}
                >
                  <QrCode className="w-32 h-32" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{qrConfig.name}</h3>
                <p className="text-sm text-gray-600">
                  URL: menumagic.com/menu/restaurant123/{qrConfig.name.toLowerCase().replace(/\s+/g, "")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Generated QRs */}
      <Card>
        <CardHeader>
          <CardTitle>Códigos QR Generados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {generatedQRs.map((qr) => (
              <div key={qr.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                      <QrCode className="w-8 h-8 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{qr.name}</h3>
                      <p className="text-sm text-gray-600">{qr.url}</p>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span>{qr.scans} escaneos</span>
                        <span>{qr.downloads} descargas</span>
                        <span>Creado: {qr.createdAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(qr.url)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Printer className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade Banner */}
      <Card className="border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Crown className="w-8 h-8 text-orange-500" />
              <div>
                <h3 className="font-semibold text-orange-900">¿Necesitas códigos QR personalizados?</h3>
                <p className="text-orange-700 text-sm">
                  Actualiza a Pro para acceder a diseños personalizados, logos y materiales impresos
                </p>
              </div>
            </div>
            <Button className="bg-gradient-to-r from-orange-500 to-red-500 text-white">Actualizar a Pro</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
