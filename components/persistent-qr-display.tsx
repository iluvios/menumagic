"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download } from "lucide-react"
import { useState, useEffect } from "react"

interface PersistentQRDisplayProps {
  menuId: number | null
  qrCodeUrl: string | null
}

// Export with the exact name that's being imported
export function PersistentQRDisplay({ menuId, qrCodeUrl }: PersistentQRDisplayProps) {
  const [displayUrl, setDisplayUrl] = useState<string | null>(null)

  useEffect(() => {
    if (menuId) {
      setDisplayUrl(`${window.location.origin}/menu/${menuId}`)
    } else {
      setDisplayUrl(null)
    }
  }, [menuId])

  const handleDownload = () => {
    if (!qrCodeUrl) return

    const link = document.createElement("a")
    link.href = qrCodeUrl
    link.download = `menumagic_qr_code_${menuId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!menuId || !displayUrl || !qrCodeUrl) {
    return null
  }

  return (
    <Card className="shadow-md border-neutral-200">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-warm-100 p-2 rounded-md">
            <img src={qrCodeUrl || "/placeholder.svg"} alt={`QR Code for Menu ${menuId}`} className="h-16 w-16" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-800">Código QR del Menú</h3>
            <p className="text-sm text-neutral-500 truncate max-w-[200px] sm:max-w-[300px]">{displayUrl}</p>
          </div>
        </div>
        <Button onClick={handleDownload} className="bg-warm-500 hover:bg-warm-600 text-white">
          <Download className="mr-2 h-4 w-4" />
          Descargar QR
        </Button>
      </CardContent>
    </Card>
  )
}
