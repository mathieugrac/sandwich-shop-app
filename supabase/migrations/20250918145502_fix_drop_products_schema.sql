-- Fix drop_products table schema to match production

-- Rename quantity column to stock_quantity to match production schema
ALTER TABLE drop_products RENAME COLUMN quantity TO stock_quantity;

-- Add selling_price column that exists in production
ALTER TABLE drop_products ADD COLUMN selling_price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- Add available_quantity as a generated column (computed from stock_quantity - reserved_quantity)
ALTER TABLE drop_products ADD COLUMN available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED;

-- Update the check constraint to use the new column name
ALTER TABLE drop_products DROP CONSTRAINT IF EXISTS drop_products_quantity_check;
ALTER TABLE drop_products ADD CONSTRAINT drop_products_stock_quantity_check CHECK (stock_quantity >= 0);
