-- Create reusable_menu_items table (global dishes/recipes)
CREATE TABLE IF NOT EXISTS reusable_menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    menu_category_id INT REFERENCES categories(id) ON DELETE SET NULL, -- Link to a global category
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a unique constraint for name per restaurant for reusable items
ALTER TABLE reusable_menu_items
ADD CONSTRAINT unique_reusable_menu_item_name_per_restaurant UNIQUE (restaurant_id, name);

-- Create reusable_dish_ingredients table (ingredients for reusable dishes/recipes)
CREATE TABLE IF NOT EXISTS reusable_dish_ingredients (
    id SERIAL PRIMARY KEY,
    reusable_menu_item_id INT NOT NULL REFERENCES reusable_menu_items(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10, 4) NOT NULL,
    unit_used VARCHAR(50) NOT NULL, -- e.g., 'grams', 'ml', 'units'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (reusable_menu_item_id, ingredient_id) -- An ingredient can only be listed once per dish
);

-- Add reusable_menu_item_id to menu_items table
ALTER TABLE menu_items
ADD COLUMN reusable_menu_item_id INT REFERENCES reusable_menu_items(id) ON DELETE SET NULL;

-- Create sales_transactions table
CREATE TABLE IF NOT EXISTS sales_transactions (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    menu_item_id INT NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    quantity_sold DECIMAL(10, 2) NOT NULL,
    sale_price DECIMAL(10, 2) NOT NULL,
    sale_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    order_reference VARCHAR(255), -- e.g., order ID from POS
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_deductions table
CREATE TABLE IF NOT EXISTS inventory_deductions (
    id SERIAL PRIMARY KEY,
    sales_transaction_id INT NOT NULL REFERENCES sales_transactions(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_deducted DECIMAL(10, 4) NOT NULL,
    unit_deducted VARCHAR(50) NOT NULL,
    deduction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure inventory_stock_levels table exists and has necessary columns
-- This table is assumed to exist from previous context, but ensuring columns for clarity
CREATE TABLE IF NOT EXISTS inventory_stock_levels (
    id SERIAL PRIMARY KEY,
    restaurant_id INT NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    ingredient_id INT NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE UNIQUE,
    current_quantity_in_storage_units DECIMAL(10, 4) NOT NULL DEFAULT 0,
    storage_unit VARCHAR(50) NOT NULL, -- e.g., 'kg', 'liters', 'units'
    low_stock_threshold_quantity DECIMAL(10, 4) NOT NULL DEFAULT 0,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add a unique constraint for ingredient_id in inventory_stock_levels
ALTER TABLE inventory_stock_levels
ADD CONSTRAINT unique_ingredient_stock_per_restaurant UNIQUE (restaurant_id, ingredient_id);

-- Update the `ingredients` table to include `restaurant_id` and `unit`
ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE;

ALTER TABLE ingredients
ADD COLUMN IF NOT EXISTS unit VARCHAR(50);

-- Backfill existing ingredients with a default restaurant_id and unit if they don't have one
-- This assumes a default restaurant_id (e.g., 1) for existing data if not already linked
-- You might need to adjust this based on your actual data
UPDATE ingredients
SET restaurant_id = (SELECT id FROM restaurants LIMIT 1)
WHERE restaurant_id IS NULL;

UPDATE ingredients
SET unit = 'units'
WHERE unit IS NULL;

-- Make restaurant_id NOT NULL after backfilling
ALTER TABLE ingredients ALTER COLUMN restaurant_id SET NOT NULL;
ALTER TABLE ingredients ALTER COLUMN unit SET NOT NULL;

-- Add restaurant_id to categories table
ALTER TABLE categories
ADD COLUMN IF NOT EXISTS restaurant_id INT REFERENCES restaurants(id) ON DELETE CASCADE;

-- Backfill existing categories with a default restaurant_id
UPDATE categories
SET restaurant_id = (SELECT id FROM restaurants LIMIT 1)
WHERE restaurant_id IS NULL;

-- Make restaurant_id NOT NULL after backfilling
ALTER TABLE categories ALTER COLUMN restaurant_id SET NOT NULL;

-- Add unique constraint for category name and type per restaurant
ALTER TABLE categories
ADD CONSTRAINT unique_category_name_type_per_restaurant UNIQUE (restaurant_id, name, type);

-- Add unique constraint for ingredient name per restaurant
ALTER TABLE ingredients
ADD CONSTRAINT unique_ingredient_name_per_restaurant UNIQUE (restaurant_id, name);
