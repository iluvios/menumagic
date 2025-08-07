-- Proposed simplified structure (DO NOT RUN DIRECTLY)

-- Drop existing tables (backup data if needed)
-- DROP TABLE menu_items;
-- DROP TABLE digital_menu_categories;
-- DROP TABLE categories;

-- Create a single categories table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create a single menu_items table
CREATE TABLE menu_items (
    id SERIAL PRIMARY KEY,
    digital_menu_id INTEGER REFERENCES digital_menus(id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    image_url VARCHAR(255),
    is_available BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE
);
