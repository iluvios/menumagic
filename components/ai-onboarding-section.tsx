"use client"

import type React from "react" // Explicitly import React
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { UploadCloud, Wand2, SkipForward, CheckCircle2, Edit } from "lucide-react" // Ensure all Lucide icons are imported
import { formatCurrency } from "@/lib/utils/formatters" // Assuming this utility is available

interface DigitalMenu {
  id: number
  name: string
  status: string
}

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name?: string
  ai_extracted?: boolean
}

type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

interface AiOnboardingSectionProps {
  selectedMenu: DigitalMenu | null
  aiOnboardingStep: AiOnboardingStep
  setAiOnboardingStep: React.Dispatch<React.SetStateAction<AiOnboardingStep>>
  aiMenuFile: File | null
  setAiMenuFile: React.Dispatch<React.SetStateAction<File | null>>
  aiProcessingProgress: number
  startAiProcessing: () => Promise<void>
  aiExtractedItems: MenuItem[]
  handleAcceptAiItem: (item: MenuItem) => Promise<void>
  handleAcceptAllAiItems: () => Promise<void>
  handleOpenMenuItemDialog: (item?: MenuItem) => void
}

export function AiOnboardingSection({
  selectedMenu,
  aiOnboardingStep,
  setAiOnboardingStep,
  aiMenuFile,
  setAiMenuFile,
  aiProcessingProgress,
  startAiProcessing,
  aiExtractedItems,
  handleAcceptAiItem,
  handleAcceptAllAiItems,
  handleOpenMenuItemDialog,
}: AiOnboardingSectionProps) {
  if (!selectedMenu)
    return (
      <Card className="mt-6 bg-neutral-50 border-neutral-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-neutral-700">Carga Rápida con IA</CardTitle>
          <CardDescription className="text-neutral-500">
            Selecciona o crea un menú digital primero para activar la carga con IA.
          </CardDescription>
        </CardHeader>
      </Card>
    )

  switch (aiOnboardingStep) {
    case "idle":
      return (
        <Card className="mt-6 bg-gradient-to-br from-warm-50 to-amber-100 border-warm-200 shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-warm-700 flex items-center">
              <Wand2 className="mr-2 h-6 w-6 text-warm-500" />
              Carga Rápida con IA para "{selectedMenu.name}"
            </CardTitle>
            <CardDescription className="text-warm-600">
              ¿Tienes tu menú en un archivo? Súbelo y deja que nuestra IA extraiga los platillos por ti.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button
              onClick={() => setAiOnboardingStep("upload")}
              className="bg-warm-500 hover:bg-warm-600 text-white shadow-md"
            >
              <UploadCloud className="mr-2 h-5 w-5" /> Iniciar Carga con IA
            </Button>
            <p className="text-sm text-neutral-500 mt-3">o</p>
            <Button
              variant="link"
              onClick={() => handleOpenMenuItemDialog()}
              className="text-warm-600 hover:text-warm-700"
            >
              Añadir elementos manualmente
            </Button>
          </CardContent>
        </Card>
      )
    case "upload":
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Paso 1: Sube tu Menú</CardTitle>
            <CardDescription>Sube una imagen (JPG, PNG) o PDF de tu menú actual.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              onChange={(e) => setAiMenuFile(e.target.files?.[0] || null)}
              className="border-neutral-300 focus:border-warm-500 focus:ring-warm-500"
            />
            {aiMenuFile && <p className="text-sm text-neutral-600">Archivo seleccionado: {aiMenuFile.name}</p>}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={() => setAiOnboardingStep("idle")}>
              Cancelar
            </Button>
            <Button
              onClick={startAiProcessing}
              disabled={!aiMenuFile}
              className="bg-warm-500 hover:bg-warm-600 text-white"
            >
              <Wand2 className="mr-2 h-4 w-4" /> Procesar con IA
            </Button>
          </CardFooter>
        </Card>
      )
    case "processing":
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Paso 2: Procesando con IA...</CardTitle>
            <CardDescription>Nuestra IA está analizando tu menú. Esto puede tomar unos momentos.</CardDescription>
          </CardHeader>
          <CardContent className="py-8 text-center">
            <Progress value={aiProcessingProgress} className="w-full [&>div]:bg-warm-500" />
            <p className="mt-3 text-sm text-neutral-600">{aiProcessingProgress}% completado</p>
          </CardContent>
        </Card>
      )
    case "review":
      return (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Paso 3: Revisa los Elementos Extraídos</CardTitle>
            <CardDescription>
              Hemos extraído estos elementos de tu menú. Confirma o edita antes de añadirlos.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 max-h-96 overflow-y-auto">
            {aiExtractedItems.length === 0 && <p>No se pudieron extraer elementos o ya fueron procesados.</p>}
            {aiExtractedItems.map((item, index) => (
              <Card key={index} className="p-3 bg-neutral-50 border-neutral-200">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-neutral-800">{item.name}</p>
                    <p className="text-sm text-neutral-600">{item.description}</p>
                    <p className="text-sm text-warm-600 font-medium">{formatCurrency(item.price)}</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        handleOpenMenuItemDialog({ ...item, id: 0 }) // Open edit dialog, treat as new
                        // Note: This removes the item from the review list immediately.
                        // Consider if you want to keep it until it's actually saved.
                        // For now, this matches the original logic.
                        // setAiExtractedItems((prev) => prev.filter((_, i) => i !== index))
                      }}
                    >
                      <Edit className="h-3 w-3 mr-1" /> Editar y Añadir
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-500 hover:bg-green-600 text-white"
                      onClick={() => handleAcceptAiItem(item)}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" /> Añadir
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
          <CardFooter className="flex justify-between items-center mt-4">
            <Button variant="outline" onClick={() => setAiOnboardingStep("upload")}>
              Subir Otro
            </Button>
            {aiExtractedItems.length > 0 && (
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleAcceptAllAiItems}>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Añadir Todos los {aiExtractedItems.length} Restantes
              </Button>
            )}
            <Button
              onClick={() => setAiOnboardingStep("complete")}
              className="bg-warm-500 hover:bg-warm-600 text-white"
            >
              <SkipForward className="mr-2 h-4 w-4" /> Finalizar Revisión
            </Button>
          </CardFooter>
        </Card>
      )
    case "complete":
      return (
        <Card className="mt-6 bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-700 flex items-center">
              <CheckCircle2 className="mr-2 h-6 w-6" />
              ¡Carga con IA Completada!
            </CardTitle>
            <CardDescription className="text-green-600">
              Los elementos seleccionados han sido añadidos a "{selectedMenu?.name}". Puedes continuar añadiendo
              manualmente o subir otro menú.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex space-x-3">
            <Button onClick={() => setAiOnboardingStep("upload")} variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" /> Subir Otro Menú
            </Button>
            <Button onClick={() => setAiOnboardingStep("idle")} className="bg-warm-500 hover:bg-warm-600 text-white">
              Volver al Inicio del Hub
            </Button>
          </CardContent>
        </Card>
      )
  }
}
