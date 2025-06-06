-- Add missing columns to inventory_stock_levels if they don't exist
DO $$
BEGIN
    -- Add low_stock_threshold_quantity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_stock_levels' AND column_name = 'low_stock_threshold_quantity') THEN
        ALTER TABLE inventory_stock_levels ADD COLUMN low_stock_threshold_quantity DECIMAL(10, 4) DEFAULT 0;
    END IF;
    
    -- Add current_quantity_in_storage_units column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_stock_levels' AND column_name = 'current_quantity_in_storage_units') THEN
        ALTER TABLE inventory_stock_levels ADD COLUMN current_quantity_in_storage_units DECIMAL(10, 4) DEFAULT 0;
    END IF;
    
    -- Add storage_unit column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_stock_levels' AND column_name = 'storage_unit') THEN
        ALTER TABLE inventory_stock_levels ADD COLUMN storage_unit VARCHAR(50) DEFAULT 'unit';
    END IF;
END
$$;

-- Fix ingredients table schema issues
DO $$
BEGIN
    -- Make sku column nullable if it exists and is NOT NULL
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'sku' AND is_nullable = 'NO') THEN
        ALTER TABLE ingredients ALTER COLUMN sku DROP NOT NULL;
    END IF;
    
    -- Add sku column if it doesn't exist (nullable)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'sku') THEN
        ALTER TABLE ingredients ADD COLUMN sku VARCHAR(100);
    END IF;
    
    -- Add description column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'description') THEN
        ALTER TABLE ingredients ADD COLUMN description TEXT;
    END IF;
    
    -- Add unit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'unit') THEN
        ALTER TABLE ingredients ADD COLUMN unit VARCHAR(50) DEFAULT 'unit';
    END IF;
    
    -- Add supplier_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'supplier_id') THEN
        ALTER TABLE ingredients ADD COLUMN supplier_id INTEGER;
    END IF;
END
$$;

-- Update any existing NULL sku values to empty string to avoid issues
UPDATE ingredients SET sku = '' WHERE sku IS NULL;

-- Ensure all existing ingredients have a unit value
UPDATE ingredients SET unit = 'unit' WHERE unit IS NULL OR unit = '';

-- Create inventory stock levels for any ingredients that don't have them
INSERT INTO inventory_stock_levels (restaurant_id, ingredient_id, storage_unit, current_quantity_in_storage_units, low_stock_threshold_quantity, cost_per_storage_unit)
SELECT 
    i.restaurant_id,
    i.id,
    COALESCE(i.unit, 'unit'),
    0,
    0,
    COALESCE(i.cost_per_unit, 0)
FROM ingredients i
LEFT JOIN inventory_stock_levels isl ON i.id = isl.ingredient_id AND i.restaurant_id = isl.restaurant_id
WHERE isl.id IS NULL;
