"use client"

import type React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { uploadBrandAsset } from "@/app/dashboard/menu-studio/brand-kit/brand-kit-actions"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

export default function BrandKitPage() {
  const [logo, setLogo] = useState<File | null>(null)
  const [primaryColor, setPrimaryColor] = useState("")
  const [secondaryColor, setSecondaryColor] = useState("")
  const { toast } = useToast()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setLogo(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!logo || !primaryColor || !secondaryColor) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData()
    formData.append("logo", logo)
    formData.append("primaryColor", primaryColor)
    formData.append("secondaryColor", secondaryColor)

    try {
      const result = await uploadBrandAsset(formData)

      if (result?.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Brand kit updated successfully!",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-4">Brand Kit</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="logo">Logo</Label>
          <Input type="file" id="logo" onChange={handleLogoChange} />
        </div>

        <div>
          <Label htmlFor="primaryColor">Primary Color</Label>
          <Input
            type="color"
            id="primaryColor"
            value={primaryColor}
            onChange={(e) => setPrimaryColor(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="secondaryColor">Secondary Color</Label>
          <Input
            type="color"
            id="secondaryColor"
            value={secondaryColor}
            onChange={(e) => setSecondaryColor(e.target.value)}
          />
        </div>

        <Button type="submit">Update Brand Kit</Button>
      </form>

      <section className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Current Brand Assets</h2>
        <Table>
          <TableCaption>Your brand assets.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Asset</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Logo</TableCell>
              <TableCell>
                {logo ? (
                  <img
                    src={URL.createObjectURL(logo) || "/placeholder.svg"}
                    alt="Logo Preview"
                    className="h-10 w-auto"
                  />
                ) : (
                  "No logo uploaded"
                )}
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Primary Color</TableCell>
              <TableCell>{primaryColor || "Not set"}</TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-medium">Secondary Color</TableCell>
              <TableCell>{secondaryColor || "Not set"}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </section>
    </div>
  )
}
