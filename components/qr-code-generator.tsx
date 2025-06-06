"use client"

import { useEffect, useRef, useState } from "react"
import { QRCodeCanvas } from "qrcode.react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface QRCodeGeneratorProps {
  menuId: number
  menuName: string
  onQrGenerated?: (base64Image: string) => void
}

export function QRCodeGenerator({ menuId, menuName, onQrGenerated }: QRCodeGeneratorProps) {
  const { toast } = useToast()
  const qrRef = useRef<HTMLDivElement>(null)
  const [qrValue, setQrValue] = useState<string>("")

  useEffect(() => {
    // Set the QR code value to the public URL of the menu
    const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
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

      // If callback provided, also pass the base64 image
      if (onQrGenerated) {
        const base64Image = image.split(",")[1]
        onQrGenerated(base64Image)
      }
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

  if (!qrValue) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Loading QR code...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">QR Code for {menuName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div ref={qrRef} className="bg-white p-4 rounded-lg shadow-sm border">
          <QRCodeCanvas value={qrValue} size={200} level="H" includeMargin={true} />
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          Scan this QR code to view the digital menu for {menuName}
        </p>
        <div className="flex gap-2 w-full">
          <Button onClick={handleDownload} className="flex-1">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
          <Button variant="outline" onClick={handleShare} className="flex-1">
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <p className="text-xs text-muted-foreground text-center">Link: {qrValue}</p>
      </CardContent>
    </Card>
  )
}
