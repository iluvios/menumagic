"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { QRCodeCanvas } from "qrcode.react"
import { Download, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// Remove any utapi imports if they exist

interface QRDisplayDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  qrCodeUrl: string | null
  menuId: number
  menuName: string
  onQrCodeGenerated?: (menuId: number, base64Image: string) => void
}

export function QRDisplayDialog({
  isOpen,
  onOpenChange,
  qrCodeUrl,
  menuId,
  menuName,
  onQrCodeGenerated,
}: QRDisplayDialogProps) {
  const { toast } = useToast()
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrValue, setQrValue] = useState<string>("")
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  useEffect(() => {
    // Set the QR code value to the public URL of the menu
    const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL || window.location.origin
    setQrValue(`${baseUrl}/menu/${menuId}`)
  }, [menuId])

  const handleDownload = () => {
    if (!qrRef.current) return

    try {
      const canvas = qrRef.current.querySelector("canvas")
      if (!canvas) {
        toast({
          title: "Error",
          description: "Could not find QR code canvas element.",
          variant: "destructive",
        })
        return
      }

      const image = canvas.toDataURL("image/png")
      const link = document.createElement("a")
      link.href = image
      link.download = `qr-code-${menuName.toLowerCase().replace(/\s+/g, "-")}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      toast({
        title: "Success",
        description: "QR code downloaded successfully.",
      })
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast({
        title: "Error",
        description: "Failed to download QR code.",
        variant: "destructive",
      })
    }
  }

  const handleShare = async () => {
    if (!qrRef.current) return

    try {
      const canvas = qrRef.current.querySelector("canvas")
      if (!canvas) {
        toast({
          title: "Error",
          description: "Could not find QR code canvas element.",
          variant: "destructive",
        })
        return
      }

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            throw new Error("Failed to create blob from canvas")
          }
        }, "image/png")
      })

      if (navigator.share) {
        await navigator.share({
          title: `QR Code for ${menuName}`,
          text: "Scan this QR code to view our menu",
          files: [
            new File([blob], `qr-code-${menuName.toLowerCase().replace(/\s+/g, "-")}.png`, { type: "image/png" }),
          ],
        })
        toast({
          title: "Success",
          description: "QR code shared successfully.",
        })
      } else {
        toast({
          title: "Error",
          description: "Web Share API is not supported in this browser.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error sharing QR code:", error)
      toast({
        title: "Error",
        description: "Failed to share QR code.",
        variant: "destructive",
      })
    }
  }

  const handleGenerateAndUpload = async () => {
    if (!qrRef.current || !onQrCodeGenerated) return

    try {
      setIsGenerating(true)
      const canvas = qrRef.current.querySelector("canvas")
      if (!canvas) {
        toast({
          title: "Error",
          description: "Could not find QR code canvas element.",
          variant: "destructive",
        })
        return
      }

      const base64Image = canvas.toDataURL("image/png").split(",")[1]
      await onQrCodeGenerated(menuId, base64Image)

      toast({
        title: "Success",
        description: "QR code generated and uploaded successfully.",
      })
    } catch (error) {
      console.error("Error generating and uploading QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate and upload QR code.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {menuName}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div ref={qrRef} className="bg-white p-4 rounded-lg">
            {qrValue && <QRCodeCanvas value={qrValue} size={200} level="H" />}
          </div>
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Scan this QR code to view the digital menu for {menuName}
          </p>
        </div>
        <DialogFooter className="flex flex-col sm:flex-row sm:justify-between gap-2">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
            <Button variant="outline" onClick={handleShare} className="flex-1">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
          </div>
          {onQrCodeGenerated && (
            <Button onClick={handleGenerateAndUpload} disabled={isGenerating} className="flex-1">
              {isGenerating ? "Generating..." : "Save to Menu"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
