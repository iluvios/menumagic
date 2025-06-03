"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Utensils,
  ShoppingCart,
  DollarSign,
  BarChart2,
  Settings,
  ChefHat,
  Package,
  Truck,
  BookText,
  Printer,
  Globe,
  Palette,
  Tag,
} from "lucide-react"
import { useState } from "react"

export function Sidebar() {
  const pathname = usePathname()
  const [openMenuStudio, setOpenMenuStudio] = useState(false)
  const [openOperationsHub, setOpenOperationsHub] = useState(false)
  const [openSettings, setOpenSettings] = useState(false)

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      active: pathname === "/dashboard",
    },
    {
      name: "Menu Studio",
      href: "/dashboard/menu-studio",
      icon: Utensils,
      active: pathname.startsWith("/dashboard/menu-studio"),
      subItems: [
        {
          name: "Digital Menu Hub",
          href: "/dashboard/menu-studio/digital-menu",
          icon: BookText,
          active: pathname.startsWith("/dashboard/menu-studio/digital-menu"),
        },
        {
          name: "Print Menu Designer",
          href: "/dashboard/menu-studio/print-designer",
          icon: Printer,
          active: pathname.startsWith("/dashboard/menu-studio/print-designer"),
        },
        {
          name: "Website Builder",
          href: "/dashboard/menu-studio/website-builder",
          icon: Globe,
          active: pathname.startsWith("/dashboard/menu-studio/website-builder"),
        },
        {
          name: "Brand Kit",
          href: "/dashboard/menu-studio/brand-kit",
          icon: Palette,
          active: pathname.startsWith("/dashboard/menu-studio/brand-kit"),
        },
        {
          name: "Template Designer",
          href: "/dashboard/menu-studio/templates",
          icon: Palette,
          active: pathname.startsWith("/dashboard/menu-studio/templates"),
        },
      ],
    },
    {
      name: "Order Hub",
      href: "/dashboard/order-hub",
      icon: ShoppingCart,
      active: pathname.startsWith("/dashboard/order-hub"),
    },
    {
      name: "Smart Accounting",
      href: "/dashboard/smart-accounting",
      icon: DollarSign,
      active: pathname.startsWith("/dashboard/smart-accounting"),
      subItems: [
        {
          name: "Cost & Sales Tracker",
          href: "/dashboard/smart-accounting/cost-sales-tracker",
          icon: BarChart2,
          active: pathname.startsWith("/dashboard/smart-accounting/cost-sales-tracker"),
        },
        // Add other accounting sub-items here
      ],
    },
    {
      name: "Growth Insights",
      href: "/dashboard/growth-insights",
      icon: BarChart2,
      active: pathname.startsWith("/dashboard/growth-insights"),
    },
    {
      name: "Operations Hub",
      href: "/dashboard/operations-hub",
      icon: ChefHat,
      active: pathname.startsWith("/dashboard/operations-hub"),
      subItems: [
        {
          name: "Recipe Management",
          href: "/dashboard/operations-hub/recipes",
          icon: ChefHat,
          active: pathname.startsWith("/dashboard/operations-hub/recipes"),
        },
        {
          name: "Ingredient Management",
          href: "/dashboard/operations-hub/ingredients",
          icon: Package,
          active: pathname.startsWith("/dashboard/operations-hub/ingredients"),
        },
        {
          name: "Supplier Directory",
          href: "/dashboard/operations-hub/suppliers",
          icon: Truck,
          active: pathname.startsWith("/dashboard/operations-hub/suppliers"),
        },
        {
          name: "Inventory Control",
          href: "/dashboard/operations-hub/inventory",
          icon: Package,
          active: pathname.startsWith("/dashboard/operations-hub/inventory"),
        },
      ],
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: Settings,
      active: pathname.startsWith("/dashboard/settings"),
      subItems: [
        {
          name: "Restaurant Profile",
          href: "/dashboard/settings/profile",
          icon: Globe,
          active: pathname.startsWith("/dashboard/settings/profile"),
        },
        {
          name: "Category Management", // New item
          href: "/dashboard/settings/categories",
          icon: Tag,
          active: pathname.startsWith("/dashboard/settings/categories"),
        },
        // Add other settings sub-items here
      ],
    },
  ]

  return (
    <aside className="w-64 bg-neutral-50 border-r border-neutral-200 p-4 flex flex-col">
      <div className="text-2xl font-bold text-warm-700 mb-6">MenuMagic</div>
      <nav className="flex-1 space-y-2">
        {navItems.map((item) => (
          <div key={item.name}>
            {item.subItems ? (
              <>
                <button
                  type="button"
                  className={cn(
                    "flex items-center w-full p-3 rounded-lg text-neutral-700 hover:bg-warm-100 transition-colors duration-150 ease-in-out",
                    item.active && "bg-warm-100 text-warm-700 font-semibold",
                  )}
                  onClick={() => {
                    if (item.name === "Menu Studio") setOpenMenuStudio(!openMenuStudio)
                    if (item.name === "Operations Hub") setOpenOperationsHub(!openOperationsHub)
                    if (item.name === "Settings") setOpenSettings(!openSettings)
                  }}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
                {(item.name === "Menu Studio" && openMenuStudio) ||
                (item.name === "Operations Hub" && openOperationsHub) ||
                (item.name === "Settings" && openSettings) ? (
                  <div className="ml-6 mt-1 space-y-1">
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.name}
                        href={subItem.href}
                        className={cn(
                          "flex items-center p-2 rounded-lg text-sm text-neutral-600 hover:bg-warm-50 transition-colors duration-150 ease-in-out",
                          subItem.active && "bg-warm-50 text-warm-600 font-medium",
                        )}
                      >
                        <subItem.icon className="mr-3 h-4 w-4" />
                        {subItem.name}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center p-3 rounded-lg text-neutral-700 hover:bg-warm-100 transition-colors duration-150 ease-in-out",
                  item.active && "bg-warm-100 text-warm-700 font-semibold",
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            )}
          </div>
        ))}
      </nav>
    </aside>
  )
}
