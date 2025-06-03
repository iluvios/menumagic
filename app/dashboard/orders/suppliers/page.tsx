import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, ArrowUpDown, User } from "lucide-react"
import { getSuppliers } from "@/lib/actions/supplier-actions"

export default async function SuppliersPage() {
  const suppliers = await getSuppliers()

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Proveedores</h1>
          <p className="text-sm text-gray-500">Gestiona tus proveedores y sus productos</p>
        </div>
        <Button>Nuevo Proveedor</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Proveedores</TabsTrigger>
          <TabsTrigger value="invoicing">Facturación</TabsTrigger>
        </TabsList>

        <div className="mt-4 flex items-center space-x-4">
          <Button variant="outline" size="icon">
            <ArrowUpDown className="h-4 w-4" />
          </Button>

          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input placeholder="Buscar" className="pl-10 w-full" />
          </div>
        </div>

        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {suppliers.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">No hay proveedores disponibles</p>
                  <Button className="mt-4">Agregar primer proveedor</Button>
                </CardContent>
              </Card>
            ) : (
              suppliers.map((supplier, index) => (
                <Card key={index} className="overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start mb-4">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <h3 className="font-medium">{supplier.name}</h3>
                        <div className="text-xs text-gray-500">Categoría</div>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-sm text-gray-500">{supplier.email}</div>
                      <div className="text-sm text-gray-500">{supplier.phone}</div>
                      <div className="text-sm text-gray-500">{supplier.address}</div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="text-sm font-medium mb-2">Pedidos</div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">Pendientes</div>
                          <div className="text-xs font-medium">{supplier.pending_orders || 0}</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-gray-800 h-1 rounded-full" style={{ width: "60%" }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">Entregados</div>
                          <div className="text-xs font-medium">{supplier.delivered_orders || 0}</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-gray-800 h-1 rounded-full" style={{ width: "80%" }}></div>
                        </div>

                        <div className="flex justify-between items-center">
                          <div className="text-xs text-gray-500">Cancelados</div>
                          <div className="text-xs font-medium">{supplier.cancelled_orders || 0}</div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1">
                          <div className="bg-gray-800 h-1 rounded-full" style={{ width: "20%" }}></div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="text-sm font-medium mb-2">Top Productos</div>

                      <div className="space-y-2">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="flex justify-between items-center">
                            <div className="text-xs">Producto {i}</div>
                            <div className="text-xs text-gray-500">000</div>
                            <div className="text-xs text-gray-500">$000.000</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 border-t pt-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-gray-500">Total</div>
                          <div className="font-medium">${supplier.total_invoiced || 0}</div>
                        </div>
                        <div>
                          <div className="text-xs text-gray-500">Pendiente Pago</div>
                          <div className="font-medium">${supplier.pending_payment || 0}</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
