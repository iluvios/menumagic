"use server"

// Import from digital-menu-actions.ts
import {
  getDigitalMenus as _getDigitalMenus,
  getDigitalMenuById as _getDigitalMenuById,
  createDigitalMenu as _createDigitalMenu,
  updateDigitalMenu as _updateDigitalMenu,
  deleteDigitalMenu as _deleteDigitalMenu,
  uploadQrCodeForDigitalMenu as _uploadQrCodeForDigitalMenu,
  getDigitalMenuQrCodeUrl as _getDigitalMenuQrCodeUrl,
  getDigitalMenuWithTemplate as _getDigitalMenuWithTemplate,
} from "@/lib/actions/digital-menu-actions"

// Export from digital-menu-actions.ts
export const getDigitalMenus = _getDigitalMenus
export const getDigitalMenuById = _getDigitalMenuById
export const createDigitalMenu = _createDigitalMenu
export const updateDigitalMenu = _updateDigitalMenu
export const deleteDigitalMenu = _deleteDigitalMenu
export const uploadQrCodeForDigitalMenu = _uploadQrCodeForDigitalMenu
export const getDigitalMenuQrCodeUrl = _getDigitalMenuQrCodeUrl
export const getDigitalMenuWithTemplate = _getDigitalMenuWithTemplate

// Import from menu-item-actions.ts
import {
  getMenuItems as _getMenuItems,
  getMenuItemById as _getMenuItemById,
  createMenuItem as _createMenuItem,
  updateMenuItem as _updateMenuItem,
  deleteMenuItem as _deleteMenuItem,
  getMenuItemsByMenuId as _getMenuItemsByMenuId,
  getMenuItemDetails as _getMenuItemDetails,
  getMenuItemIngredients as _getMenuItemIngredients,
  updateMenuItemIngredients as _updateMenuItemIngredients,
  getMenuItemCategories as _getMenuItemCategories,
  getMenuItemReusableItems as _getMenuItemReusableItems,
  updateMenuItemReusableItems as _updateMenuItemReusableItems,
  updateMenuItemOrder as _updateMenuItemOrder,
} from "@/lib/actions/menu-item-actions"

// Export from menu-item-actions.ts
export const getMenuItems = _getMenuItems
export const getMenuItemById = _getMenuItemById
export const createMenuItem = _createMenuItem
export const updateMenuItem = _updateMenuItem
export const deleteMenuItem = _deleteMenuItem
export const getMenuItemsByMenuId = _getMenuItemsByMenuId
export const getMenuItemDetails = _getMenuItemDetails
export const getMenuItemIngredients = _getMenuItemIngredients
export const updateMenuItemIngredients = _updateMenuItemIngredients
export const getMenuItemCategories = _getMenuItemCategories
export const getMenuItemReusableItems = _getMenuItemReusableItems
export const updateMenuItemReusableItems = _updateMenuItemReusableItems
export const updateMenuItemOrder = _updateMenuItemOrder

// Import from category-actions.ts
import {
  getCategories as _getCategories,
  createCategory as _createCategory,
  updateCategory as _updateCategory,
  deleteCategory as _deleteCategory,
  getMenuCategoriesForDigitalMenu as _getMenuCategoriesForDigitalMenu,
  getAllGlobalCategories as _getAllGlobalCategories,
} from "@/lib/actions/category-actions"

// Export from category-actions.ts
export const getCategories = _getCategories
export const createCategory = _createCategory
export const updateCategory = _updateCategory
export const deleteCategory = _deleteCategory
export const getMenuCategoriesForDigitalMenu = _getMenuCategoriesForDigitalMenu
export const getAllGlobalCategories = _getAllGlobalCategories

// Import from template-actions.ts
import {
  getTemplates as _getTemplates,
  getTemplateById as _getTemplateById,
  createTemplate as _createTemplate,
  updateTemplate as _updateTemplate,
  deleteTemplate as _deleteTemplate,
  applyTemplateToMenu as _applyTemplateToMenu,
  generateTemplateWithAI as _generateTemplateWithAI,
  seedDefaultTemplates as _seedDefaultTemplates,
} from "@/lib/actions/template-actions"

// Export from template-actions.ts (using aliases for old names)
export const getTemplates = _getTemplates
export const getMenuTemplates = _getTemplates
export const getTemplateById = _getTemplateById
export const getMenuTemplateById = _getTemplateById
export const createTemplate = _createTemplate
export const createMenuTemplate = _createTemplate
export const updateTemplate = _updateTemplate
export const updateMenuTemplate = _updateTemplate
export const deleteTemplate = _deleteTemplate
export const deleteMenuTemplate = _deleteTemplate
export const applyTemplateToMenu = _applyTemplateToMenu
export const generateTemplateWithAI = _generateTemplateWithAI
export const seedDefaultTemplates = _seedDefaultTemplates

