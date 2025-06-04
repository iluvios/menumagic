-- Ensure the reusable_dish_ingredients table exists with correct structure
CREATE TABLE IF NOT EXISTS reusable_dish_ingredients (
    id SERIAL PRIMARY KEY,
    reusable_menu_item_id INTEGER NOT NULL REFERENCES reusable_menu_items(id) ON DELETE CASCADE,
    ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
    quantity_used DECIMAL(10,3) NOT NULL,
    unit_used VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(reusable_menu_item_id, ingredient_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reusable_dish_ingredients_reusable_menu_item_id 
ON reusable_dish_ingredients(reusable_menu_item_id);

CREATE INDEX IF NOT EXISTS idx_reusable_dish_ingredients_ingredient_id 
ON reusable_dish_ingredients(ingredient_id);
