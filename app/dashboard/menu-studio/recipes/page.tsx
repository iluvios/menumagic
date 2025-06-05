import { ReusableMenuItemsList } from "@/components/reusable-menu-items-list"
import { getReusableMenuItemsForRecipesPage } from "@/lib/actions/recipe-actions"
import { revalidatePath } from "next/cache"

export default async function RecipesPage() {
  const items = await getReusableMenuItemsForRecipesPage()

  async function handleItemUpdated() {
    "use server"
    revalidatePath("/dashboard/menu-studio/recipes")
  }

  async function handleItemDeleted() {
    "use server"
    revalidatePath("/dashboard/menu-studio/recipes")
  }

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Recetas</h1>
      <p className="text-gray-600 mb-8">
        Crea y gestiona platillos reutilizables con sus ingredientes. Estos platillos pueden ser añadidos a cualquier
        menú y automáticamente deducirán ingredientes del inventario cuando se registren ventas.
      </p>

      <ReusableMenuItemsList 
        items={items || []} // Ensure items is an array, defaulting to empty if undefined/null
        onItemUpdated={handleItemUpdated} 
        onItemDeleted={handleItemDeleted} 
      />
    </div>
  )
}
