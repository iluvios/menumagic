-- Proposed simplified menu_items table structure
-- This would replace both current tables

CREATE TABLE IF NOT EXISTS menu_items_new (
    id SERIAL PRIMARY KEY,
    digital_menu_id INT NOT NULL REFERENCES digital_menus(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    image_url TEXT,
    menu_category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    order_index INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Show what this would look like
SELECT 'Proposed simplified structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menu_items_new' 
ORDER BY ordinal_position;
