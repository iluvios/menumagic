import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Globe, LayoutTemplate, BookIcon as Publish } from "lucide-react"

export default function WebsiteBuilderPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Instant Website Builder</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Elegir Plantilla Web
        </Button>
      </div>

      <p className="text-neutral-600">
        Crea una presencia online simple, atractiva e informativa para tu restaurante en minutos.
      </p>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-800">Plantillas de Sitio Web</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-neutral-500">
            <Globe className="mx-auto h-12 w-12 mb-3" />
            <p>¡Pon tu restaurante online!</p>
            <p>Elige una plantilla, añade tu información y lanza tu sitio web en minutos.</p>
            <Button variant="outline" className="mt-4">
              Explorar Plantillas
            </Button>
          </div>
          {/* Placeholder for website template gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4 text-center bg-neutral-50">
              <img src="/placeholder.svg?height=150&width=200" alt="Modern Template" className="mx-auto mb-2 rounded" />
              <h3 className="font-medium text-neutral-800">Plantilla Moderna</h3>
              <Button variant="secondary" size="sm" className="mt-2">
                Seleccionar
              </Button>
            </div>
            <div className="border border-neutral-200 rounded-lg p-4 text-center bg-neutral-50">
              <img
                src="/placeholder.svg?height=150&width=200"
                alt="Classic Template"
                className="mx-auto mb-2 rounded"
              />
              <h3 className="font-medium text-neutral-800">Plantilla Clásica</h3>
              <Button variant="secondary" size="sm" className="mt-2">
                Seleccionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl font-semibold text-neutral-800">Tu Sitio Web Actual</CardTitle>
          <Button variant="outline" size="sm">
            <Publish className="mr-2 h-4 w-4" />
            Publicar Cambios
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-neutral-500">
            <Globe className="mx-auto h-12 w-12 mb-3" />
            <p>No hay un sitio web configurado aún.</p>
            <p>Elige una plantilla para empezar a construir tu presencia online.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
