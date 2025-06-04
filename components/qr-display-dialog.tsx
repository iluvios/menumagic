"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import QRCode from "qrcode"
import { DownloadIcon, Share2Icon, CopyIcon, RefreshCcwIcon } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QrDisplayDialogProps {
  isOpen: boolean
  onOpenChange: (isOpen: boolean) => void
  qrCodeUrl: string | null
  menuId: number
  menuName: string
  onQrCodeGenerated: (menuId: number, base64Image: string) => void
}

export function QrDisplayDialog({
  isOpen,
  onOpenChange,
  qrCodeUrl,
  menuId,
  menuName,
  onQrCodeGenerated,
}: QrDisplayDialogProps) {
  const [generatedQrCodeDataUrl, setGeneratedQrCodeDataUrl] = useState<string | null>(qrCodeUrl)
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const menuLink = `${window.location.origin}/menu/${menuId}`

  useEffect(() => {
    if (isOpen && !generatedQrCodeDataUrl) {
      generateAndUploadQrCode()
    } else if (isOpen && qrCodeUrl) {
      setGeneratedQrCodeDataUrl(qrCodeUrl)
    }
  }, [isOpen, qrCodeUrl])

  const generateAndUploadQrCode = async () => {
    setLoading(true)
    try {
      // Generate QR code as a Buffer
      const qrCodeBuffer = await QRCode.toBuffer(menuLink, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      // Convert Buffer to Base64
      const base64Image = `data:image/png;base64,${qrCodeBuffer.toString("base64")}`

      setGeneratedQrCodeDataUrl(base64Image)
      onQrCodeGenerated(menuId, base64Image) // Upload to blob storage
      toast({ title: "Éxito", description: "Código QR generado y guardado." })
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast({
        title: "Error",
        description: "No se pudo generar el código QR. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (generatedQrCodeDataUrl) {
      const link = document.createElement("a")
      link.href = generatedQrCodeDataUrl
      link.download = `qr-code-${menuName.replace(/\s/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({ title: "Éxito", description: "Código QR descargado." })
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(menuLink)
    toast({ title: "Éxito", description: "Enlace del menú copiado al portapapeles." })
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Menú Digital: ${menuName}`,
          text: `¡Echa un vistazo a nuestro menú digital!`,
          url: menuLink,
        })
        toast({ title: "Éxito", description: "Menú compartido." })
      } catch (error) {
        console.error("Error sharing:", error)
        toast({
          title: "Error",
          description: "No se pudo compartir el menú.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Información",
        description: "La función de compartir no es compatible con tu navegador.",
      })
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Código QR del Menú Digital</DialogTitle>
          <DialogDescription>Escanea este código QR para ver el menú digital de {menuName}.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          {loading ? (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100">
              <RefreshCcwIcon className="h-8 w-8 animate-spin text-gray-500" />
            </div>
          ) : generatedQrCodeDataUrl ? (
            <img
              src={generatedQrCodeDataUrl || "/placeholder.svg"}
              alt={`QR Code for ${menuName}`}
              className="h-48 w-48 rounded-lg"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded-lg bg-gray-100 text-center text-sm text-gray-500">
              No QR Code available.
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" /> {/* Hidden canvas for QR generation */}
          <p className="mt-4 text-center text-sm text-gray-600">
            Enlace del menú:{" "}
            <a href={menuLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              {menuLink}
            </a>
          </p>
        </div>
        <div className="flex justify-center gap-2 p-4">
          <Button onClick={handleDownload} disabled={!generatedQrCodeDataUrl || loading}>
            <DownloadIcon className="mr-2 h-4 w-4" />
            Descargar
          </Button>
          <Button onClick={handleCopyLink} disabled={loading} variant="outline">
            <CopyIcon className="mr-2 h-4 w-4" />
            Copiar Enlace
          </Button>
          <Button onClick={handleShare} disabled={loading} variant="outline">
            <Share2Icon className="mr-2 h-4 w-4" />
            Compartir
          </Button>
        </div>
        {!qrCodeUrl && ( // Only show regenerate if no QR URL was initially provided
          <div className="flex justify-center">
            <Button onClick={generateAndUploadQrCode} disabled={loading} variant="secondary">
              <RefreshCcwIcon className="mr-2 h-4 w-4" />
              Regenerar QR
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
