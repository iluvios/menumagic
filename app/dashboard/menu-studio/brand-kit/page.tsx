"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { getBrandKit, updateBrandKit, createBrandKit } from "@/lib/actions/brand-kit-actions"

interface BrandKit {
  id: number
  restaurant_id: number
  logo_url?: string
  primary_color_hex?: string
  secondary_colors_json_array?: string[]
  font_family_main?: string
  font_family_secondary?: string
}

export default function BrandKitPage() {
  const { toast } = useToast()
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  // Form state
  const [primaryColor, setPrimaryColor] = useState("#ff6b35")
  const [fontMain, setFontMain] = useState("Inter")
  const [fontSecondary, setFontSecondary] = useState("Inter")

  useEffect(() => {
    fetchBrandKit()
  }, [])

  const fetchBrandKit = async () => {
    try {
      setIsLoading(true)
      const result = await getBrandKit()
      if (result.brandKit) {
        setBrandKit(result.brandKit)
        setPrimaryColor(result.brandKit.primary_color_hex || "#ff6b35")
        setFontMain(result.brandKit.font_family_main || "Inter")
        setFontSecondary(result.brandKit.font_family_secondary || "Inter")
      }
    } catch (error) {
      console.error("Error fetching brand kit:", error)
      toast({
        title: "Error",
        description: "Failed to load brand kit settings.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)

      const data = {
        primary_color_hex: primaryColor,
        font_family_main: fontMain,
        font_family_secondary: fontSecondary,
        secondary_colors_json_array: [],
      }

      if (brandKit) {
        await updateBrandKit(brandKit.id, data)
        toast({
          title: "Success",
          description: "Brand kit updated successfully.",
        })
      } else {
        await createBrandKit(data)
        toast({
          title: "Success",
          description: "Brand kit created successfully.",
        })
        // Refresh to get the new brand kit
        await fetchBrandKit()
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save brand kit.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading brand kit...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Brand Kit</h1>
        <p className="text-muted-foreground">Customize your restaurant's brand identity and visual elements.</p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Colors</CardTitle>
            <CardDescription>Define your brand's color palette</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10"
                />
                <Input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#ff6b35"
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Typography</CardTitle>
            <CardDescription>Choose fonts for your brand</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="font-main">Main Font</Label>
              <Input
                id="font-main"
                value={fontMain}
                onChange={(e) => setFontMain(e.target.value)}
                placeholder="Inter"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="font-secondary">Secondary Font</Label>
              <Input
                id="font-secondary"
                value={fontSecondary}
                onChange={(e) => setFontSecondary(e.target.value)}
                placeholder="Inter"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Logo Upload</CardTitle>
            <CardDescription>Upload functionality temporarily disabled for debugging</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="p-8 border-2 border-dashed border-gray-300 rounded-lg text-center">
              <p className="text-gray-500">Logo upload temporarily disabled</p>
              <p className="text-sm text-gray-400 mt-2">We're working on fixing upload issues</p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Brand Kit"}
          </Button>
        </div>
      </div>
    </div>
  )
}
