"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"
import { getAllGlobalCategories } from "@/lib/actions/category-actions"
import { ReusableMenuItemsList } from "@/components/reusable-menu-items-list"

interface GlobalCategory {
  id: number
  name: string
  type: string
  order_index: number
}

export default function RecipesPage() {
  const { toast } = useToast()
  const [categories, setCategories] = useState<GlobalCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setIsLoading(true)
    try {
      console.log("RecipesPage: Fetching global categories...")
      const data = await getAllGlobalCategories()
      console.log("RecipesPage: Global categories fetched:", data)
      setCategories(data)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudieron cargar las categorías.",
        variant: "destructive",
      })
      console.error("RecipesPage: Error fetching global categories:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSuccess = () => {
    console.log("RecipesPage: Recipe/dish saved successfully, triggering category refresh in ReusableMenuItemsList")
  }

  const handleCategoriesUpdated = () => {
    console.log("RecipesPage: Categories updated, re-fetching categories for this page.")
    fetchCategories()
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Recetas y Platillos Globales</h1>
          <p className="text-neutral-600">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Recetas y Platillos Globales</h1>
        <p className="text-neutral-600">
          Gestiona tus platillos base y sus ingredientes. Estos platillos se pueden usar en cualquier menú digital.
        </p>
      </div>

      <ReusableMenuItemsList
        categories={categories}
        onSaveSuccess={handleSaveSuccess}
        onCategoriesUpdated={handleCategoriesUpdated}
      />
    </div>
  )
}
