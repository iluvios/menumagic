"use client"

import { notFound } from "next/navigation"
import { getDigitalMenuWithTemplate, getMenuItemsByMenuId } from "@/lib/actions/menu-studio-actions"
import { getBrandKit } from "@/lib/actions/brand-kit-actions"
import { formatCurrency } from "@/lib/utils/formatters"
import { QrCode, MapPin, Clock, Phone } from "lucide-react"

interface PageProps {
  params: {
    id: string
  }
}

export default async function LiveDigitalMenuPage({ params }: PageProps) {
  const menuId = Number.parseInt(params.id)

  if (isNaN(menuId)) {
    notFound()
  }

  try {
    console.log(`[LiveDigitalMenuPage] Attempting to fetch menu data for menuId: ${menuId}`)
    const menuData = await getDigitalMenuWithTemplate(menuId)
    console.log("[LiveDigitalMenuPage] Fetched menuData:", menuData)

    const menuItems = await getMenuItemsByMenuId(menuId)
    console.log("[LiveDigitalMenuPage] Fetched menuItems:", menuItems)

    const { brandKit } = await getBrandKit()
    console.log("[LiveDigitalMenuPage] Fetched brandKit:", brandKit)

    if (!menuData) {
      console.error(`[LiveDigitalMenuPage] Menu data not found for ID: ${menuId}. Calling notFound().`)
      notFound()
    }

    // Ensure template_data_json is an object, even if it's null or not an object from DB
    const template =
      typeof menuData.template_data_json === "object" && menuData.template_data_json !== null
        ? menuData.template_data_json
        : {
            primary_color: "#1F2937",
            secondary_color: "#F9FAFB",
            accent_color: "#D97706",
            background_color: "#FFFFFF",
            border_radius: "8px",
            font_family_primary: "Inter",
            font_family_secondary: "Lora",
            layout_style: "list",
            card_style: "elevated",
            spacing: "comfortable",
            show_images: true,
            show_descriptions: true,
            show_prices: true,
            header_style: "centered",
            footer_style: "simple",
          }
    console.log("[LiveDigitalMenuPage] Resolved template:", template)

    // Group menu items by category
    const groupedItems = menuItems.reduce((acc: any, item: any) => {
      const category = item.category_name || "Sin Categoría"
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(item)
      return acc
    }, {})
    console.log("[LiveDigitalMenuPage] Grouped items:", groupedItems)

    console.log("[LiveDigitalMenuPage] Rendering component...")
    return (
      <div
        className="min-h-screen"
        style={{
          backgroundColor: template.background_color,
          backgroundImage: template.background_image_url ? `url(${template.background_image_url})` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          fontFamily: template.font_family_primary,
        }}
      >
        {/* Header */}
        <header className="sticky top-0 z-10 backdrop-blur-sm bg-white/80 border-b border-neutral-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {brandKit?.logo_url && (
                  <img
                    src={brandKit.logo_url || "/placeholder.svg"}
                    alt="Logo"
                    className="h-10 w-10 object-contain rounded"
                    style={{ borderRadius: template.border_radius }}
                  />
                )}
                <div>
                  <h1
                    className="text-xl font-bold"
                    style={{
                      color: template.primary_color,
                      fontFamily: template.font_family_primary,
                    }}
                  >
                    {menuData.name}
                  </h1>
                  <p className="text-sm text-neutral-600">Menú Digital</p>
                </div>
              </div>
              <button
                className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
                style={{ borderRadius: template.border_radius }}
                onClick={() => window.print()}
              >
                <QrCode className="h-5 w-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 py-6">
          {/* Restaurant Info */}
          <div
            className="mb-8 p-6 rounded-lg"
            style={{
              backgroundColor: template.secondary_color,
              borderRadius: template.border_radius,
              boxShadow: template.card_style === "elevated" ? "0 4px 6px rgba(0, 0, 0, 0.1)" : "none",
              border: template.card_style === "bordered" ? "1px solid #E5E7EB" : "none",
            }}
          >
            <div className="text-center">
              <h2
                className="text-2xl font-bold mb-2"
                style={{
                  color: template.primary_color,
                  fontFamily: template.font_family_primary,
                }}
              >
                Bienvenido a Nuestro Restaurante
              </h2>
              <p className="text-neutral-600 mb-4">
                Disfruta de nuestra selección de platillos preparados con ingredientes frescos y de la más alta calidad.
              </p>
              <div className="flex flex-wrap justify-center gap-4 text-sm text-neutral-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  Calle Principal 123
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  Lun-Dom 11:00-22:00
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-1" />
                  (555) 123-4567
                </div>
              </div>
            </div>
          </div>

          {/* Menu Categories */}
          <div className="space-y-8">
            {Object.entries(groupedItems).map(([category, items]: [string, any]) => (
              <section key={category}>
                <h3
                  className="text-xl font-bold mb-4 pb-2 border-b-2"
                  style={{
                    color: template.primary_color,
                    borderColor: template.accent_color,
                    fontFamily: template.font_family_primary,
                  }}
                >
                  {category}
                </h3>
                <div
                  className={`grid gap-4 ${
                    template.layout_style === "grid"
                      ? "grid-cols-1 md:grid-cols-2"
                      : template.layout_style === "cards"
                        ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                        : "grid-cols-1"
                  }`}
                >
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg transition-all duration-200 hover:scale-[1.02] ${
                        template.spacing === "compact" ? "p-3" : "p-4"
                      }`}
                      style={{
                        backgroundColor: template.secondary_color,
                        borderRadius: template.border_radius,
                        boxShadow: template.card_style === "elevated" ? "0 2px 4px rgba(0, 0, 0, 0.1)" : "none",
                        border: template.card_style === "bordered" ? "1px solid #E5E7EB" : "none",
                      }}
                    >
                      <div className={`flex ${template.layout_style === "cards" ? "flex-col" : "items-start"} gap-4`}>
                        {template.show_images && (
                          <img
                            src={
                              item.image_url ||
                              `/placeholder.svg?height=120&width=120&query=${encodeURIComponent(item.name) || "/placeholder.svg"}`
                            }
                            alt={item.name}
                            className={`object-cover ${
                              template.layout_style === "cards" ? "w-full h-32" : "w-20 h-20 flex-shrink-0"
                            }`}
                            style={{ borderRadius: template.border_radius }}
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <h4
                              className="font-semibold text-lg"
                              style={{
                                color: template.primary_color,
                                fontFamily: template.font_family_primary,
                              }}
                            >
                              {item.name}
                            </h4>
                            {template.show_prices && (
                              <span
                                className="font-bold text-lg ml-2 flex-shrink-0"
                                style={{
                                  color: template.accent_color,
                                  fontFamily: template.font_family_secondary,
                                }}
                              >
                                {formatCurrency(item.price)}
                              </span>
                            )}
                          </div>
                          {template.show_descriptions && item.description && (
                            <p
                              className="text-neutral-600 text-sm leading-relaxed"
                              style={{ fontFamily: template.font_family_secondary }}
                            >
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {menuItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-neutral-500 text-lg">Este menú está siendo actualizado.</p>
              <p className="text-neutral-400">Por favor, consulta con nuestro personal.</p>
            </div>
          )}
        </main>

        {/* Footer */}
        <footer
          className="mt-12 py-6 text-center"
          style={{
            backgroundColor: template.secondary_color,
            color: template.primary_color,
          }}
        >
          <div className="max-w-4xl mx-auto px-4">
            <p className="text-sm">
              Menú digital creado con{" "}
              <span className="font-semibold" style={{ color: template.accent_color }}>
                MenuMagic
              </span>
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              Última actualización: {new Date(menuData.updated_at).toLocaleDateString()}
            </p>
          </div>
        </footer>
      </div>
    )
  } catch (error) {
    console.error("[LiveDigitalMenuPage] Error loading menu:", error)
    // In a production environment, you might want to render a more user-friendly error page
    // or redirect to a generic error page instead of just notFound().
    notFound()
  }
}
