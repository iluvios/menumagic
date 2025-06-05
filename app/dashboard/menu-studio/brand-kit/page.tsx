"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, ImageIcon, Trash2, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import {
  getBrandKit,
  updateBrandKit,
  createBrandAssetRecord, // New import
  deleteBrandAssetRecord, // New import
  type BrandAsset, // Import the type
} from "@/lib/actions/brand-kit-actions"

interface BrandKitData {
  id?: number
  logo_url?: string | null // Allow null
  primary_color_hex?: string
  secondary_colors_json_array?: string[]
  font_family_main?: string
  font_family_secondary?: string
}

export default function BrandKitPage() {
  const { toast } = useToast()
  const [brandKit, setBrandKit] = useState<BrandKitData | null>(null) // Initialize as null
  const [brandAssets, setBrandAssets] = useState<BrandAsset[]>([])
  const [newLogoFile, setNewLogoFile] = useState<File | null>(null)
  const [newAssetFile, setNewAssetFile] = useState<File | null>(null) // For general assets

  useEffect(() => {
    fetchBrandKitData()
  }, [])

  const fetchBrandKitData = async () => {
    const { brandKit: fetchedBrandKit, assets: fetchedAssets } = await getBrandKit()
    setBrandKit(fetchedBrandKit || null)
    setBrandAssets(fetchedAssets || [])
  }

  const handleBrandKitUpdate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!brandKit?.id) {
      toast({
        title: "Error",
        description: "No brand kit found to update. Please create one first.",
        variant: "destructive",
      })
      return
    }

    const formData = new FormData(event.currentTarget)
    const primary_color_hex = formData.get("primary_color_hex") as string
    const font_family_main = formData.get("font_family_main") as string
    const font_family_secondary = formData.get("font_family_secondary") as string

    const dataToUpdate: BrandKitData = {
      primary_color_hex,
      font_family_main,
      font_family_secondary,
    }

    // Handle logo file separately if it changed
    let logoFileToPass: File | null | undefined = undefined // undefined means no change, null means remove
    if (newLogoFile) {
      logoFileToPass = newLogoFile
    } else if (newLogoFile === null && brandKit.logo_url !== null) {
      // User explicitly cleared the logo input, and there was an existing logo
      logoFileToPass = null
    }

    const result = await updateBrandKit(brandKit.id, dataToUpdate, logoFileToPass) // Pass newLogoFile
    if (result.success) {
      toast({ title: "Kit de Marca Actualizado", description: "Los ajustes de tu marca han sido guardados." })
      setNewLogoFile(null) // Clear the file input state after successful upload
      fetchBrandKitData()
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const handleLogoFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    setNewLogoFile(file || null)
    if (file) {
      // For immediate preview
      setBrandKit((prev) => ({ ...prev!, logo_url: URL.createObjectURL(file) }))
    } else {
      // If file input is cleared, clear preview
      setBrandKit((prev) => ({ ...prev!, logo_url: null }))
    }
  }

  const handleGeneralAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setNewAssetFile(file)
      const result = await createBrandAssetRecord(file, "image") // Assuming 'image' type for now
      if (result.success) {
        toast({ title: "Activo Subido", description: "Tu nuevo activo ha sido cargado exitosamente." })
        setNewAssetFile(null) // Clear the file input state
        fetchBrandKitData()
      } else {
        toast({ title: "Error", description: result.error, variant: "destructive" })
      }
    }
  }

  const handleDeleteAsset = async (assetId: number) => {
    if (confirm("¿Estás seguro de que quieres eliminar este activo?")) {
      const result = await deleteBrandAssetRecord(assetId) // Use new action
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
        {/* This button should trigger the form submission for the main brand kit settings */}
        <Button type="submit" form="brand-kit-form" className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
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
                {newLogoFile || brandKit?.logo_url ? ( // Check newLogoFile first for immediate preview
                  <img
                    src={newLogoFile ? URL.createObjectURL(newLogoFile) : brandKit?.logo_url || "/placeholder.svg"}
                    alt="Restaurant Logo"
                    className="mx-auto h-24 w-auto object-contain mb-3 rounded"
                  />
                ) : (
                  <ImageIcon className="mx-auto h-12 w-12 text-neutral-400 mb-3" />
                )}
                <p className="text-sm text-neutral-600 mb-3">Sube el logo de tu restaurante (PNG, JPG, SVG)</p>
                <Input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoFileInputChange}
                />
                <Label
                  htmlFor="logoUpload"
                  className="inline-flex items-center px-4 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 cursor-pointer"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Subir Logo
                </Label>
                {brandKit?.logo_url && ( // Option to remove existing logo
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 text-red-500 hover:text-red-600"
                    onClick={() => {
                      setNewLogoFile(null) // Indicate no new file
                      setBrandKit((prev) => ({ ...prev!, logo_url: null })) // Clear preview
                      // The actual DB update happens on form submit
                    }}
                  >
                    <Trash2 className="mr-1 h-4 w-4" /> Quitar Logo
                  </Button>
                )}
              </div>
            </div>

            <form id="brand-kit-form" onSubmit={handleBrandKitUpdate} className="space-y-4">
              <div>
                <Label htmlFor="primaryColor" className="block text-neutral-700 font-medium mb-2">
                  Color Principal
                </Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="primaryColor"
                    name="primary_color_hex"
                    type="color"
                    defaultValue={brandKit?.primary_color_hex || "#F59E0B"}
                    className="w-12 h-10 p-1 border border-neutral-300 rounded-md"
                  />
                  <Input
                    type="text"
                    defaultValue={brandKit?.primary_color_hex || "#F59E0B"}
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
                  defaultValue={brandKit?.font_family_main || "Inter"}
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
                  defaultValue={brandKit?.font_family_secondary || "Lora"}
                  placeholder="Ej: Lora, Playfair Display"
                  className="border border-neutral-300 rounded-md px-3 py-2"
                />
              </div>
              {/* Removed the individual submit button here as it's now at the top */}
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
              <Input
                id="assetUpload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleGeneralAssetUpload}
              />
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
