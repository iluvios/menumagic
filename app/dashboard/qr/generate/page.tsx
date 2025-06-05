"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getDigitalMenus } from "@/lib/actions/menu-studio-actions"
import { toast } from "@/hooks/use-toast"
import { QRDisplayDialog } from "@/components/qr-display-dialog" // Corrected named import

export default function GenerateQRPage() {
  const [digitalMenus, setDigitalMenus] = useState<any[]>([])
  const [selectedMenuId, setSelectedMenuId] = useState<number | null>(null)
  const [selectedMenuName, setSelectedMenuName] = useState<string>("")
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)
  const publicMenuBaseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000"

  useEffect(() => {
    async function fetchMenus() {
      try {
        const menus = await getDigitalMenus()
        setDigitalMenus(menus)
        if (menus.length > 0) {
          setSelectedMenuId(menus[0].id)
          setSelectedMenuName(menus[0].name)
          setQrCodeUrl(menus[0].qr_code_url)
        }
      } catch (error) {
        console.error("Error fetching digital menus:", error)
        toast({
          title: "Error",
          description: "Failed to load digital menus.",
          variant: "destructive",
        })
      }
    }
    fetchMenus()
  }, [])

  const handleMenuSelect = (value: string) => {
    const id = Number.parseInt(value)
    setSelectedMenuId(id)
    const menu = digitalMenus.find((m) => m.id === id)
    if (menu) {
      setSelectedMenuName(menu.name)
      setQrCodeUrl(menu.qr_code_url)
    }
  }

  const handleGenerateQr = () => {
    if (selectedMenuId) {
      setIsQrDialogOpen(true)
    } else {
      toast({
        title: "Selección requerida",
        description: "Por favor, selecciona un menú digital para generar el código QR.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Generar Código QR del Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="digital-menu">Selecciona un Menú Digital</Label>
            <Select onValueChange={handleMenuSelect} value={selectedMenuId?.toString() || ""}>
              <SelectTrigger id="digital-menu">
                <SelectValue placeholder="Selecciona un menú" />
              </SelectTrigger>
              <SelectContent>
                {digitalMenus.map((menu) => (
                  <SelectItem key={menu.id} value={menu.id.toString()}>
                    {menu.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleGenerateQr} className="w-full">
            Generar y Ver Código QR
          </Button>
        </CardContent>
      </Card>

      {selectedMenuId && (
        <QRDisplayDialog
          isOpen={isQrDialogOpen}
          onClose={() => setIsQrDialogOpen(false)}
          menuId={selectedMenuId}
          menuName={selectedMenuName}
          qrCodeUrl={qrCodeUrl}
          publicMenuBaseUrl={publicMenuBaseUrl}
        />
      )}
    </div>
  )
}
