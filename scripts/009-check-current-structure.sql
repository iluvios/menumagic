-- Check the current database structure

-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Check columns in the dishes table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'dishes';

-- Check columns in the menu_items table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'menu_items';

-- Check columns in the categories table
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'categories';
