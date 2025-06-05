-- Add order_index column to menu_items table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'menu_items' AND column_name = 'order_index'
    ) THEN
        ALTER TABLE menu_items ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing menu items to have sequential order_index values within their categories
WITH ranked_items AS (
    SELECT 
        id, 
        menu_category_id, 
        digital_menu_id,
        ROW_NUMBER() OVER (PARTITION BY menu_category_id, digital_menu_id ORDER BY id) AS new_order
    FROM menu_items
)
UPDATE menu_items mi
SET order_index = ri.new_order - 1
FROM ranked_items ri
WHERE mi.id = ri.id;
