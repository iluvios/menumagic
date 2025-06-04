"use client"

import { useEffect, useState } from "react"
import { notFound } from "next/navigation"
import { getDigitalMenuWithTemplate, getMenuItemsByMenuId } from "@/lib/actions/menu-studio-actions"
import { getBrandKit } from "@/lib/actions/brand-kit-actions"
import { QRDisplayDialog } from "@/components/qr-display-dialog"
import { formatCurrency } from "@/lib/utils/client-formatters"
import { QrCodeIcon, MapPin, Clock, Phone } from "lucide-react" // CORRECTED: Import directly from lucide-react

interface MenuItem {
  id: number
  name: string
  description: string
  price: number
  image_url?: string
  menu_category_id: number
  category_name: string
  order_index: number // Ensure order_index is part of MenuItem
}

interface DigitalMenu {
  id: number
  name: string
  status: string
  template_id?: number | null
  template_name?: string | null
  template_description?: string | null
  template_preview_image?: string | null
  template_data?: any | null
  qr_code_url?: string | null
  created_at: string
  updated_at: string
  restaurant_id: number
}

interface MenuTemplate {
  primary_color: string
  secondary_color: string
  accent_color: string
  background_color: string
  border_radius: string
  font_family_primary: string
  font_family_secondary: string
  layout_style: string
  card_style: string
  spacing: string
  show_images: boolean
  show_descriptions: boolean
  show_prices: boolean
  header_style: string
  footer_style: string
  background_image_url?: string
}

interface BrandKit {
  id: number
  restaurant_id: number
  logo_url?: string | null
  primary_color?: string | null
  secondary_color?: string | null
  accent_color?: string | null
  font_family_primary?: string | null
  font_family_secondary?: string | null
  created_at: string
  updated_at: string
}

export default function LiveDigitalMenuPage({ params }: { params: { id: string } }) {
  const menuId = Number.parseInt(params.id)
  const [menuData, setMenuData] = useState<
    | (DigitalMenu & {
        template_data_json: MenuTemplate
        menu_items: [string, MenuItem[]][] // This will be the final grouped and ordered array
        brandKit: BrandKit | null
      })
    | null
  >(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isQrDialogOpen, setIsQrDialogOpen] = useState(false)

  useEffect(() => {
    console.log(`[LiveDigitalMenuPage - useEffect] Starting fetch for menuId: ${menuId}`)
    const fetchMenu = async () => {
      try {
        if (isNaN(menuId)) {
          console.error(`[LiveDigitalMenuPage - fetchMenu] Invalid menu ID: ${params.id}. Setting error.`)
          setError("Invalid menu ID provided.")
          return
        }

        console.log(`[LiveDigitalMenuPage - fetchMenu] Calling getDigitalMenuWithTemplate(${menuId})...`)
        const digitalMenuResult = await getDigitalMenuWithTemplate(menuId)
        console.log("[LiveDigitalMenuPage - fetchMenu] Returned from getDigitalMenuWithTemplate:", digitalMenuResult)

        if (!digitalMenuResult) {
          console.warn("[LiveDigitalMenuPage - fetchMenu] getDigitalMenuWithTemplate returned null. Setting error.")
          notFound() // Use Next.js notFound for 404
        }

        console.log(`[LiveDigitalMenuPage - fetchMenu] Calling getMenuItemsByMenuId(${menuId})...`)
        const menuItems = await getMenuItemsByMenuId(menuId)
        console.log("[LiveDigitalMenuPage - fetchMenu] Fetched menuItems:", menuItems)

        console.log(`[LiveDigitalMenuPage - fetchMenu] Calling getBrandKit(${digitalMenuResult.restaurant_id})...`)
        const { brandKit } = await getBrandKit(digitalMenuResult.restaurant_id)
        console.log("[LiveDigitalMenuPage - fetchMenu] Fetched brandKit:", brandKit)

        const template =
          typeof digitalMenuResult.template_data === "object" && digitalMenuResult.template_data !== null
            ? digitalMenuResult.template_data
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
        console.log("[LiveDigitalMenuPage - fetchMenu] Resolved template data:", template)

        // Group menu items by category and prepare for ordering
        const groupedItemsMap = new Map<string, MenuItem[]>()
        const categoryOrderMap = new Map<string, number>()

        menuItems.forEach((item) => {
          const categoryName = item.category_name || "Sin Categoría"
          if (!groupedItemsMap.has(categoryName)) {
            groupedItemsMap.set(categoryName, [])
          }
          groupedItemsMap.get(categoryName)?.push(item)
          // Store the order_index for each category name
          if (!categoryOrderMap.has(categoryName)) {
            categoryOrderMap.set(categoryName, item.order_index || 0)
          }
        })

        // Create an array of [categoryName, items] pairs, sorted by order_index
        const finalOrderedGroupedItems: [string, MenuItem[]][] = Array.from(groupedItemsMap.entries()).sort(
          ([catNameA], [catNameB]) => {
            const orderA = categoryOrderMap.get(catNameA) || 0
            const orderB = categoryOrderMap.get(catNameB) || 0
            return orderA - orderB
          },
        )

        setMenuData({
          ...digitalMenuResult,
          template_data_json: template,
          menu_items: finalOrderedGroupedItems, // Pass the ordered array
          brandKit: brandKit,
        })
        console.log("[LiveDigitalMenuPage - fetchMenu] Menu data set successfully.")
      } catch (err: any) {
        console.error("[LiveDigitalMenuPage - fetchMenu] --- CATCHING ERROR IN FETCHMENU ---")
        console.error("[LiveDigitalMenuPage - fetchMenu] Error details:", {
          message: err.message,
          stack: err.stack,
          name: err.name,
          errorObject: err,
        })
        setError(`Failed to fetch digital menu: ${err.message || "Unknown error"}`)
      } finally {
        console.log("[LiveDigitalMenuPage - fetchMenu] Setting loading to false.")
        setLoading(false)
      }
    }

    fetchMenu()
  }, [menuId, params.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <p className="text-lg text-gray-600">Loading menu...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-red-50 p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <p className="text-red-600">Error</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-red-800">{error}</p>
            <p className="mt-2 text-sm text-gray-600">Please try again later or contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  if (!menuData) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <p>Menu Not Found</p>
            </div>
          </div>
          <div className="mt-4">
            <p>The digital menu you are looking for does not exist.</p>
          </div>
        </div>
      </div>
    )
  }

  const { name, template_data_json: template, menu_items: groupedItems, qr_code_url, brandKit } = menuData

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
                  {name}
                </h1>
                <p className="text-sm text-neutral-600">Menú Digital</p>
              </div>
            </div>
            <button
              className="p-2 rounded-lg bg-neutral-100 hover:bg-neutral-200 transition-colors"
              style={{ borderRadius: template.border_radius }}
              onClick={() => setIsQrDialogOpen(true)}
            >
              <QrCodeIcon className="h-5 w-5 text-neutral-600" />
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
          {/* Iterate over the ordered array of [categoryName, items] */}
          {groupedItems.map(([category, items]: [string, any]) => (
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

        {groupedItems.length === 0 && (
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

      <QRDisplayDialog
        isOpen={isQrDialogOpen}
        onClose={() => setIsQrDialogOpen(false)}
        qrCodeUrl={qr_code_url || window.location.href}
        menuName={name}
      />
    </div>
  )
}
