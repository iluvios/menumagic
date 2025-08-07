-- Add the order_index column to the menu_items table
ALTER TABLE menu_items ADD COLUMN order_index INT DEFAULT 0;

-- Optionally, seed the order_index based on existing IDs for each menu
-- This assumes you want to order them based on the order they were created
-- Adjust the subquery if you have a different column to determine the order
UPDATE menu_items
SET order_index = sub.row_number
FROM (
    SELECT id,
           ROW_NUMBER() OVER (ORDER BY id) as row_number
    FROM menu_items
) sub
WHERE menu_items.id = sub.id;
