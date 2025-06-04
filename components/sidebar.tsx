"use client"

import type * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  LayoutDashboard,
  ChefHat,
  Salad,
  DollarSign,
  Bot,
  Truck,
  ShoppingCart,
  History,
  MapPin,
  BarChart,
  Settings,
  User,
  BookOpen,
  Printer,
  Globe,
  Palette,
  QrCode,
  Package,
  LineChart,
  ClipboardList,
} from "lucide-react"

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

interface NavItem {
  title: string
  href?: string
  icon: React.ElementType
  items?: NavItem[]
  isChangelog?: boolean
}

const dashboardConfig: NavItem[] = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Inventarios",
    icon: Package, // Changed from ChefHat to Package for inventory
    items: [
      {
        title: "Recetas", // Global Dishes / Reusable Menu Items
        href: "/dashboard/operations-hub/recipes",
        icon: ChefHat,
      },
      {
        title: "Ingredientes",
        href: "/dashboard/operations-hub/ingredients",
        icon: Salad,
      },
      {
        title: "Ubicaciones", // Added from image
        href: "/dashboard/operations-hub/inventory", // Assuming this maps to inventory locations
        icon: MapPin,
      },
    ],
  },
  {
    title: "Costos",
    icon: DollarSign,
    items: [
      {
        title: "Ingresar costos",
        href: "/dashboard/costs",
        icon: ClipboardList, // Changed from DollarSign to ClipboardList
      },
      {
        title: "Ingresar costos con AI",
        href: "/dashboard/smart-accounting/cost-sales-tracker", // Assuming this maps to a cost tracking page
        icon: Bot,
      },
    ],
  },
  {
    title: "Pedidos",
    icon: ShoppingCart, // Changed from Truck to ShoppingCart
    items: [
      {
        title: "Proveedores",
        href: "/dashboard/orders/suppliers",
        icon: Truck,
      },
      {
        title: "Compras", // Assuming this is for new orders
        href: "/dashboard/order-hub", // Assuming this maps to an order creation/management page
        icon: ShoppingCart,
      },
      {
        title: "Historial",
        href: "/dashboard/menus/dishes", // Assuming this maps to order history
        icon: History,
      },
    ],
  },
  {
    title: "Menú",
    icon: BookOpen,
    items: [
      {
        title: "Menú digital",
        href: "/dashboard/menu-studio/digital-menu",
        icon: QrCode, // Changed from BookOpen to QrCode
      },
      {
        title: "Menus PDF/para imprimir",
        href: "/dashboard/menu-studio/print-designer",
        icon: Printer,
      },
      {
        title: "Sitio web",
        href: "/dashboard/menu-studio/website-builder",
        icon: Globe,
      },
      {
        title: "Brand kit",
        href: "/dashboard/menu-studio/brand-kit",
        icon: Palette,
      },
    ],
  },
  {
    title: "Informes", // Added from image
    icon: LineChart, // Changed from BarChart to LineChart
    items: [
      {
        title: "Personalizados",
        href: "/dashboard/analytics", // Assuming this maps to analytics/custom reports
        icon: BarChart,
      },
    ],
  },
  {
    title: "Configuración",
    href: "/dashboard/settings",
    icon: Settings,
    items: [
      {
        title: "Perfil",
        href: "/dashboard/settings/profile",
        icon: User,
      },
      {
        title: "Categorías",
        href: "/dashboard/settings/categories",
        icon: ClipboardList,
      },
    ],
  },
]

export function Sidebar({ className, ...props }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12", className)} {...props}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">Menú</h2>
          <div className="space-y-1">
            {dashboardConfig.map((item, index) => {
              if (item.items) {
                const defaultOpen = item.items.some((subItem) =>
                  subItem.href ? pathname.startsWith(subItem.href) : false,
                )
                return (
                  <Accordion
                    key={item.title}
                    type="single"
                    collapsible
                    defaultValue={defaultOpen ? item.title : undefined}
                  >
                    <AccordionItem value={item.title} className="border-b-0">
                      <AccordionTrigger
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-neutral-900 transition-all hover:bg-neutral-100",
                          defaultOpen && "bg-neutral-100",
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        {item.title}
                      </AccordionTrigger>
                      <AccordionContent className="pb-1 pl-4">
                        {item.items.map((subItem) => (
                          <Link key={subItem.title} href={subItem.href || "#"}>
                            <span
                              className={cn(
                                "flex items-center gap-3 rounded-md px-3 py-2 text-neutral-500 transition-all hover:bg-neutral-100",
                                pathname.startsWith(subItem.href || "") && "bg-neutral-100 text-neutral-900",
                              )}
                            >
                              <subItem.icon className="h-5 w-5" />
                              {subItem.title}
                            </span>
                          </Link>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )
              }
              return (
                <Link key={item.title} href={item.href || "#"}>
                  <span
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2 text-neutral-900 transition-all hover:bg-neutral-100",
                      pathname === item.href && "bg-neutral-100",
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.title}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
