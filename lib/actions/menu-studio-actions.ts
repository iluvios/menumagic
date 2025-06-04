"use server"

// This file is intended to re-export actions from other files for convenience.
// It helps consolidate imports in pages/components.

// Re-export from digital-menu-actions.ts
export {
  getDigitalMenus,
  getDigitalMenuById,
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  uploadQrCodeForDigitalMenu,
  getDigitalMenuQrCodeUrl,
} from "./digital-menu-actions"

// Re-export from menu-item-actions.ts
export {
  getMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getMenuItemsByMenuId,
  getMenuItemDetails,
  getMenuItemIngredients,
  updateMenuItemIngredients,
  getMenuItemCategories,
  getMenuItemReusableItems,
  updateMenuItemReusableItems,
} from "./menu-item-actions"

// Re-export from category-actions.ts
export {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,
} from "./category-actions"

// Re-export from menu-template-actions.ts (updated names)
export {
  getTemplates, // Renamed
  getTemplateById, // Renamed
  createTemplate, // Renamed
  updateTemplate, // Renamed
  deleteTemplate, // Renamed
  applyTemplateToMenu,
  generateTemplateWithAI,
  seedDefaultTemplates,
} from "./template-actions"

// Re-export from cost-actions.ts (updated names and new placeholders)
export {
  getCosts, // Renamed
  updateCost, // New placeholder
  deleteCost, // New placeholder
  getRecipeCosts,
  getIngredients,
  updateIngredientCost,
  createCost, // Existing placeholder
} from "./cost-actions"

// Re-export from inventory-actions.ts (updated names and new placeholders)
export {
  getInventoryItems, // Renamed
  createInventoryItem, // New placeholder
  updateInventoryItem, // New placeholder
  deleteInventoryItem, // New placeholder
  createInventoryAdjustment,
  getInventoryHistory,
} from "./inventory-actions"

// Re-export from restaurant-actions.ts (updated names)
export {
  getRestaurantDetails, // Renamed
  updateRestaurantDetails, // Renamed
} from "./restaurant-actions"

// Re-export from reusable-menu-item-actions.ts
export {
  getReusableMenuItems,
  getReusableMenuItemById,
  createReusableMenuItem,
  updateReusableMenuItem,
  deleteReusableMenuItem,
} from "./reusable-menu-item-actions"

// Re-export from supplier-actions.ts
export {
  getSuppliers,
  getSupplierById,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} from "./supplier-actions"

// Re-export from ai-menu-actions.ts
export {
  generateMenuFromImage,
  generateMenuFromText,
  generateMenuSuggestions,
} from "./ai-menu-actions"
