-- This script will migrate any data from reusable_menu_items to dishes if needed
-- and update the menu_item_ingredients table to reference dishes

-- First, check if reusable_menu_items table exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reusable_menu_items') THEN
    -- Migrate any data from reusable_menu_items to dishes if not already there
    INSERT INTO dishes (name, description, price, menu_category_id, restaurant_id, created_at, updated_at)
    SELECT 
      rmi.name, 
      rmi.description, 
      rmi.price, 
      rmi.menu_category_id, 
      rmi.restaurant_id, 
      rmi.created_at, 
      rmi.updated_at
    FROM reusable_menu_items rmi
    LEFT JOIN dishes d ON d.name = rmi.name AND d.restaurant_id = rmi.restaurant_id
    WHERE d.id IS NULL;
    
    -- Check if reusable_dish_ingredients table exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'reusable_dish_ingredients') THEN
      -- Create menu_item_ingredients table if it doesn't exist
      IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'menu_item_ingredients') THEN
        CREATE TABLE menu_item_ingredients (
          id SERIAL PRIMARY KEY,
          menu_item_id INTEGER NOT NULL,
          ingredient_id INTEGER NOT NULL,
          quantity_used DECIMAL(10, 2) NOT NULL,
          unit_used VARCHAR(50) NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      END IF;
      
      -- Migrate ingredients from reusable_dish_ingredients to menu_item_ingredients
      -- First, create a temporary mapping table to map reusable_menu_item_id to dish_id
      CREATE TEMPORARY TABLE id_mapping AS
      SELECT rmi.id AS old_id, d.id AS new_id
      FROM reusable_menu_items rmi
      JOIN dishes d ON d.name = rmi.name AND d.restaurant_id = rmi.restaurant_id;
      
      -- Insert ingredients using the mapping
      INSERT INTO menu_item_ingredients (menu_item_id, ingredient_id, quantity_used, unit_used, created_at, updated_at)
      SELECT 
        m.new_id,
        rdi.ingredient_id,
        rdi.quantity_used,
        rdi.unit_used,
        rdi.created_at,
        rdi.updated_at
      FROM reusable_dish_ingredients rdi
      JOIN id_mapping m ON rdi.reusable_menu_item_id = m.old_id
      LEFT JOIN menu_item_ingredients mii ON mii.menu_item_id = m.new_id AND mii.ingredient_id = rdi.ingredient_id
      WHERE mii.id IS NULL;
      
      -- Drop the temporary mapping table
      DROP TABLE id_mapping;
    END IF;
  END IF;
END $$;
