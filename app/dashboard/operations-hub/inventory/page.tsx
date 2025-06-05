"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, PlusCircle, Search } from "lucide-react"
import { getInventoryItems, createInventoryAdjustment } from "@/lib/actions/menu-studio-actions" // Corrected import
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

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
  ingredient_id: number
  quantity_adjusted: number
  reason_code: string
  notes?: string
}

export default function InventoryPage() {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isAdjustmentDialogOpen, setIsAdjustmentDialogOpen] = useState(false)
  const [currentAdjustment, setCurrentAdjustment] = useState<Partial<InventoryAdjustment>>({
    reason_code: "waste",
  })
  const [selectedIngredientForAdjustment, setSelectedIngredientForAdjustment] = useState<InventoryItem | null>(null)
  const [isAdjusting, setIsAdjusting] = useState(false)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const data = await getInventoryItems() // Corrected function call
      setInventoryItems(data)
    } catch (error) {
      console.error("Error fetching inventory items:", error)
      toast({
        title: "Error",
        description: "Failed to load inventory items.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.ingredient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category_name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleOpenAdjustmentDialog = (item: InventoryItem) => {
    setSelectedIngredientForAdjustment(item)
    setCurrentAdjustment({
      ingredient_id: item.ingredient_id,
      quantity_adjusted: 0,
      reason_code: "waste",
      notes: "",
    })
    setIsAdjustmentDialogOpen(true)
  }

  const handleAdjustmentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setCurrentAdjustment((prev) => ({ ...prev, [id]: id === "quantity_adjusted" ? Number.parseFloat(value) : value }))
  }

  const handleReasonCodeChange = (value: string) => {
    setCurrentAdjustment((prev) => ({ ...prev, reason_code: value }))
  }

  const handleSaveAdjustment = async () => {
    if (!currentAdjustment.ingredient_id || currentAdjustment.quantity_adjusted === undefined) {
      toast({
        title: "Error",
        description: "Ingredient and quantity are required for adjustment.",
        variant: "destructive",
      })
      return
    }

    setIsAdjusting(true)
    try {
      const result = await createInventoryAdjustment(currentAdjustment as InventoryAdjustment)
      if (result.success) {
        toast({
          title: "Success",
          description: "Inventory adjustment recorded successfully.",
        })
        setIsAdjustmentDialogOpen(false)
        fetchInventory() // Re-fetch inventory to show updated levels
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to record inventory adjustment.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error saving adjustment:", error)
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving adjustment.",
        variant: "destructive",
      })
    } finally {
      setIsAdjusting(false)
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">Inventory Levels</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Button
              onClick={() =>
                toast({
                  title: "Feature coming soon!",
                  description: "Add new inventory item functionality is under development.",
                })
              }
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Current Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Cost per Unit</TableHead>
                    <TableHead>Low Stock Threshold</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center text-gray-500">
                        No inventory items found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item) => (
                      <TableRow key={item.ingredient_id}>
                        <TableCell className="font-medium">{item.ingredient_name}</TableCell>
                        <TableCell>{item.sku}</TableCell>
                        <TableCell>{item.category_name}</TableCell>
                        <TableCell>{item.current_quantity_in_storage_units.toFixed(2)}</TableCell>
                        <TableCell>{item.storage_unit}</TableCell>
                        <TableCell>${item.calculated_storage_unit_cost.toFixed(2)}</TableCell>
                        <TableCell>{item.low_stock_threshold_quantity}</TableCell>
                        <TableCell>
                          {item.last_updated_at ? new Date(item.last_updated_at).toLocaleString() : "N/A"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => handleOpenAdjustmentDialog(item)}>
                            Adjust
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isAdjustmentDialogOpen} onOpenChange={setIsAdjustmentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Inventory for {selectedIngredientForAdjustment?.ingredient_name}</DialogTitle>
            <CardDescription>
              Current Quantity: {selectedIngredientForAdjustment?.current_quantity_in_storage_units.toFixed(2)}{" "}
              {selectedIngredientForAdjustment?.storage_unit}
            </CardDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="quantity_adjusted" className="text-right">
                Quantity Adjusted
              </Label>
              <Input
                id="quantity_adjusted"
                type="number"
                step="0.01"
                value={currentAdjustment.quantity_adjusted}
                onChange={handleAdjustmentChange}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reason_code" className="text-right">
                Reason
              </Label>
              <Select value={currentAdjustment.reason_code} onValueChange={handleReasonCodeChange}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="waste">Waste</SelectItem>
                  <SelectItem value="spoilage">Spoilage</SelectItem>
                  <SelectItem value="theft">Theft</SelectItem>
                  <SelectItem value="delivery_error">Delivery Error</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                Notes
              </Label>
              <Input
                id="notes"
                value={currentAdjustment.notes}
                onChange={handleAdjustmentChange}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAdjustmentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAdjustment} disabled={isAdjusting}>
              {isAdjusting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
                </>
              ) : (
                "Save Adjustment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
