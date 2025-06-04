ALTER TABLE categories
ADD COLUMN order_index INTEGER;

-- Populate order_index for existing categories based on their current ID or a default
UPDATE categories
SET order_index = id
WHERE order_index IS NULL;

-- Ensure order_index is not null and has a default for new entries (if your DB supports it)
-- For PostgreSQL, you might add a default like this:
-- ALTER TABLE categories ALTER COLUMN order_index SET DEFAULT nextval('categories_id_seq');
-- Or handle default in your application logic.
