"use client"

import { useState, useEffect } from "react"
import {
  getInventoryItems, // Corrected import
  createInventoryAdjustment, // Corrected import
} from "@/lib/actions/inventory-actions" // Corrected path
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { PlusCircle, MinusCircle, History } from "lucide-react"
import { formatCurrency } from "@/lib/utils/client-formatters" // Corrected import

interface InventoryItem {
  id: number
  name: string
  current_stock: number
  unit: string
  cost_per_unit: number
  last_updated: string
}

interface InventoryAdjustment {
  id: number
  inventory_item_id: number
  adjustment_type: "add" | "remove"
  quantity: number
  reason: string
  created_at: string
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)
  const [adjustmentQuantity, setAdjustmentQuantity] = useState<number>(0)
  const [adjustmentReason, setAdjustmentReason] = useState<string>("")
  const [adjustmentType, setAdjustmentType] = useState<"add" | "remove">("add")
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)

  useEffect(() => {
    fetchInventoryItems()
  }, [])

  const fetchInventoryItems = async () => {
    try {
      const items = await getInventoryItems()
      setInventoryItems(items)
    } catch (error) {
      toast.error("Failed to fetch inventory items.")
      console.error("Error fetching inventory items:", error)
    }
  }

  const handleOpenAdjustmentDialog = (item: InventoryItem, type: "add" | "remove") => {
    setSelectedItem(item)
    setAdjustmentType(type)
    setAdjustmentQuantity(0)
    setAdjustmentReason("")
    setIsAdjustmentDialogOpen(true)
  }

  const handleSaveAdjustment = async () => {
    if (!selectedItem || adjustmentQuantity <= 0 || !adjustmentReason) {
      toast.error("Please fill all adjustment fields.")
      return
    }

    try {
      await createInventoryAdjustment({
        inventory_item_id: selectedItem.id,
        adjustment_type: adjustmentType,
        quantity: adjustmentQuantity,
        reason: adjustmentReason,
      })
      toast.success("Inventory adjusted successfully.")
      setIsAdjustmentDialogOpen(false)
      fetchInventoryItems() // Re-fetch to update stock
    } catch (error) {
      toast.error("Failed to adjust inventory.")
      console.error("Error adjusting inventory:", error)
    }
  }

  return (
    <div className="flex h-full flex-col p-4">
      <h1 className="mb-4 text-2xl font-bold">Inventory Management</h1>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Current Stock</CardTitle>
          <CardDescription>Overview of all inventory items and their current stock levels.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item Name</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Cost per Unit</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventoryItems.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-gray-500">
                    No inventory items found.
                  </TableCell>
                </TableRow>
              ) : (
                inventoryItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{item.current_stock}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                    <TableCell>{formatCurrency(item.cost_per_unit)}</TableCell>
                    <TableCell>{new Date(item.last_updated).toLocaleString()}</TableCell>
                    <TableCell className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenAdjustmentDialog(item, "add")}>
                        <PlusCircle className="mr-1 h-4 w-4" /> Add
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleOpenAdjustmentDialog(item, "remove")}>
                        <MinusCircle className="mr-1 h-4 w-4" /> Remove
                      </Button>
                      <Button variant="outline" size="sm">
                        <History className="mr-1 h-4 w-4" /> History
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {adjustmentType === "add" ? "Add Stock" : "Remove Stock"} for {selectedItem?.name}
            </DialogTitle>
            <DialogDescription>Enter the quantity and reason for this inventory adjustment.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity" className="text-right">
                Quantity
              </Label>
              <Input
                id="quantity"
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Number.parseFloat(e.target.value))}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason" className="text-right">
                Reason
              </Label>
              <Input
                id="reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustment}>Save Adjustment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
