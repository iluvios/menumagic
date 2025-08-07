-- Let's check the structure of the dishes table to understand what columns are available
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dishes';

-- Let's also check if there's a relationship between dishes and categories
SELECT * FROM information_schema.table_constraints 
WHERE table_name = 'dishes' AND constraint_type = 'FOREIGN KEY';

-- If we need to add a category_id column to dishes, we can do it here
-- ALTER TABLE dishes ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- Fix the POS dishes query

-- The original query was not provided, so this is a placeholder

-- Example query to fetch dishes for the POS system
SELECT 
    d.id, 
    d.name, 
    d.description, 
    d.price, 
    d.menu_category_id, 
    c.name as category_name,
    d.image_url
FROM dishes d
LEFT JOIN categories c ON d.menu_category_id = c.id
WHERE d.is_available = TRUE
ORDER BY d.name ASC;
