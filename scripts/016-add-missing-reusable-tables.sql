-- Check if reusable_menu_items table exists, if not create it
CREATE TABLE IF NOT EXISTS reusable_menu_items (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2),
  menu_category_id INTEGER,
  restaurant_id INTEGER NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Check if reusable_dish_ingredients table exists, if not create it
CREATE TABLE IF NOT EXISTS reusable_dish_ingredients (
  id SERIAL PRIMARY KEY,
  reusable_menu_item_id INTEGER NOT NULL,
  ingredient_id INTEGER NOT NULL,
  quantity_used DECIMAL(10, 2) NOT NULL,
  unit_used VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reusable_menu_item FOREIGN KEY (reusable_menu_item_id) REFERENCES reusable_menu_items(id) ON DELETE CASCADE,
  CONSTRAINT fk_ingredient FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE
);

-- Add a reusable_menu_item_id column to menu_items if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'reusable_menu_item_id'
  ) THEN
    ALTER TABLE menu_items ADD COLUMN reusable_menu_item_id INTEGER;
  END IF;
END $$;