// Import from cost-actions.ts
import {
  getCosts as _getCosts,
  updateCost as _updateCost,
  deleteCost as _deleteCost,
  getRecipeCosts as _getRecipeCosts,
  getIngredients as _getIngredients,
  updateIngredientCost as _updateIngredientCost,
  createCost as _createCost,
} from "@/lib/actions/cost-actions"

// Export from cost-actions.ts (using alias for old name)
export const getCosts = _getCosts
export const getCostAnalysis = _getCosts
export const updateCost = _updateCost
export const deleteCost = _deleteCost
export const getRecipeCosts = _getRecipeCosts
export const getIngredients = _getIngredients
export const updateIngredientCost = _updateIngredientCost
export const createCost = _createCost

// Import from inventory-actions.ts
import {
  getInventoryItems as _getInventoryItems,
  createInventoryItem as _createInventoryItem,
  updateInventoryItem as _updateInventoryItem,
  deleteInventoryItem as _deleteInventoryItem,
  createInventoryAdjustment as _createInventoryAdjustment,
  getInventoryHistory as _getInventoryHistory,
} from "@/lib/actions/inventory-actions"

// Export from inventory-actions.ts (using alias for old name)
export const getInventoryItems = _getInventoryItems
export const getInventoryLevels = _getInventoryItems
export const createInventoryItem = _createInventoryItem
export const updateInventoryItem = _updateInventoryItem
export const deleteInventoryItem = _deleteInventoryItem
export const createInventoryAdjustment = _createInventoryAdjustment
export const getInventoryHistory = _getInventoryHistory

// Import from restaurant-actions.ts
import {
  getRestaurantDetails as _getRestaurantDetails,
  updateRestaurantDetails as _updateRestaurantDetails,
} from "@/lib/actions/restaurant-actions"

// Export from restaurant-actions.ts (using aliases for old names)
export const getRestaurantDetails = _getRestaurantDetails
export const getRestaurantProfile = _getRestaurantDetails
export const updateRestaurantDetails = _updateRestaurantDetails
export const updateRestaurantProfile = _updateRestaurantDetails

// Import from reusable-menu-item-actions.ts
import {
  getReusableMenuItems as _getReusableMenuItems,
  createReusableMenuItem as _createReusableMenuItem,
  updateReusableMenuItem as _updateReusableMenuItem,
  deleteReusableMenuItem as _deleteReusableMenuItem,
} from "@/lib/actions/reusable-menu-item-actions"

// Export from reusable-menu-item-actions.ts
export const getReusableMenuItems = _getReusableMenuItems
export const createReusableMenuItem = _createReusableMenuItem
export const updateReusableMenuItem = _updateReusableMenuItem
export const deleteReusableMenuItem = _deleteReusableMenuItem

// Import from supplier-actions.ts
import {
  getSuppliers as _getSuppliers,
  getSupplierById as _getSupplierById,
  createSupplier as _createSupplier,
  updateSupplier as _updateSupplier,
  deleteSupplier as _deleteSupplier,
} from "@/lib/actions/supplier-actions"

// Export from supplier-actions.ts
export const getSuppliers = _getSuppliers
export const getSupplierById = _getSupplierById
export const createSupplier = _createSupplier
export const updateSupplier = _updateSupplier
export const deleteSupplier = _deleteSupplier

// Import from ai-menu-actions.ts
import {
  mockAiMenuUpload as _mockAiMenuUpload,
  processMenuWithAI as _processMenuWithAI,
  generateMenuDescription as _generateMenuDescription,
} from "@/lib/actions/ai-menu-actions"

// Export from ai-menu-actions.ts
export const mockAiMenuUpload = _mockAiMenuUpload
export const processMenuWithAI = _processMenuWithAI
export const generateMenuDescription = _generateMenuDescription

// Import from brand-kit-actions.ts
import {
  getBrandKit as _getBrandKit,
  updateBrandKit as _updateBrandKit,
  createBrandKit as _createBrandKit,
} from "@/lib/actions/brand-kit-actions"

// Export from brand-kit-actions.ts
export const getBrandKit = _getBrandKit
export const updateBrandKit = _updateBrandKit
export const createBrandKit = _createBrandKit

// Import from recipe-actions.ts
import {
  getRecipes as _getRecipes,
  getRecipeById as _getRecipeById,
  createRecipe as _createRecipe,
  updateRecipe as _updateRecipe,
  deleteRecipe as _deleteRecipe,
} from "@/lib/actions/recipe-actions"

// Export from recipe-actions.ts
export const getRecipes = _getRecipes
export const getRecipeById = _getRecipeById
export const createRecipe = _createRecipe
export const updateRecipe = _updateRecipe
export const deleteRecipe = _deleteRecipe
