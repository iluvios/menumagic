"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Copy, Download, Share2 } from "lucide-react"
import QRCode from "qrcode"
import { uploadQrCodeForDigitalMenu } from "@/lib/actions/digital-menu-actions"
import { toast } from "@/hooks/use-toast"

interface QRDisplayDialogProps {
  isOpen: boolean
  onClose: () => void
  menuId: number
  menuName: string
  qrCodeUrl?: string | null
  publicMenuBaseUrl: string
}

export function QRDisplayDialog({
  isOpen,
  onClose,
  menuId,
  menuName,
  qrCodeUrl,
  publicMenuBaseUrl,
}: QRDisplayDialogProps) {
  const [generatedQrCodeDataUrl, setGeneratedQrCodeDataUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const publicMenuLink = `${publicMenuBaseUrl}/menu/${menuId}`

  const generateAndUploadQrCode = useCallback(async () => {
    setIsLoading(true)
    setIsUploading(true)
    try {
      const qrCodeBuffer = await QRCode.toBuffer(publicMenuLink, {
        errorCorrectionLevel: "H",
        type: "image/png",
        width: 500,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })

      const base64Image = `data:image/png;base64,${qrCodeBuffer.toString("base64")}`
      setGeneratedQrCodeDataUrl(base64Image)

      const uploadResult = await uploadQrCodeForDigitalMenu(menuId, base64Image)
      if (uploadResult.success) {
        toast({
          title: "QR Code generado y guardado",
          description: "El código QR ha sido generado y subido exitosamente.",
        })
      } else {
        throw new Error("Failed to upload QR code.")
      }
    } catch (error) {
      console.error("Error generating or uploading QR code:", error)
      toast({
        title: "Error al generar QR",
        description: "Hubo un problema al generar o subir el código QR. Inténtalo de nuevo.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setIsUploading(false)
    }
  }, [menuId, publicMenuLink])

  useEffect(() => {
    if (isOpen) {
      if (qrCodeUrl) {
        setGeneratedQrCodeDataUrl(qrCodeUrl)
      } else {
        generateAndUploadQrCode()
      }
    } else {
      setGeneratedQrCodeDataUrl(null)
      setIsLoading(false)
      setIsUploading(false)
    }
  }, [isOpen, qrCodeUrl, generateAndUploadQrCode])

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicMenuLink)
    toast({
      title: "Enlace copiado",
      description: "El enlace del menú ha sido copiado al portapapeles.",
    })
  }

  const handleDownload = () => {
    if (generatedQrCodeDataUrl) {
      const link = document.createElement("a")
      link.href = generatedQrCodeDataUrl
      link.download = `menu-magic-qr-${menuId}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast({
        title: "Descarga iniciada",
        description: "Tu código QR se está descargando.",
      })
    } else {
      toast({
        title: "Error de descarga",
        description: "No hay un código QR disponible para descargar.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Menú Digital: ${menuName}`,
          text: `¡Echa un vistazo a nuestro menú digital!`,
          url: publicMenuLink,
        })
        toast({
          title: "Menú compartido",
          description: "El enlace del menú ha sido compartido exitosamente.",
        })
      } catch (error) {
        console.error("Error sharing:", error)
        toast({
          title: "Error al compartir",
          description: "No se pudo compartir el enlace del menú.",
          variant: "destructive",
        })
      }
    } else {
      toast({
        title: "Compartir no soportado",
        description: "Tu navegador no soporta la función de compartir nativa.",
      })
      handleCopyLink()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Código QR de tu Menú Digital</DialogTitle>
          <DialogDescription>
            Comparte este código QR para que tus clientes accedan a tu menú digital.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 w-64 border rounded-lg bg-gray-50">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-gray-600">Generando QR...</p>
              </div>
            ) : generatedQrCodeDataUrl ? (
              <img
                src={generatedQrCodeDataUrl || "/placeholder.svg"}
                alt="Código QR del menú"
                width={250}
                height={250}
                className="aspect-square object-contain border rounded-lg p-2"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 w-64 border rounded-lg bg-gray-50 text-gray-500">
                <p>No QR Code available. Generate below.</p>
              </div>
            )}
            <Button onClick={generateAndUploadQrCode} disabled={isLoading || isUploading} className="w-full">
              {isUploading ? "Subiendo QR..." : "Regenerar y Guardar QR"}
            </Button>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="menu-link">Enlace del Menú</Label>
            <div className="flex space-x-2">
              <Input id="menu-link" readOnly value={publicMenuLink} />
              <Button variant="outline" size="icon" onClick={handleCopyLink}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex justify-around pt-2">
            <Button variant="outline" onClick={handleDownload} disabled={!generatedQrCodeDataUrl}>
              <Download className="mr-2 h-4 w-4" /> Descargar
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" /> Compartir
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
