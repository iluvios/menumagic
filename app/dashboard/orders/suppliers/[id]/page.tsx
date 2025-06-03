import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, ArrowUpDown, Upload, MoreHorizontal } from "lucide-react"
import { getSupplierById } from "@/lib/actions/supplier-actions"

export default async function SupplierDetailPage({ params }: { params: { id: string } }) {
  const supplier = await getSupplierById(Number.parseInt(params.id))

  if (!supplier) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-gray-500">Proveedor no encontrado</p>
            <Button className="mt-4">Volver a proveedores</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{supplier.name}</h1>
          <Badge variant="outline" className="mt-1">
            Verificado
          </Badge>
        </div>
        <Button>Crear Pedido</Button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Razón social</div>
                  <div>{supplier.business_name || "Razón social"}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Identificación</div>
                  <div>{supplier.tax_id || "0000.0000"}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Correo Electrónico</div>
                  <div>{supplier.email}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Phone Number</div>
                  <div>{supplier.phone}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Dirección</div>
                  <div>{supplier.address}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Pedidos Totales</div>
                  <div>{supplier.total_orders || 0}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-6">
                <div>
                  <div className="text-sm text-gray-500 mb-1">Total Facturado</div>
                  <div className="text-xl font-medium">${supplier.total_invoiced || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Pendiente Pagar</div>
                  <div className="text-xl font-medium">${supplier.pending_payment || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Pedidos Activos</div>
                  <div className="text-xl font-medium">{supplier.active_orders || 0}</div>
                </div>

                <div>
                  <div className="text-sm text-gray-500 mb-1">Crédito</div>
                  <div className="text-xl font-medium">${supplier.credit || 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="products" className="mt-6">
            <TabsList>
              <TabsTrigger value="products">Productos Disponibles</TabsTrigger>
              <TabsTrigger value="invoices">Facturas</TabsTrigger>
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

            <TabsContent value="products" className="mt-4">
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="text-xs uppercase bg-gray-50">
                        <tr>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3">Producto</th>
                          <th className="px-4 py-3">Categoría</th>
                          <th className="px-4 py-3">Cantidad</th>
                          <th className="px-4 py-3">Costo/U. medida</th>
                          <th className="px-4 py-3">Costo Total</th>
                          <th className="px-4 py-3">Variación Costo</th>
                          <th className="px-4 py-3"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplier.products?.length === 0 ? (
                          <tr>
                            <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                              No hay productos disponibles
                            </td>
                          </tr>
                        ) : (
                          Array.from({ length: 8 }).map((_, index) => (
                            <tr key={index} className="bg-white border-b hover:bg-gray-50">
                              <td className="px-4 py-3">ABC{index}00</td>
                              <td className="px-4 py-3 font-medium">Nombre</td>
                              <td className="px-4 py-3">Categoría</td>
                              <td className="px-4 py-3">000.000kg</td>
                              <td className="px-4 py-3">$000.000/Kg</td>
                              <td className="px-4 py-3">$000.000</td>
                              <td className="px-4 py-3">000.000%</td>
                              <td className="px-4 py-3">
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="mb-4">
                <h3 className="font-medium mb-4">Documentos</h3>

                <Button variant="outline" className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Subir Documento
                </Button>
              </div>

              <div className="space-y-3 mt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Rut</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Certificación Bancaria</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Cedula Representante legal</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Camara y Comercio</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium">Facturas</div>
                  </div>
                  <Button variant="ghost" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
