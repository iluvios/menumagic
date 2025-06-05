-- Add order_index column to menu_items table if it doesn't exist
DO $$
BEGIN
    -- Check if order_index column exists
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public' 
        AND table_name = 'menu_items' 
        AND column_name = 'order_index'
    ) THEN
        -- Add the column
        ALTER TABLE menu_items ADD COLUMN order_index INTEGER DEFAULT 0;
        
        -- Update existing menu items to have sequential order_index values
        WITH ranked_items AS (
            SELECT 
                id, 
                COALESCE(menu_category_id, 0) as category_key,
                digital_menu_id,
                ROW_NUMBER() OVER (
                    PARTITION BY COALESCE(menu_category_id, 0), digital_menu_id 
                    ORDER BY id
                ) AS new_order
            FROM menu_items
        )
        UPDATE menu_items mi
        SET order_index = ri.new_order - 1
        FROM ranked_items ri
        WHERE mi.id = ri.id;
        
        RAISE NOTICE 'Added order_index column to menu_items table and updated existing records';
    ELSE
        RAISE NOTICE 'order_index column already exists in menu_items table';
    END IF;
END $$;
