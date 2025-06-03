"use server"

import { sql } from "@/lib/db"

export async function seedDatabase() {
  try {
    console.log("Starting comprehensive database seeding...")

    // --- 1. Create a default Restaurant and User ---
    const restaurantResult = await sql`
      INSERT INTO restaurants (name, owner_user_id, address_json, phone, email, cuisine_type, operating_hours_json, currency_code, timezone, default_tax_rate_percentage)
      VALUES (
        'El Sabor Mexicano', 
        1, -- Assuming a default user with ID 1 exists or will be created
        ${JSON.stringify({ street: "Av. Siempre Viva 742", city: "Springfield", state: "CDMX", zip: "00000" })}, 
        '+52 55 1234 5678', 
        'contacto@elsabormexicano.com', 
        'Mexicana', 
        ${JSON.stringify({ "Lunes-Viernes": "12:00-22:00", "Sabado-Domingo": "13:00-23:00" })}, 
        'MXN', 
        'America/Mexico_City', 
        16.00
      )
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `
    const restaurantId =
      restaurantResult[0]?.id || (await sql`SELECT id FROM restaurants WHERE name = 'El Sabor Mexicano'`)[0]?.id

    const userResult = await sql`
      INSERT INTO users (email, password_hash, full_name, role)
      VALUES ('admin@example.com', 'hashed_password_for_demo', 'Admin User', 'owner')
      ON CONFLICT (email) DO NOTHING
      RETURNING id
    `
    const userId = userResult[0]?.id || (await sql`SELECT id FROM users WHERE email = 'admin@example.com'`)[0]?.id

    if (restaurantId && userId) {
      await sql`
        INSERT INTO restaurant_users (restaurant_id, user_id, role_in_restaurant)
        VALUES (${restaurantId}, ${userId}, 'owner')
        ON CONFLICT DO NOTHING
      `
    }

    // --- 2. Create Categories (for recipes, ingredients, suppliers) ---
    const categories = [
      { name: "Entradas", type: "recipe", restaurant_id: restaurantId },
      { name: "Platos Principales", type: "recipe", restaurant_id: restaurantId },
      { name: "Postres", type: "recipe", restaurant_id: restaurantId },
      { name: "Bebidas", type: "recipe", restaurant_id: restaurantId },
      { name: "Carnes", type: "ingredient", restaurant_id: restaurantId },
      { name: "Vegetales", type: "ingredient", restaurant_id: restaurantId },
      { name: "Lácteos", type: "ingredient", restaurant_id: restaurantId },
      { name: "Especias", type: "ingredient", restaurant_id: restaurantId },
      { name: "Granos", type: "ingredient", restaurant_id: restaurantId },
      { name: "Aves", type: "ingredient", restaurant_id: restaurantId },
      { name: "Pescados", type: "ingredient", restaurant_id: restaurantId },
      { name: "Carnes y Aves", type: "supplier", restaurant_id: restaurantId },
      { name: "Productos Lácteos", type: "supplier", restaurant_id: restaurantId },
      { name: "Vegetales y Frutas", type: "supplier", restaurant_id: restaurantId },
      { name: "Bebidas y Licores", type: "supplier", restaurant_id: restaurantId },
    ]

    for (const category of categories) {
      await sql`
        INSERT INTO categories (name, type, restaurant_id)
        VALUES (${category.name}, ${category.type}, ${category.restaurant_id})
        ON CONFLICT (name, type) DO NOTHING
      `
    }

    const categoryMap = (await sql`SELECT id, name, type FROM categories WHERE restaurant_id = ${restaurantId}`).reduce(
      (map, cat) => {
        map[`${cat.name}_${cat.type}`] = cat.id
        return map
      },
      {},
    )

    // --- 3. Create Suppliers ---
    const suppliers = [
      {
        name: "Carnes Premium S.A.",
        restaurant_id: restaurantId,
        supplier_category: "Carnes y Aves",
        email: "ventas@carnespremium.com",
        phone: "+52 55 1234 5678",
        address: JSON.stringify({ street: "Av. Principal 100", city: "Ciudad de México" }),
        tax_id: "CPR850123ABC",
        contact_person: "Juan Pérez",
        payment_terms_text: "Neto 30 días",
      },
      {
        name: "Lácteos del Valle",
        restaurant_id: restaurantId,
        supplier_category: "Productos Lácteos",
        email: "pedidos@lacteosdelval.com",
        phone: "+52 55 2345 6789",
        address: JSON.stringify({ street: "Calle Láctea 200", city: "Guadalajara" }),
        tax_id: "LDV920456DEF",
        contact_person: "María González",
        payment_terms_text: "Neto 15 días",
      },
      {
        name: "Vegetales Frescos",
        restaurant_id: restaurantId,
        supplier_category: "Vegetales y Frutas",
        email: "info@vegetalesfrescos.com",
        phone: "+52 55 3456 7890",
        address: JSON.stringify({ street: "Mercado Central 300", city: "Monterrey" }),
        tax_id: "VEF880789GHI",
        contact_person: "Carlos López",
        payment_terms_text: "Pago al contado",
      },
    ]

    for (const supplier of suppliers) {
      await sql`
        INSERT INTO suppliers (restaurant_id, name, supplier_category, email, phone, address_json, tax_id, contact_person, payment_terms_text)
        VALUES (${supplier.restaurant_id}, ${supplier.name}, ${supplier.supplier_category}, ${supplier.email}, ${supplier.phone}, ${supplier.address}, ${supplier.tax_id}, ${supplier.contact_person}, ${supplier.payment_terms_text})
        ON CONFLICT (name) DO NOTHING
      `
    }

    const supplierMap = (await sql`SELECT id, name FROM suppliers WHERE restaurant_id = ${restaurantId}`).reduce(
      (map, sup) => {
        map[sup.name] = sup.id
        return map
      },
      {},
    )

    // --- 4. Create Ingredients ---
    const ingredients = [
      {
        sku: "ING001",
        name: "Carne de Res (molida)",
        restaurant_id: restaurantId,
        category_id: categoryMap["Carnes_ingredient"],
        preferred_supplier_id: supplierMap["Carnes Premium S.A."],
        purchase_unit: "kg",
        purchase_unit_cost: 150.0,
        storage_unit: "gramo",
        conversion_factor_purchase_to_storage: 1000, // 1 kg = 1000 grams
        cost_per_unit: 0.15, // 150 / 1000
        low_stock_threshold_quantity: 5000, // 5 kg
      },
      {
        sku: "ING002",
        name: "Pechuga de Pollo (fresca)",
        restaurant_id: restaurantId,
        category_id: categoryMap["Aves_ingredient"],
        preferred_supplier_id: supplierMap["Carnes Premium S.A."],
        purchase_unit: "kg",
        purchase_unit_cost: 90.0,
        storage_unit: "gramo",
        conversion_factor_purchase_to_storage: 1000,
        cost_per_unit: 0.09,
        low_stock_threshold_quantity: 3000, // 3 kg
      },
      {
        sku: "ING003",
        name: "Tomate Rojo",
        restaurant_id: restaurantId,
        category_id: categoryMap["Vegetales_ingredient"],
        preferred_supplier_id: supplierMap["Vegetales Frescos"],
        purchase_unit: "kg",
        purchase_unit_cost: 20.0,
        storage_unit: "gramo",
        conversion_factor_purchase_to_storage: 1000,
        cost_per_unit: 0.02,
        low_stock_threshold_quantity: 10000, // 10 kg
      },
      {
        sku: "ING004",
        name: "Cebolla Blanca",
        restaurant_id: restaurantId,
        category_id: categoryMap["Vegetales_ingredient"],
        preferred_supplier_id: supplierMap["Vegetales Frescos"],
        purchase_unit: "kg",
        purchase_unit_cost: 15.0,
        storage_unit: "gramo",
        conversion_factor_purchase_to_storage: 1000,
        cost_per_unit: 0.015,
        low_stock_threshold_quantity: 8000, // 8 kg
      },
      {
        sku: "ING005",
        name: "Queso Oaxaca",
        restaurant_id: restaurantId,
        category_id: categoryMap["Lácteos_ingredient"],
        preferred_supplier_id: supplierMap["Lácteos del Valle"],
        purchase_unit: "kg",
        purchase_unit_cost: 120.0,
        storage_unit: "gramo",
        conversion_factor_purchase_to_storage: 1000,
        cost_per_unit: 0.12,
        low_stock_threshold_quantity: 2000, // 2 kg
      },
      {
        sku: "ING006",
        name: "Tortillas de Maíz",
        restaurant_id: restaurantId,
        category_id: categoryMap["Granos_ingredient"],
        preferred_supplier_id: null,
        purchase_unit: "kg",
        purchase_unit_cost: 18.0,
        storage_unit: "unidad",
        conversion_factor_purchase_to_storage: 20, // 1 kg = approx 20 tortillas
        cost_per_unit: 0.9, // 18 / 20
        low_stock_threshold_quantity: 100, // 100 units
      },
      {
        sku: "ING007",
        name: "Aguacate",
        restaurant_id: restaurantId,
        category_id: categoryMap["Vegetales_ingredient"],
        preferred_supplier_id: supplierMap["Vegetales Frescos"],
        purchase_unit: "kg",
        purchase_unit_cost: 40.0,
        storage_unit: "unidad",
        conversion_factor_purchase_to_storage: 4, // 1 kg = approx 4 avocados
        cost_per_unit: 10.0,
        low_stock_threshold_quantity: 20, // 20 units
      },
    ]

    for (const ingredient of ingredients) {
      await sql`
        INSERT INTO ingredients (
          restaurant_id, sku, name, category_id, preferred_supplier_id,
          purchase_unit, purchase_unit_cost, storage_unit, conversion_factor_purchase_to_storage,
          cost_per_unit, low_stock_threshold_quantity
        )
        VALUES (
          ${ingredient.restaurant_id}, ${ingredient.sku}, ${ingredient.name}, ${ingredient.category_id}, ${ingredient.preferred_supplier_id},
          ${ingredient.purchase_unit}, ${ingredient.purchase_unit_cost}, ${ingredient.storage_unit}, ${ingredient.conversion_factor_purchase_to_storage},
          ${ingredient.cost_per_unit}, ${ingredient.low_stock_threshold_quantity}
        )
        ON CONFLICT (sku) DO NOTHING
      `
    }

    const ingredientMap = (
      await sql`SELECT id, name, sku FROM ingredients WHERE restaurant_id = ${restaurantId}`
    ).reduce((map, ing) => {
      map[ing.name] = ing.id
      map[ing.sku] = ing.id
      return map
    }, {})

    // --- 5. Create Recipes ---
    const recipes = [
      {
        sku: "REC001",
        name: "Tacos al Pastor",
        restaurant_id: restaurantId,
        category_id: categoryMap["Platos Principales_recipe"],
        type: "recipe",
        image_url: "/placeholder.svg?height=400&width=400",
        status: "active",
        cost: 35.0, // Calculated based on ingredients below
        selling_price: 90.0,
        margin_percentage: 61.11,
        yield_amount: 3, // 3 tacos per portion
        yield_unit: "tacos",
        preparation_instructions: "Marinar la carne, cocinar en trompo, servir con piña y cilantro.",
        is_subrecipe: false,
        allergens: ["Gluten"],
      },
      {
        sku: "REC002",
        name: "Guacamole Fresco",
        restaurant_id: restaurantId,
        category_id: categoryMap["Entradas_recipe"],
        type: "recipe",
        image_url: "/placeholder.svg?height=400&width=400",
        status: "active",
        cost: 20.0,
        selling_price: 60.0,
        margin_percentage: 66.67,
        yield_amount: 1,
        yield_unit: "porción",
        preparation_instructions: "Machacar aguacates, añadir cebolla, tomate, cilantro y limón.",
        is_subrecipe: true, // This can be a subrecipe
        allergens: [],
      },
      {
        sku: "REC003",
        name: "Enchiladas Suizas",
        restaurant_id: restaurantId,
        category_id: categoryMap["Platos Principales_recipe"],
        type: "recipe",
        image_url: "/placeholder.svg?height=400&width=400",
        status: "active",
        cost: 45.0,
        selling_price: 110.0,
        margin_percentage: 59.09,
        yield_amount: 2, // 2 enchiladas per portion
        yield_unit: "enchiladas",
        preparation_instructions: "Rellenar tortillas con pollo, bañar en salsa verde y queso, hornear.",
        is_subrecipe: false,
        allergens: ["Lácteos", "Gluten"],
      },
    ]

    for (const recipe of recipes) {
      await sql`
        INSERT INTO recipes (
          restaurant_id, sku, name, category_id, type, image_url, status, 
          cost, selling_price, margin_percentage, yield_amount, yield_unit, 
          preparation_instructions, is_subrecipe, allergens
        )
        VALUES (
          ${recipe.restaurant_id}, ${recipe.sku}, ${recipe.name}, ${recipe.category_id}, ${recipe.type}, ${recipe.image_url}, ${recipe.status}, 
          ${recipe.cost}, ${recipe.selling_price}, ${recipe.margin_percentage}, ${recipe.yield_amount}, ${recipe.yield_unit}, 
          ${recipe.preparation_instructions}, ${recipe.is_subrecipe}, ${recipe.allergens}
        )
        ON CONFLICT (sku) DO NOTHING
        RETURNING id
      `
    }

    const recipeMap = (await sql`SELECT id, name, sku FROM recipes WHERE restaurant_id = ${restaurantId}`).reduce(
      (map, rec) => {
        map[rec.name] = rec.id
        map[rec.sku] = rec.id
        return map
      },
      {},
    )

    // --- 6. Create Recipe Ingredients ---
    const recipeIngredients = [
      // Tacos al Pastor
      {
        recipe_id: recipeMap["Tacos al Pastor"],
        ingredient_id: ingredientMap["ING001"],
        quantity: 150,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.15 * 150,
      },
      {
        recipe_id: recipeMap["Tacos al Pastor"],
        ingredient_id: ingredientMap["ING006"],
        quantity: 3,
        unit: "unidad",
        cost_for_this_ingredient_in_recipe: 0.9 * 3,
      },
      {
        recipe_id: recipeMap["Tacos al Pastor"],
        ingredient_id: ingredientMap["ING003"],
        quantity: 50,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.02 * 50,
      },
      {
        recipe_id: recipeMap["Tacos al Pastor"],
        ingredient_id: ingredientMap["ING004"],
        quantity: 30,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.015 * 30,
      },

      // Guacamole Fresco
      {
        recipe_id: recipeMap["Guacamole Fresco"],
        ingredient_id: ingredientMap["ING007"],
        quantity: 2,
        unit: "unidad",
        cost_for_this_ingredient_in_recipe: 10.0 * 2,
      },
      {
        recipe_id: recipeMap["Guacamole Fresco"],
        ingredient_id: ingredientMap["ING003"],
        quantity: 50,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.02 * 50,
      },
      {
        recipe_id: recipeMap["Guacamole Fresco"],
        ingredient_id: ingredientMap["ING004"],
        quantity: 20,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.015 * 20,
      },

      // Enchiladas Suizas
      {
        recipe_id: recipeMap["Enchiladas Suizas"],
        ingredient_id: ingredientMap["ING002"],
        quantity: 100,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.09 * 100,
      },
      {
        recipe_id: recipeMap["Enchiladas Suizas"],
        ingredient_id: ingredientMap["ING006"],
        quantity: 2,
        unit: "unidad",
        cost_for_this_ingredient_in_recipe: 0.9 * 2,
      },
      {
        recipe_id: recipeMap["Enchiladas Suizas"],
        ingredient_id: ingredientMap["ING005"],
        quantity: 80,
        unit: "gramo",
        cost_for_this_ingredient_in_recipe: 0.12 * 80,
      },
    ]

    for (const ri of recipeIngredients) {
      if (ri.recipe_id && ri.ingredient_id) {
        await sql`
          INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity, unit, cost_for_this_ingredient_in_recipe)
          VALUES (${ri.recipe_id}, ${ri.ingredient_id}, ${ri.quantity}, ${ri.unit}, ${ri.cost_for_this_ingredient_in_recipe})
          ON CONFLICT (recipe_id, ingredient_id) DO NOTHING
        `
      }
    }

    // --- 7. Create Digital Menus and Menu Items ---
    const digitalMenuResult = await sql`
      INSERT INTO digital_menus (restaurant_id, name, status, qr_code_url)
      VALUES (${restaurantId}, 'Menú Principal Digital', 'active', '/placeholder.svg?height=200&width=200')
      ON CONFLICT (name) DO NOTHING
      RETURNING id
    `
    const digitalMenuId =
      digitalMenuResult[0]?.id || (await sql`SELECT id FROM digital_menus WHERE name = 'Menú Principal Digital'`)[0]?.id

    const menuItems = [
      {
        digital_menu_id: digitalMenuId,
        menu_category_id: categoryMap["Platos Principales_recipe"],
        name: "Tacos al Pastor (Digital)",
        description: "Deliciosos tacos de carne de cerdo marinada, servidos con piña, cebolla y cilantro.",
        price: 95.0,
        image_url: "/placeholder.svg?height=300&width=300",
        recipe_id: recipeMap["Tacos al Pastor"],
        display_order: 1,
      },
      {
        digital_menu_id: digitalMenuId,
        menu_category_id: categoryMap["Entradas_recipe"],
        name: "Guacamole con Totopos",
        description:
          "Aguacate fresco machacado con tomate, cebolla, cilantro y un toque de limón, acompañado de totopos crujientes.",
        price: 70.0,
        image_url: "/placeholder.svg?height=300&width=300",
        recipe_id: recipeMap["Guacamole Fresco"],
        display_order: 2,
      },
      {
        digital_menu_id: digitalMenuId,
        menu_category_id: categoryMap["Platos Principales_recipe"],
        name: "Enchiladas Suizas (Digital)",
        description: "Tortillas rellenas de pollo, bañadas en salsa verde cremosa y gratinadas con queso.",
        price: 120.0,
        image_url: "/placeholder.svg?height=300&width=300",
        recipe_id: recipeMap["Enchiladas Suizas"],
        display_order: 3,
      },
    ]

    for (const menuItem of menuItems) {
      await sql`
        INSERT INTO menu_items (digital_menu_id, menu_category_id, name, description, price, image_url, recipe_id, display_order)
        VALUES (
          ${menuItem.digital_menu_id}, ${menuItem.menu_category_id}, ${menuItem.name}, ${menuItem.description}, ${menuItem.price}, 
          ${menuItem.image_url}, ${menuItem.recipe_id}, ${menuItem.display_order}
        )
        ON CONFLICT DO NOTHING
      `
    }

    // --- 8. Create Brand Kit and Assets ---
    const brandKitResult = await sql`
      INSERT INTO brand_kits (restaurant_id, logo_url, primary_color_hex, font_family_main, font_family_secondary)
      VALUES (${restaurantId}, '/placeholder.svg?height=100&width=100', '#F59E0B', 'Inter', 'Lora')
      ON CONFLICT DO NOTHING
      RETURNING id
    `
    const brandKitId =
      brandKitResult[0]?.id || (await sql`SELECT id FROM brand_kits WHERE restaurant_id = ${restaurantId}`)[0]?.id

    if (brandKitId) {
      const brandAssets = [
        {
          brand_kit_id: brandKitId,
          asset_name: "Fondo de Menú",
          asset_url: "/placeholder.svg?height=400&width=600",
          asset_type: "image",
        },
        {
          brand_kit_id: brandKitId,
          asset_name: "Imagen de Galería 1",
          asset_url: "/placeholder.svg?height=300&width=400",
          asset_type: "image",
        },
      ]
      for (const asset of brandAssets) {
        await sql`
          INSERT INTO brand_assets (brand_kit_id, asset_name, asset_url, asset_type)
          VALUES (${asset.brand_kit_id}, ${asset.asset_name}, ${asset.asset_url}, ${asset.asset_type})
          ON CONFLICT DO NOTHING
        `
      }
    }

    // --- 9. Create Inventory Stock Levels (initial stock) ---
    const initialStockLevels = [
      { ingredient_id: ingredientMap["ING001"], quantity: 10000, unit: "gramo", reason: "initial_stock" }, // 10 kg
      { ingredient_id: ingredientMap["ING002"], quantity: 5000, unit: "gramo", reason: "initial_stock" }, // 5 kg
      { ingredient_id: ingredientMap["ING003"], quantity: 15000, unit: "gramo", reason: "initial_stock" }, // 15 kg
      { ingredient_id: ingredientMap["ING004"], quantity: 12000, unit: "gramo", reason: "initial_stock" }, // 12 kg
      { ingredient_id: ingredientMap["ING005"], quantity: 3000, unit: "gramo", reason: "initial_stock" }, // 3 kg
      { ingredient_id: ingredientMap["ING006"], quantity: 200, unit: "unidad", reason: "initial_stock" }, // 200 tortillas
      { ingredient_id: ingredientMap["ING007"], quantity: 30, unit: "unidad", reason: "initial_stock" }, // 30 avocados
    ]

    for (const stock of initialStockLevels) {
      if (stock.ingredient_id) {
        await sql`
          INSERT INTO inventory_stock_levels (ingredient_id, current_quantity_in_storage_units, last_updated_at)
          VALUES (${stock.ingredient_id}, ${stock.quantity}, CURRENT_TIMESTAMP)
          ON CONFLICT (ingredient_id) DO UPDATE
          SET current_quantity_in_storage_units = EXCLUDED.current_quantity_in_storage_units, last_updated_at = CURRENT_TIMESTAMP
        `
        await sql`
          INSERT INTO inventory_adjustments (ingredient_id, quantity_adjusted, reason_code, notes, user_id)
          VALUES (${stock.ingredient_id}, ${stock.quantity}, ${stock.reason}, 'Initial stock count', ${userId})
        `
      }
    }

    console.log("Comprehensive database seeding completed successfully!")
    return { success: true, message: "Database seeded successfully" }
  } catch (error) {
    console.error("Error seeding database:", error)
    return { success: false, error: "Failed to seed database" }
  }
}
