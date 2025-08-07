-- Drop the existing menu_item_ingredients table
DROP TABLE IF EXISTS menu_item_ingredients;

-- Create the menu_item_ingredients table with the correct foreign key
CREATE TABLE menu_item_ingredients (
    id SERIAL PRIMARY KEY,
    menu_item_id INTEGER NOT NULL REFERENCES dishes(id), -- Corrected foreign key
    ingredient_id INTEGER NOT NULL,
    quantity_used DECIMAL(10, 2) NOT NULL,
    unit_used VARCHAR(50) NOT NULL,
    cost_per_unit DECIMAL(10, 2) NOT NULL,
    total_cost DECIMAL(10, 2) NOT NULL,
    ingredient_base_unit VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);
