-- Add description column to ingredients table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ingredients' AND column_name = 'description') THEN
        ALTER TABLE ingredients ADD COLUMN description TEXT;
    END IF;
END
$$;

-- Add restaurant_id to inventory_stock_levels if it doesn't exist
-- This is for robustness, as it should have been added by script 002
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_stock_levels' AND column_name = 'restaurant_id') THEN
        ALTER TABLE inventory_stock_levels ADD COLUMN restaurant_id INT;
        -- Add foreign key and NOT NULL constraint if they were missing
        ALTER TABLE inventory_stock_levels ADD CONSTRAINT fk_isl_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;
        ALTER TABLE inventory_stock_levels ALTER COLUMN restaurant_id SET NOT NULL;
        -- Add unique constraint if it was missing
        ALTER TABLE inventory_stock_levels ADD CONSTRAINT unique_ingredient_stock_per_restaurant UNIQUE (restaurant_id, ingredient_id);
    END IF;
END
$$;

-- Add cost_per_storage_unit to inventory_stock_levels if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inventory_stock_levels' AND column_name = 'cost_per_storage_unit') THEN
        ALTER TABLE inventory_stock_levels ADD COLUMN cost_per_storage_unit DECIMAL(10, 4) NOT NULL DEFAULT 0;
    END IF;
END
$$;

-- Backfill cost_per_storage_unit for existing inventory_stock_levels entries
-- This assumes cost_per_storage_unit should initially be the same as ingredient's cost_per_unit
UPDATE inventory_stock_levels isl
SET cost_per_storage_unit = i.cost_per_unit
FROM ingredients i
WHERE isl.ingredient_id = i.id AND isl.cost_per_storage_unit = 0;
