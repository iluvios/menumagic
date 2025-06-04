"use client"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Edit, Trash2, FileText, UtensilsCrossed } from "lucide-react"

interface DigitalMenu {
  id: number
  name: string
  status: string
}

interface DigitalMenusListProps {
  menus: DigitalMenu[]
  selectedMenu: DigitalMenu | null
  onSelectMenu: (menu: DigitalMenu) => void
  onEditMenu: (menu: DigitalMenu) => void
  onDeleteMenu: (id: number) => void
}

export function DigitalMenusList({
  menus,
  selectedMenu,
  onSelectMenu,
  onEditMenu,
  onDeleteMenu,
}: DigitalMenusListProps) {
  return (
    <Card className="shadow-lg border-neutral-200 md:col-span-1">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-neutral-800">Tus Menús</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[60vh] overflow-y-auto">
        {menus.length === 0 ? (
          <div className="text-center py-8 text-neutral-500">
            <FileText className="mx-auto h-12 w-12 mb-3 text-neutral-400" />
            <p>No hay menús digitales aún.</p>
            <p className="text-sm">Crea uno para empezar.</p>
          </div>
        ) : (
          <TooltipProvider>
            {menus.map((menu) => (
              <div
                key={menu.id}
                className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 ease-in-out
                            ${selectedMenu?.id === menu.id ? "bg-warm-100 border-warm-400 shadow-md ring-2 ring-warm-400" : "hover:bg-neutral-100 border-transparent border"}`}
                onClick={() => onSelectMenu(menu)}
              >
                <div>
                  <h3 className={`font-medium ${selectedMenu?.id === menu.id ? "text-warm-700" : "text-neutral-800"}`}>
                    {menu.name}
                  </h3>
                  <p className={`text-xs ${selectedMenu?.id === menu.id ? "text-warm-600" : "text-neutral-500"}`}>
                    {menu.status === "active" ? "Activo" : "Borrador"}
                  </p>
                </div>
                <div className="flex items-center space-x-1">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEditMenu(menu)
                        }}
                      >
                        <Edit className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Editar Menú</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteMenu(menu.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500 hover:text-red-600" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Eliminar Menú</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Link href={`/dashboard/menus/dishes/${menu.id}`} passHref>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <UtensilsCrossed className="h-4 w-4 text-neutral-500 hover:text-warm-600" />
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Gestionar Platillos</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </TooltipProvider>
        )}
      </CardContent>
    </Card>
  )
}
