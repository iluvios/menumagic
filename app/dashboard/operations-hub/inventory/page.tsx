"use client"

import { DialogDescription } from "@/components/ui/dialog"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Search, Filter, AlertTriangle, CheckCircle } from "lucide-react"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { getInventoryLevels, createInventoryAdjustment, getInventoryHistory } from "@/lib/actions/inventory-actions"
import { getIngredients } from "@/lib/actions/ingredient-actions" // To select ingredient for adjustment
import { formatCurrency } from "@/lib/db"
import { cn } from "@/lib/utils"

interface InventoryItem {
  ingredient_id: number
  ingredient_name: string
  sku: string
  category_name: string
  current_quantity_in_storage_units: number
  storage_unit: string
  calculated_storage_unit_cost: number
  low_stock_threshold_quantity: number
  last_updated_at: string
}

interface InventoryAdjustment {
  id: number
  ingredient_name: string
  adjustment_date: string
  quantity_adjusted: number
  reason_code: string
  notes?: string
  user_id?: number
}

interface IngredientOption {
  id: number
  name: string
  storage_unit: string
}

export default function InventoryControlPage() {
  const { toast } = useToast()
  const [inventoryLevels, setInventoryLevels] = useState<InventoryItem[]>([])
  const [inventoryHistory, setInventoryHistory] = useState<InventoryAdjustment[]>([])
  const [ingredientsOptions, setIngredientsOptions] = useState<IngredientOption[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all") // 'all', 'low_stock'
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [adjustmentData, setAdjustmentData] = useState({
    ingredient_id: "",
    quantity_adjusted: 0,
    reason_code: "",
    notes: "",
  })

  useEffect(() => {
    fetchInventoryData()
    fetchIngredientsOptions()
    fetchInventoryHistory()
  }, [])

  const fetchInventoryData = async () => {
    const data = await getInventoryLevels()
    setInventoryLevels(data)
  }

  const fetchIngredientsOptions = async () => {
    const data = await getIngredients()
    setIngredientsOptions(data.map((ing) => ({ id: ing.id, name: ing.name, storage_unit: ing.storage_unit })))
  }

  const fetchInventoryHistory = async () => {
    const data = await getInventoryHistory()
    setInventoryHistory(data)
  }

  const handleCreateAdjustment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const result = await createInventoryAdjustment({
      ingredient_id: Number.parseInt(adjustmentData.ingredient_id),
      quantity_adjusted: adjustmentData.quantity_adjusted,
      reason_code: adjustmentData.reason_code,
      notes: adjustmentData.notes,
      // user_id: 1, // TODO: Replace with actual user ID
    })

    if (result.success) {
      toast({ title: "Ajuste de Inventario Creado", description: "El ajuste ha sido registrado exitosamente." })
      fetchInventoryData()
      fetchInventoryHistory()
      setIsAdjustmentDialogOpen(false)
      setAdjustmentData({ ingredient_id: "", quantity_adjusted: 0, reason_code: "", notes: "" })
    } else {
      toast({ title: "Error", description: result.error, variant: "destructive" })
    }
  }

  const handleOpenAdjustmentDialog = () => {
    setIsAdjustmentDialogOpen(true)
  }

  const filteredInventory = inventoryLevels.filter((item) => {
    const matchesSearch =
      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "low_stock" && item.current_quantity_in_storage_units <= item.low_stock_threshold_quantity)
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-neutral-900">Inventory Control</h1>
        <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-warm-500 hover:bg-warm-600 text-white shadow-md" onClick={handleOpenAdjustmentDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Ajuste de Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] bg-white p-6 rounded-lg shadow-xl">
            <DialogHeader>
              <DialogTitle>Registrar Ajuste de Inventario</DialogTitle>
              <DialogDescription>
                Realiza ajustes manuales en los niveles de stock de tus ingredientes.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAdjustment} className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ingredient_id" className="text-right">
                  Ingrediente
                </Label>
                <Select
                  name="ingredient_id"
                  value={adjustmentData.ingredient_id}
                  onValueChange={(value) => setAdjustmentData((prev) => ({ ...prev, ingredient_id: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona un ingrediente" />
                  </SelectTrigger>
                  <SelectContent>
                    {ingredientsOptions.map((ing) => (
                      <SelectItem key={ing.id} value={ing.id.toString()}>
                        {ing.name} ({ing.storage_unit})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="quantity_adjusted" className="text-right">
                  Cantidad Ajustada
                </Label>
                <Input
                  id="quantity_adjusted"
                  name="quantity_adjusted"
                  type="number"
                  step="0.01"
                  value={adjustmentData.quantity_adjusted}
                  onChange={(e) =>
                    setAdjustmentData((prev) => ({ ...prev, quantity_adjusted: Number.parseFloat(e.target.value) }))
                  }
                  className="col-span-3"
                  placeholder="Ej: 5.0 (para añadir), -2.5 (para quitar)"
                  required
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason_code" className="text-right">
                  Razón
                </Label>
                <Select
                  name="reason_code"
                  value={adjustmentData.reason_code}
                  onValueChange={(value) => setAdjustmentData((prev) => ({ ...prev, reason_code: value }))}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecciona una razón" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="initial_stock">Inventario Inicial</SelectItem>
                    <SelectItem value="spoilage">Deterioro/Merma</SelectItem>
                    <SelectItem value="manual_correction">Corrección Manual</SelectItem>
                    <SelectItem value="purchase">Compra (Manual)</SelectItem>
                    <SelectItem value="sale_consumption">Consumo por Venta (Manual)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={adjustmentData.notes}
                  onChange={(e) => setAdjustmentData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="col-span-3"
                  rows={3}
                />
              </div>
              <DialogFooter>
                <Button type="submit" className="bg-warm-500 hover:bg-warm-600 text-white">
                  Registrar Ajuste
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <p className="text-neutral-600">
        Rastrea los niveles de stock de tus ingredientes, realiza ajustes manuales y visualiza el historial de
        movimientos.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-neutral-800">Niveles de Stock Actuales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Buscar ingrediente o SKU..."
                  className="pl-10 h-10 bg-neutral-100 border-0 rounded-lg focus:ring-2 focus:ring-warm-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <select
                  className="pl-10 h-10 bg-neutral-100 border-0 rounded-lg focus:ring-2 focus:ring-warm-200 appearance-none pr-4 w-full md:w-auto"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">Todos los Estados</option>
                  <option value="low_stock">Stock Bajo</option>
                </select>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Cantidad Actual</TableHead>
                  <TableHead>Costo Unitario</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInventory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-neutral-500">
                      No se encontraron elementos en el inventario.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInventory.map((item) => (
                    <TableRow key={item.ingredient_id}>
                      <TableCell className="font-medium">{item.ingredient_name}</TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell>
                        {item.current_quantity_in_storage_units} {item.storage_unit}
                      </TableCell>
                      <TableCell>{formatCurrency(item.calculated_storage_unit_cost)}</TableCell>
                      <TableCell>
                        {item.current_quantity_in_storage_units <= item.low_stock_threshold_quantity ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Bajo
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" /> Suficiente
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-neutral-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-neutral-800">Historial de Ajustes</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Ingrediente</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Razón</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="h-24 text-center text-neutral-500">
                      No hay historial de ajustes.
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryHistory.map((adjustment) => (
                    <TableRow key={adjustment.id}>
                      <TableCell>{new Date(adjustment.adjustment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{adjustment.ingredient_name}</TableCell>
                      <TableCell className={cn(adjustment.quantity_adjusted > 0 ? "text-green-600" : "text-red-600")}>
                        {adjustment.quantity_adjusted > 0 ? "+" : ""}
                        {adjustment.quantity_adjusted}
                      </TableCell>
                      <TableCell>{adjustment.reason_code}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
