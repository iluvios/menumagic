"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { getBrandKit, updateBrandKit, uploadBrandAsset, deleteBrandAsset } from "@/lib/actions/brand-kit-actions"

interface BrandKitData {
  id?: number
  logo_url?: string
  primary_color_hex?: string
  secondary_colors_json_array?: string[]
  font_family_main?: string
  font_family_secondary?: string
}

interface BrandAsset {
  id: number
  asset_name: string
  asset_url: string
  asset_type: string
}

export default function BrandKitPage() {
  const { toast } = useToast()
  const [brandKit, setBrandKit] = useState<BrandKitData>({})
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)

  useEffect(() => {
    fetchBrandKitData()
  }, [])

  const fetchBrandKitData = async () => {
    const data = await getBrandKit()
    if (data) {
      setBrandKit(data.brandKit)
      setBrandAssets(data.assets)
    }
  }

  const handleBrandKitUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const formData = new FormData(event.currentTarget)
    const primary_color_hex = formData.get("primary_color_hex") as string
    const font_family_main = formData.get("font_family_main") as string
    const font_family_secondary = formData.get("font_family_secondary") as string

    const dataToUpdate: BrandKitData = {
      primary_color_hex,
      font_family_main,
      font_family_secondary,
    }

    const result = await updateBrandKit(brandKit.id, dataToUpdate)
    if (result.success) {
      toast({ title: "Kit de Marca Actualizado", description: "Los ajustes de tu marca han sido guardados." })
      fetchBrandKitData()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewLogoFile(file)
      // In a real app, you'd upload this to a storage service (e.g., Vercel Blob)
      // For now, we'll simulate and use a placeholder or a direct URL if available.
      const simulatedUrl = URL.createObjectURL(file) // For immediate preview
      setBrandKit((prev) => ({ ...prev, logo_url: simulatedUrl }))

      // Simulate actual upload and update DB
      const result = await uploadBrandAsset(brandKit.id, {
        asset_name: file.name,
        asset_type: "image",
        asset_url: `/placeholder.svg?height=100&width=100&query=logo`, // Replace with actual blob URL
      })
      if (result.success) {
        toast({ title: "Logo Subido", description: "Tu nuevo logo ha sido cargado exitosamente." })
        fetchBrandKitData()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    }
  }

  const handleDeleteAsset = async (assetId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este activo?")) {
      const result = await deleteBrandAsset(assetId)
      if (result.success) {
        toast({ title: "Activo Eliminado", description: "El activo de marca ha sido eliminado." })
        fetchBrandKitData()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Brand Kit</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Save className="mr-2 h-4 w-4" />
          Guardar Cambios
        </Button>
      </div>

      <p className="text-neutral-600">
        Centraliza y gestiona los activos de tu marca para una consistencia visual en toda la plataforma.
      </p>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-neutral-800">Logo y Colores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="logoUpload" className="block text-neutral-700 font-medium mb-2">
                Logo del Restaurante
              </Label>
              <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center bg-neutral-50">
                {brandKit.logo_url ? (
                  <img
                    src={brandKit.logo_url || "/placeholder.svg"}
                    alt="Restaurant Logo"
                    className="mx-auto h-24 w-auto object-contain mb-3 rounded"
                  />
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                )}
                <p className="text-sm text-neutral-600 mb-3">Sube el logo de tu restaurante (PNG, JPG, SVG)</p>
                <Input id="logoUpload" type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                <Label
                  htmlFor="logoUpload"
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Logo
                </Label>
              </div>
            </div>

            <form onSubmit={handleBrandKitUpdate} className="space-y-4">
              <div>
                <Label htmlFor="primaryColor" className="block text-neutral-700 font-medium mb-2">
                  Color Principal
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    name="primary_color_hex"
                    type="color"
                    defaultValue={brandKit.primary_color_hex || "#F59E0B"}
                    className="w-12 h-10 p-1 border border-neutral-300 rounded-md"
                  />
                  <Input
                    type="text"
                    defaultValue={brandKit.primary_color_hex || "#F59E0B"}
                    className="flex-1 border border-neutral-300 rounded-md px-3 py-2"
                  />
                </div>
              </div>
              {/* Secondary colors can be added here, potentially as a JSON array input or multiple color pickers */}
              <div>
                <Label htmlFor="fontMain" className="block text-neutral-700 font-medium mb-2">
                  Fuente Principal
                </Label>
                <Input
                  id="fontMain"
                  name="font_family_main"
                  defaultValue={brandKit.font_family_main || "Inter"}
                  placeholder="Ej: Inter, Roboto"
                  className="border border-neutral-300 rounded-md px-3 py-2"
                />
              </div>
              <div>
                <Label htmlFor="fontSecondary" className="block text-neutral-700 font-medium mb-2">
                  Fuente Secundaria
                </Label>
                <Input
                  id="fontSecondary"
                  name="font_family_secondary"
                  defaultValue={brandKit.font_family_secondary || "Lora"}
                  placeholder="Ej: Lora, Playfair Display"
                  className="border border-neutral-300 rounded-md px-3 py-2"
                />
              </div>
              <Button type="submit" className="w-full bg-warm-500 hover:bg-warm-600 text-white shadow-md">
                <Save className="mr-2 h-4 w-4" />
                Guardar Colores y Fuentes
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-neutral-800">Librería de Activos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center bg-neutral-50">
              <ImageIcon className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
              <p className="text-sm text-neutral-600 mb-3">Sube imágenes para usar en tu sitio web y menús.</p>
              <Input id="assetUpload" type="file" accept="image/*" className="hidden" />
              <Label
                htmlFor="assetUpload"
                className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer"
              >
                <Upload className="mr-2 h-4 w-4" />
                Subir Activo
              </Label>
            </div>

            {brandAssets.length === 0 ? (
              <div className="text-center py-8 text-neutral-500">
                <ImageIcon className="mx-auto h-12 w-12 mb-3" />
                <p>No hay activos en tu librería aún.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                {brandAssets.map((asset) => (
                  <div key={asset.id} className="relative group border border-neutral-200 rounded-lg overflow-hidden">
                    <img
                      src={asset.asset_url || "/placeholder.svg"}
                      alt={asset.asset_name}
                      className="w-full h-32 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="destructive" size="icon" onClick={() => handleDeleteAsset(asset.id)}>
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    </div>
                    <p className="p-2 text-sm font-medium text-neutral-800 truncate">{asset.asset_name}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
