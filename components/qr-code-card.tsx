"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Download, QrCode, Loader2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { uploadQrCodeForDigitalMenu } from "@/lib/actions/digital-menu-actions"

interface QRCodeCardProps {
  menuId: number
  menuName: string
  qrCodeUrl: string | null
  onQrCodeGenerated: (qrCodeUrl: string) => void
}

export function QRCodeCard({ menuId, menuName, qrCodeUrl, onQrCodeGenerated }: QRCodeCardProps) {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [currentQrUrl, setCurrentQrUrl] = useState<string | null>(qrCodeUrl)
  const [menuUrl, setMenuUrl] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setMenuUrl(`${window.location.origin}/menu/${menuId}`)
    }
  }, [menuId])

  useEffect(() => {
    setCurrentQrUrl(qrCodeUrl)
  }, [qrCodeUrl])

  // Auto-generate QR code if it doesn't exist
  useEffect(() => {
    if (!currentQrUrl && menuUrl && !isGenerating) {
      handleGenerateQrCode()
    }
  }, [currentQrUrl, menuUrl])

  const handleGenerateQrCode = async () => {
    if (!menuUrl) return

    setIsGenerating(true)
    try {
      const response = await fetch("/api/generate-qr", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: menuUrl }),
      })

      if (!response.ok) {
        throw new Error("Failed to generate QR code.")
      }

      const { qrCodeBase64 } = await response.json()

      const uploadResult = await uploadQrCodeForDigitalMenu(menuId, qrCodeBase64)
      if (uploadResult.success) {
        setCurrentQrUrl(uploadResult.qrCodeUrl)
        onQrCodeGenerated(uploadResult.qrCodeUrl)
        toast({
          title: "Success",
          description: "QR code generated successfully!",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to upload QR code.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error generating or uploading QR code:", error)
      toast({
        title: "Error",
        description: "Failed to generate QR code.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = () => {
    if (!currentQrUrl) return

    const link = document.createElement("a")
    link.href = currentQrUrl
    link.download = `menumagic_qr_code_${menuId}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast({
      title: "Success",
      description: "QR code downloaded successfully.",
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <QrCode className="h-5 w-5" />
          QR Code
        </CardTitle>
        <CardDescription>Share your digital menu with customers</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <p className="text-sm text-gray-500">Generating QR code...</p>
          </div>
        ) : currentQrUrl ? (
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-shrink-0">
                <div className="bg-white p-4 rounded-lg border shadow-sm">
                  <img
                    src={currentQrUrl || "/placeholder.svg"}
                    alt={`QR Code for ${menuName}`}
                    className="h-32 w-32 object-contain"
                  />
                </div>
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Menu URL</h4>
                  <p className="text-sm text-gray-600 font-mono break-all">{menuUrl}</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleDownload} className="flex-1">
                    <Download className="mr-2 h-4 w-4" />
                    Download QR
                  </Button>
                  <Button variant="outline" onClick={handleGenerateQrCode} disabled={isGenerating}>
                    <QrCode className="mr-2 h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Customers can scan this QR code to view your menu instantly</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <QrCode className="h-12 w-12 text-gray-400" />
            <div className="text-center">
              <p className="text-sm text-gray-500 mb-2">No QR code generated yet</p>
              <Button onClick={handleGenerateQrCode} disabled={isGenerating}>
                <QrCode className="mr-2 h-4 w-4" />
                Generate QR Code
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
