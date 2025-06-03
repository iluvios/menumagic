import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Printer, LayoutTemplate, Download } from "lucide-react"

export default function PrintMenuDesignerPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Print Menu Designer</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <LayoutTemplate className="mr-2 h-4 w-4" />
          Elegir Plantilla
        </Button>
      </div>

      <p className="text-neutral-600">
        Diseña menús físicos profesionales y listos para imprimir utilizando tus datos de menú digital y tu kit de
        marca.
      </p>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-800">Plantillas de Menú</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-neutral-500">
            <Printer className="mx-auto h-12 w-12 mb-3" />
            <p>¡Diseña hermosos menús impresos en minutos!</p>
            <p>Elige una plantilla y la rellenaremos con tus platillos.</p>
            <Button variant="outline" className="mt-4">
              Explorar Plantillas
            </Button>
          </div>
          {/* Placeholder for template gallery */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="border border-neutral-200 rounded-lg p-4 text-center bg-neutral-50">
              <img src="/placeholder.svg?height=150&width=200" alt="Bifold Template" className="mx-auto mb-2 rounded" />
              <h3 className="font-medium text-neutral-800">Plantilla Díptico</h3>
              <Button variant="secondary" size="sm" className="mt-2">
                Seleccionar
              </Button>
            </div>
            <div className="border border-neutral-200 rounded-lg p-4 text-center bg-neutral-50">
              <img
                src="/placeholder.svg?height=150&width=200"
                alt="Single Page Template"
                className="mx-auto mb-2 rounded"
              />
              <h3 className="font-medium text-neutral-800">Plantilla Página Única</h3>
              <Button variant="secondary" size="sm" className="mt-2">
                Seleccionar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-neutral-200">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-neutral-800">Menús Impresos Guardados</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8 text-neutral-500">
            <Download className="mx-auto h-12 w-12 mb-3" />
            <p>No hay diseños de menú impresos guardados aún.</p>
            <p>Crea uno nuevo para que aparezca aquí.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
