"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Plus, QrCode, ImageIcon, XCircle, ChefHat, Package, Edit, Trash2 } from "lucide-react"
import { formatCurrency } from "@/lib/utils/formatters"

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
}

type AiOnboardingStep = "idle" | "upload" | "processing" | "review" | "complete"

interface MenuItemsListProps {
  selectedMenu: DigitalMenu | null
  menuItems: MenuItem[]
  aiOnboardingStep: AiOnboardingStep
  onOpenMenuItemDialog: (item?: MenuItem) => void
  onDeleteMenuItem: (id: number) => void
}

export function MenuItemsList({
  selectedMenu,
  menuItems,
  aiOnboardingStep,
  onOpenMenuItemDialog,
  onDeleteMenuItem,
}: MenuItemsListProps) {
  return (
    <Card className="shadow-lg border-neutral-200">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <div>
          <CardTitle className="text-xl font-semibold text-neutral-800">
            {selectedMenu ? `Elementos de: ${selectedMenu.name}` : "Selecciona un Menú para ver sus Elementos"}
          </CardTitle>
          {selectedMenu && <CardDescription>Añade, edita o elimina platillos y bebidas.</CardDescription>}
        </div>
        {selectedMenu && (
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" className="hidden sm:flex">
              <QrCode className="mr-2 h-4 w-4" />
              Generar QR
            </Button>
            <Button
              className="bg-warm-500 hover:bg-warm-600 text-white shadow-md"
              onClick={() => onOpenMenuItemDialog()}
            >
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Elemento
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-3 max-h-[60vh] overflow-y-auto">
        {!selectedMenu ? (
          <div className="text-center py-12 text-neutral-500">
            <ImageIcon className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
            <p className="text-lg">Selecciona un menú de la izquierda.</p>
            <p className="text-sm">O crea uno nuevo para empezar a añadir platillos.</p>
          </div>
        ) : menuItems.length === 0 && aiOnboardingStep !== "review" ? (
          <div className="text-center py-12 text-neutral-500">
            <XCircle className="mx-auto h-16 w-16 mb-4 text-neutral-400" />
            <p className="text-lg">Este menú no tiene elementos aún.</p>
            <p className="text-sm">Usa la "Carga Rápida con IA" o añade elementos manualmente.</p>
          </div>
        ) : (
          <TooltipProvider>
            {menuItems.map((item) => (
              <Card
                key={item.id}
                className="flex items-center justify-between p-3 shadow-sm hover:shadow-md transition-shadow bg-white"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={
                      item.image_url ||
                      `/placeholder.svg?height=64&width=64&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                    }
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md border border-neutral-200"
                  />
                  <div>
                    <h3 className="font-medium text-neutral-800">{item.name}</h3>
                    <p className="text-xs text-neutral-500 max-w-xs truncate" title={item.description}>
                      {item.description || "Sin descripción"}
                    </p>
                    <p className="text-xs text-neutral-500">{item.category_name || "Sin categoría"}</p>
                    <div className="flex items-center space-x-1 mt-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <ChefHat className="h-3 w-3 text-green-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Vinculado a Receta (para costos)</p>
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Package className="h-3 w-3 text-blue-500 cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p>Control de Inventario Activo</p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-neutral-900 text-sm">{formatCurrency(item.price)}</span>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onOpenMenuItemDialog(item)}
                      >
                        <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar Elemento</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDeleteMenuItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar Elemento</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </Card>
            ))}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
