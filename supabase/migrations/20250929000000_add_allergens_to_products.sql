-- Add allergens field to products table
-- This allows storing free-text allergen information for each product

ALTER TABLE products 
ADD COLUMN allergens TEXT;

-- Add comment for documentation
COMMENT ON COLUMN products.allergens IS 'Free-text field for allergen information (e.g., "Contains gluten, dairy, nuts")';
