"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import QRCode from "qrcode.react"

const QrGeneratePage = () => {
  const [inputValue, setInputValue] = useState("")
  const [qrCode, setQrCode] = useState("")

  const handleGenerateQrCode = () => {
    if (!inputValue) {
      toast.error("Please enter some text to generate QR code.")
      return
    }

    try {
      setQrCode(inputValue)
      toast.success("QR Code Generated!")
    } catch (error) {
      console.error("Error generating QR code:", error)
      toast.error("Failed to generate QR code.")
    }
  }

  const handleDownloadQrCode = () => {
    if (!qrCode) {
      toast.error("No QR code to download. Generate one first.")
      return
    }

    try {
      const canvas = document.getElementById("qr-gen") as HTMLCanvasElement

      if (!canvas) {
        toast.error("Could not find QR code canvas.")
        return
      }

      const url = canvas.toDataURL()
      const link = document.createElement("a")
      link.href = url
      link.download = "qr-code.png"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success("QR Code Downloaded!")
    } catch (error) {
      console.error("Error downloading QR code:", error)
      toast.error("Failed to download QR code.")
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="w-[500px] mx-auto">
        <CardHeader>
          <CardTitle>QR Code Generator</CardTitle>
          <CardDescription>Enter text to generate a QR code.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Input
              type="text"
              placeholder="Enter text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerateQrCode}>Generate QR Code</Button>

          {qrCode && (
            <div className="flex flex-col items-center justify-center">
              <QRCode id="qr-gen" value={qrCode} size={256} level="H" />
              <Button className="mt-4" onClick={handleDownloadQrCode}>
                Download QR Code
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default QrGeneratePage
