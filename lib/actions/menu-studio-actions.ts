// This file re-exports all actions related to the menu studio for easier import management.

export {
  getDigitalMenus,
  getDigitalMenuById,
  getDigitalMenuWithTemplate, // Added missing export
  createDigitalMenu,
  updateDigitalMenu,
  deleteDigitalMenu,
  uploadQrCodeForDigitalMenu,
  getMenuItemsByMenuId,
  getMenuCategoriesForDigitalMenu,
  applyTemplateToMenu,
} from "./digital-menu-actions"

export {
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  reorderMenuItems,
  updateMenuItemOrder, // Added missing export
} from "./menu-item-actions"

export {
  getReusableMenuItems,
  createReusableMenuItem,
  updateReusableMenuItem,
  deleteReusableMenuItem,
} from "./reusable-menu-item-actions"

export {
  mockAiMenuUpload, // Renamed from processMenuImage to match expected export
  processMenuWithAI,
} from "./ai-menu-actions"

export {
  getMenuTemplates,
  createMenuTemplate,
  updateMenuTemplate,
  deleteMenuTemplate,
} from "./menu-template-actions"

export {
  getAllGlobalCategories,
  getCategories, // Alias for getAllGlobalCategories
  createCategory, // Renamed from createGlobalCategory
  updateCategory, // Renamed from updateGlobalCategory
  deleteCategory, // Renamed from deleteGlobalCategory
  reorderGlobalCategories,
  addCategoryToDigitalMenu,
  removeCategoryFromDigitalMenu,
  reorderDigitalMenuCategories,
} from "./category-actions"

export {
  getRecipes,
  getRecipeById,
  getIngredientsForRecipe,
  createRecipe,
  updateRecipe,
  deleteRecipe,
} from "./recipe-actions"
