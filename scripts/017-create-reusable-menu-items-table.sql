CREATE TABLE IF NOT EXISTS reusable_menu_items (
    id SERIAL PRIMARY KEY,
    restaurant_id INTEGER REFERENCES restaurants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    image_url TEXT,
    is_available BOOLEAN NOT NULL DEFAULT TRUE,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index for faster lookups by restaurant_id and category_id
CREATE INDEX IF NOT EXISTS idx_reusable_menu_items_restaurant_id ON reusable_menu_items (restaurant_id);
CREATE INDEX IF NOT EXISTS idx_reusable_menu_items_category_id ON reusable_menu_items (category_id);

-- Ensure updated_at is updated on each row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reusable_menu_items_updated_at ON reusable_menu_items;
CREATE TRIGGER update_reusable_menu_items_updated_at
BEFORE UPDATE ON reusable_menu_items
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
