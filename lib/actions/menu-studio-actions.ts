"use server"

// FILE: lib/actions/menu-studio-actions.ts
// All functionalities re-enabled.

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
export const getDigitalMenus = _getDigitalMenus
export const getDigitalMenuById = _getDigitalMenuById
export const createDigitalMenu = _createDigitalMenu
export const updateDigitalMenu = _updateDigitalMenu
export const deleteDigitalMenu = _deleteDigitalMenu
export const uploadQrCodeForDigitalMenu = _uploadQrCodeForDigitalMenu
export const getDigitalMenuQrCodeUrl = _getDigitalMenuQrCodeUrl
export const getDigitalMenuWithTemplate = _getDigitalMenuWithTemplate

// Re-export from menu-item-actions.ts
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
  updateMenuItemOrder as _updateMenuItemOrder, // ADDED THIS LINE
} from "@/lib/actions/menu-item-actions"
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
export const updateMenuItemOrder = _updateMenuItemOrder // ADDED THIS LINE

// Re-export from category-actions.ts
import {
  getCategories as _getCategories,
  getCategoryById as _getCategoryById,
  createCategory as _createCategory,
  updateCategory as _updateCategory,
  deleteCategory as _deleteCategory,
  reorderCategories as _reorderCategories,
  getAllGlobalCategories as _getAllGlobalCategories,
  getMenuCategoriesForDigitalMenu as _getMenuCategoriesForDigitalMenu,
  addCategoryToDigitalMenu as _addCategoryToDigitalMenu,
  removeCategoryFromDigitalMenu as _removeCategoryFromDigitalMenu,
  updateDigitalMenuCategoryOrder as _updateDigitalMenuCategoryOrder,
} from "@/lib/actions/category-actions"
export const getCategories = _getCategories
export const getCategoryById = _getCategoryById
export const createCategory = _createCategory
export const updateCategory = _updateCategory
export const deleteCategory = _deleteCategory
export const reorderCategories = _reorderCategories
export const getAllGlobalCategories = _getAllGlobalCategories
export const getMenuCategoriesForDigitalMenu = _getMenuCategoriesForDigitalMenu
export const addCategoryToDigitalMenu = _addCategoryToDigitalMenu
export const removeCategoryFromDigitalMenu = _removeCategoryFromDigitalMenu
export const updateDigitalMenuCategoryOrder = _updateDigitalMenuCategoryOrder

// Re-export from reusable-menu-item-actions.ts
import {
  getReusableMenuItems as _getReusableMenuItems,
  getReusableMenuItemById as _getReusableMenuItemById,
  createReusableMenuItem as _createReusableMenuItem,
  updateReusableMenuItem as _updateReusableMenuItem,
  deleteReusableMenuItem as _deleteReusableMenuItem,
} from "@/lib/actions/reusable-menu-item-actions"
export const getReusableMenuItems = _getReusableMenuItems
export const getReusableMenuItemById = _getReusableMenuItemById
export const createReusableMenuItem = _createReusableMenuItem
export const updateReusableMenuItem = _updateReusableMenuItem
export const deleteReusableMenuItem = _deleteReusableMenuItem

// Re-export from template-actions.ts
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
export const getTemplates = _getTemplates
export const getTemplateById = _getTemplateById
export const createTemplate = _createTemplate
export const updateTemplate = _updateTemplate
export const deleteTemplate = _deleteTemplate
export const applyTemplateToMenu = _applyTemplateToMenu
export const generateTemplateWithAI = _generateTemplateWithAI
export const seedDefaultTemplates = _seedDefaultTemplates

// Re-export from cost-actions.ts
import {
  getCosts as _getCosts,
  updateCost as _updateCost,
  deleteCost as _deleteCost,
  getRecipeCosts as _getRecipeCosts,
  getIngredients as _getIngredients,
  updateIngredientCost as _updateIngredientCost,
  createCost as _createCost,
} from "@/lib/actions/cost-actions"
export const getCosts = _getCosts
export const updateCost = _updateCost
export const deleteCost = _deleteCost
export const getRecipeCosts = _getRecipeCosts
export const getIngredients = _getIngredients
export const updateIngredientCost = _updateIngredientCost
export const createCost = _createCost

// Re-export from inventory-actions.ts
import {
  getInventoryItems as _getInventoryItems,
  createInventoryItem as _createInventoryItem,
  updateInventoryItem as _updateInventoryItem,
  deleteInventoryItem as _deleteInventoryItem,
  createInventoryAdjustment as _createInventoryAdjustment,
  getInventoryHistory as _getInventoryHistory,
} from "@/lib/actions/inventory-actions"
export const getInventoryItems = _getInventoryItems
export const createInventoryItem = _createInventoryItem
export const updateInventoryItem = _updateInventoryItem
export const deleteInventoryItem = _deleteInventoryItem
export const createInventoryAdjustment = _createInventoryAdjustment
export const getInventoryHistory = _getInventoryHistory

// Re-export from restaurant-actions.ts
import {
  getRestaurantDetails as _getRestaurantDetails,
  updateRestaurantDetails as _updateRestaurantDetails,
} from "@/lib/actions/restaurant-actions"
export const getRestaurantDetails = _getRestaurantDetails
export const updateRestaurantDetails = _updateRestaurantDetails

// Re-export from supplier-actions.ts
import {
  getSuppliers as _getSuppliers,
  getSupplierById as _getSupplierById,
  createSupplier as _createSupplier,
  updateSupplier as _updateSupplier,
  deleteSupplier as _deleteSupplier,
} from "@/lib/actions/supplier-actions"
export const getSuppliers = _getSuppliers
export const getSupplierById = _getSupplierById
export const createSupplier = _createSupplier
export const updateSupplier = _updateSupplier
export const deleteSupplier = _deleteSupplier

// Re-export from ai-menu-actions.ts
import {
  mockAiMenuUpload as _mockAiMenuUpload,
  processMenuWithAI as _processMenuWithAI,
  generateMenuDescription as _generateMenuDescription,
} from "@/lib/actions/ai-menu-actions"
export const mockAiMenuUpload = _mockAiMenuUpload
export const processMenuWithAI = _processMenuWithAI
export const generateMenuDescription = _generateMenuDescription

// Re-export from brand-kit-actions.ts
import {
  getBrandKit as _getBrandKit,
  updateBrandKit as _updateBrandKit,
  uploadLogo as _uploadLogo,
  uploadFavicon as _uploadFavicon,
} from "@/lib/actions/brand-kit-actions"
export const getBrandKit = _getBrandKit
export const updateBrandKit = _updateBrandKit
export const uploadLogo = _uploadLogo
export const uploadFavicon = _uploadFavicon

// Re-export from recipe-actions.ts
import {
  getRecipes as _getRecipes,
  getRecipeById as _getRecipeById,
  createRecipe as _createRecipe,
  updateRecipe as _updateRecipe,
  deleteRecipe as _deleteRecipe,
  getRecipeIngredients as _getRecipeIngredients,
  updateRecipeIngredients as _updateRecipeIngredients,
} from "@/lib/actions/recipe-actions"
export const getRecipes = _getRecipes
export const getRecipeById = _getRecipeById
export const createRecipe = _createRecipe
export const updateRecipe = _updateRecipe
export const deleteRecipe = _deleteRecipe
export const getRecipeIngredients = _getRecipeIngredients
export const updateRecipeIngredients = _updateRecipeIngredients
