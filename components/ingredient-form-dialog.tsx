"use client"

import type React from "react"
import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { createIngredient, updateIngredient, getSuppliers } from "@/lib/actions/ingredient-actions"
import { Loader2 } from "lucide-react"

interface Ingredient {
  id: number
  name: string
  unit_of_measure: string
  current_stock?: number
  cost_per_unit?: number
  supplier_id?: number
  supplier_name?: string
  category?: string
}

interface Supplier {
  id: number
  name: string
}

interface IngredientFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  ingredient?: Ingredient | null
  onSave: () => void
}

const UNIT_OPTIONS = [
  "kg",
  "g",
  "lb",
  "oz",
  "l",
  "ml",
  "gal",
  "qt",
  "pt",
  "cup",
  "fl oz",
  "pieces",
  "units",
  "dozen",
  "pack",
  "box",
  "bag",
]

const CATEGORY_OPTIONS = [
  "Vegetables",
  "Fruits",
  "Meat",
  "Poultry",
  "Seafood",
  "Dairy",
  "Grains",
  "Spices",
  "Herbs",
  "Oils",
  "Condiments",
  "Beverages",
  "Other",
]

export function IngredientFormDialog({ isOpen, onOpenChange, ingredient, onSave }: IngredientFormDialogProps) {
  const { toast } = useToast()
  const [name, setName] = useState("")
  const [unitOfMeasure, setUnitOfMeasure] = useState("")
  const [currentStock, setCurrentStock] = useState("")
  const [costPerUnit, setCostPerUnit] = useState("")
  const [supplierId, setSupplierId] = useState("")
  const [category, setCategory] = useState("")
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Reset form when dialog opens
      if (ingredient) {
        setName(ingredient.name || "")
        setUnitOfMeasure(ingredient.unit_of_measure || "")
        setCurrentStock(ingredient.current_stock?.toString() || "")
        setCostPerUnit(ingredient.cost_per_unit?.toString() || "")
        setSupplierId(ingredient.supplier_id?.toString() || "")
        setCategory(ingredient.category || "")
      } else {
        setName("")
        setUnitOfMeasure("")
        setCurrentStock("")
        setCostPerUnit("")
        setSupplierId("")
        setCategory("")
      }

      // Load suppliers
      fetchSuppliers()
    }
  }, [isOpen, ingredient])

  const fetchSuppliers = async () => {
    setIsLoadingSuppliers(true)
    try {
      const suppliersData = await getSuppliers()
      setSuppliers(suppliersData)
    } catch (error: any) {
      console.error("Error fetching suppliers:", error)
      // Don't show error toast for suppliers as it's not critical
    } finally {
      setIsLoadingSuppliers(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const ingredientData = {
        name,
        unit_of_measure: unitOfMeasure,
        current_stock: currentStock ? Number.parseFloat(currentStock) : undefined,
        cost_per_unit: costPerUnit ? Number.parseFloat(costPerUnit) : undefined,
        supplier_id: supplierId ? Number.parseInt(supplierId) : undefined,
        category: category || undefined,
      }

      if (ingredient) {
        // Editing existing ingredient
        await updateIngredient(ingredient.id, ingredientData)
        toast({
          title: "Success",
          description: "Ingredient updated successfully.",
        })
      } else {
        // Creating new ingredient
        if (!name || !unitOfMeasure) {
          toast({
            title: "Error",
            description: "Name and unit of measure are required.",
            variant: "destructive",
          })
          return
        }
        await createIngredient(ingredientData)
        toast({
          title: "Success",
          description: "Ingredient created successfully.",
        })
      }

      onSave()
      onOpenChange(false)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save ingredient.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{ingredient ? "Edit Ingredient" : "Add New Ingredient"}</DialogTitle>
          <DialogDescription>
            {ingredient ? "Make changes to your ingredient here." : "Add a new ingredient to your inventory."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name *
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              placeholder="e.g., Tomatoes"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="unit" className="text-right">
              Unit *
            </Label>
            <Select onValueChange={setUnitOfMeasure} value={unitOfMeasure} required>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select unit of measure" />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select onValueChange={setCategory} value={category}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select category (optional)" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="stock" className="text-right">
              Current Stock
            </Label>
            <Input
              id="stock"
              type="number"
              step="0.01"
              value={currentStock}
              onChange={(e) => setCurrentStock(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cost" className="text-right">
              Cost per Unit
            </Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={costPerUnit}
              onChange={(e) => setCostPerUnit(e.target.value)}
              className="col-span-3"
              placeholder="0.00"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="supplier" className="text-right">
              Supplier
            </Label>
            <Select onValueChange={setSupplierId} value={supplierId} disabled={isLoadingSuppliers}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={isLoadingSuppliers ? "Loading suppliers..." : "Select supplier (optional)"} />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier.id} value={supplier.id.toString()}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {ingredient ? "Updating..." : "Creating..."}
                </>
              ) : ingredient ? (
                "Update Ingredient"
              ) : (
                "Create Ingredient"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
