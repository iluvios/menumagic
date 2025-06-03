import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BookText, Printer, Globe, Palette, Upload } from "lucide-react"

export default function MenuStudioPage() {
  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Menu Studio</h1>
        <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md">
          <Upload className="mr-2 h-4 w-4" />
          Subir Menú con IA
        </Button>
      </div>

      <p className="text-neutral-600">
        Crea, gestiona y personaliza tus menús digitales y físicos, y establece la presencia online de tu restaurante.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/menu-studio/digital-menu">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Digital Menu Hub
              </CardTitle>
              <BookText className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Crea menús interactivos accesibles vía QR.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/menu-studio/print-designer">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Print Menu Designer
              </CardTitle>
              <Printer className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Diseña menús físicos profesionales y listos para imprimir.</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/menu-studio/website-builder">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Instant Website Builder
              </CardTitle>
              <Globe className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">
                Crea una presencia online simple y atractiva para tu restaurante.
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/dashboard/menu-studio/brand-kit">
          <Card className="shadow-lg border-neutral-200 hover:border-warm-300 transition-all duration-200 cursor-pointer group">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-semibold text-neutral-800 group-hover:text-warm-600">
                Brand Kit
              </CardTitle>
              <Palette className="h-6 w-6 text-neutral-400 group-hover:text-warm-500" />
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600">Centraliza y gestiona los activos de tu marca.</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mt-8">Menús Digitales Recientes</h2>
      <Card className="shadow-lg border-none">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Menú Principal - Activo</span>
              <Link href="/dashboard/menu-studio/digital-menu/1">
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-between text-neutral-700">
              <span className="font-medium">Menú de Bebidas - Borrador</span>
              <Link href="/dashboard/menu-studio/digital-menu/2">
                <Button variant="outline" size="sm">
                  Editar
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
