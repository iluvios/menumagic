-- Create the single global dishes table (rename reusable_menu_items to dishes)
ALTER TABLE reusable_menu_items RENAME TO dishes;

-- Make sure menu_items only references dishes (no duplicate data)
-- First, let's see what columns menu_items currently has
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menu_items';

-- Remove any duplicate columns from menu_items if they exist
-- Keep only: id, digital_menu_id, dish_id, order_index
ALTER TABLE menu_items DROP COLUMN IF EXISTS name;
ALTER TABLE menu_items DROP COLUMN IF EXISTS description;
ALTER TABLE menu_items DROP COLUMN IF EXISTS price;
ALTER TABLE menu_items DROP COLUMN IF EXISTS image_url;
ALTER TABLE menu_items DROP COLUMN IF EXISTS menu_category_id;
ALTER TABLE menu_items DROP COLUMN IF EXISTS is_available;

-- Rename the foreign key column for clarity
ALTER TABLE menu_items RENAME COLUMN reusable_menu_item_id TO dish_id;

-- Ensure we have the order_index column
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS order_index INTEGER DEFAULT 0;

-- Update the foreign key constraint
ALTER TABLE menu_items DROP CONSTRAINT IF EXISTS menu_items_reusable_menu_item_id_fkey;
ALTER TABLE menu_items ADD CONSTRAINT menu_items_dish_id_fkey 
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE;

-- Show final structure
SELECT 'Final dishes table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dishes'
ORDER BY ordinal_position;

SELECT 'Final menu_items table:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'menu_items'
ORDER BY ordinal_position;
