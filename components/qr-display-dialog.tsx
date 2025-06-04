"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface QRDisplayDialogProps {
  // Changed to QRDisplayDialogProps
  isOpen: boolean
  onClose: () => void
  menuUrl: string | null
}

export function QRDisplayDialog({ isOpen, onClose, menuUrl }: QRDisplayDialogProps) {
  // Changed to QRDisplayDialog
  if (!menuUrl) return null

  // Generate a placeholder QR image URL. In a real app, this would be a QR generation API.
  const qrImageUrl = `/placeholder.svg?height=200&width=200&query=QR%20code%20for%20${encodeURIComponent(menuUrl)}`

  const handleDownload = () => {
    // In a real application, you would fetch the actual QR image data
    // and then create a Blob or use a library like 'file-saver' to download it.
    // For this example, we'll simulate a download or link to the placeholder.
    const link = document.createElement("a")
    link.href = qrImageUrl
    link.download = `menumagic_qr_code_${menuUrl.split("/").pop()}.svg` // Suggest a filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Código QR de tu Menú</DialogTitle>
          <DialogDescription>Escanea este código para acceder directamente a tu menú digital.</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4 space-y-4">
          <div className="p-4 border border-gray-200 rounded-lg bg-white">
            {/* Using a placeholder image for the QR code */}
            <img
              src={qrImageUrl || "/placeholder.svg"}
              alt={`QR Code for ${menuUrl}`}
              width={200}
              height={200}
              className="w-48 h-48 object-contain"
            />
          </div>
          <p className="text-sm text-gray-600 break-all text-center">{menuUrl}</p>
          <Button onClick={handleDownload} className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Descargar QR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
