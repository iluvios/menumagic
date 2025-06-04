import { ReusableMenuItemsList } from "@/components/reusable-menu-items-list"

export default function RecipesPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Gestión de Recetas</h1>
      <p className="text-gray-600 mb-8">
        Crea y gestiona platillos reutilizables con sus ingredientes. Estos platillos pueden ser añadidos a cualquier
        menú y automáticamente deducirán ingredientes del inventario cuando se registren ventas.
      </p>

      <ReusableMenuItemsList />
    </div>
  )
}
