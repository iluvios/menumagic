-- This script proposes a simplified menu structure
-- It is not meant to be executed directly, but rather to illustrate the concept

-- Drop existing tables (backup data first if needed)
-- DROP TABLE menu_items;
-- DROP TABLE menu_categories;

-- Create a single table for menu items
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    digital_menu_id INTEGER REFERENCES digital_menus(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);
