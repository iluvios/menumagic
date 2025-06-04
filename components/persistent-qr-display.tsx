"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Download, QrCode } from "lucide-react"
import { useState, useEffect } from "react"

interface PersistentQrDisplayProps {
  menuId: number | null
}

export function PersistentQrDisplay({ menuId }: PersistentQrDisplayProps) {
  const [menuUrl, setMenuUrl] = useState<string | null>(null)

  useEffect(() => {
    if (menuId) {
      setMenuUrl(`${window.location.origin}/menu/${menuId}`)
    } else {
      setMenuUrl(null)
    }
  }, [menuId])

  const handleDownload = () => {
    if (!menuUrl) return

    // Generate QR code URL - in a real app, use a proper QR generation API
    const qrImageUrl = `/placeholder.svg?height=200&width=200&query=QR%20code%20for%20${encodeURIComponent(menuUrl)}`

    const link = document.createElement("a")
    link.href = qrImageUrl
    link.download = `menumagic_qr_code_${menuId}.svg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (!menuId || !menuUrl) {
    return null
  }

  return (
    <Card className="shadow-md border-neutral-200">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="bg-warm-100 p-2 rounded-md">
            <QrCode className="h-6 w-6 text-warm-600" />
          </div>
          <div>
            <h3 className="font-medium text-neutral-800">Código QR del Menú</h3>
            <p className="text-sm text-neutral-500 truncate max-w-[200px] sm:max-w-[300px]">{menuUrl}</p>
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
