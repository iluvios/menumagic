"use server"

// Re-export all actions from atomized files
export {
  getDigitalMenus,
  getDigitalMenuWithTemplate,
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  uploadQrCodeForDigitalMenu,
} from "./digital-menu-actions"

export {
  getMenuItemsByMenuId,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  updateMenuItemOrder,
} from "./menu-item-actions"

export {
  getReusableMenuItems,
  createReusableMenuItem,
  updateReusableMenuItem,
  deleteReusableMenuItem,
} from "./reusable-menu-item-actions"

export { mockAiMenuUpload, processMenuWithAI } from "./ai-menu-actions"

export { getMenuTemplates, getMenuTemplateById, applyTemplateToMenu } from "./menu-template-actions"

export {
  getAllGlobalCategories,
  getCategories, // Alias for getAllGlobalCategories
  getCategoriesByType,
  getMenuCategoriesForDigitalMenu,
  createCategory,
  addCategoryToDigitalMenu,
  removeCategoryFromDigitalMenu,
  updateCategory,
  updateDigitalMenuCategoryOrder,
  deleteCategory,
} from "./category-actions"

export {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getReusableMenuItemsForRecipesPage,
  getIngredientsForReusableDish,
  addReusableDishIngredient,
  updateReusableDishIngredient,
  removeReusableDishIngredient,
} from "./recipe-actions"
