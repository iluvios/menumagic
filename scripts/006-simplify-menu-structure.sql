-- Let's check what we currently have and then simplify
SELECT 'Current menu_items structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'menu_items' 
ORDER BY ordinal_position;

SELECT 'Current reusable_menu_items structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'reusable_menu_items' 
ORDER BY ordinal_position;

-- Count current data
SELECT 'Current data counts:' as info;
SELECT 'menu_items' as table_name, COUNT(*) as count FROM menu_items
UNION ALL
SELECT 'reusable_menu_items' as table_name, COUNT(*) as count FROM reusable_menu_items;
