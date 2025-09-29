-- Add tags field to products table
-- This allows categorizing products with flexible tags like "vegetarian", "gluten-free", etc.

ALTER TABLE products 
ADD COLUMN tags TEXT[];

-- Add comment for documentation
COMMENT ON COLUMN products.tags IS 'Array of tags for categorizing products (e.g., ["vegetarian", "gluten-free", "spicy"])';

-- Create index for tag searches
CREATE INDEX idx_products_tags ON products USING GIN(tags);

-- Update existing products with sample tags
UPDATE products 
SET tags = CASE 
  WHEN name = 'Nutty Beet' THEN ARRAY['vegetarian', 'gluten-free']
  WHEN name = 'Umami Mush' THEN ARRAY['vegetarian', 'vegan']
  WHEN name = 'Burgundy Beef' THEN ARRAY['meat']
  WHEN name = 'Fresh Lemonade' THEN ARRAY['beverage', 'vegan']
  WHEN name = 'Chocolate Brownie' THEN ARRAY['dessert', 'vegetarian']
  ELSE ARRAY[]::TEXT[]
END;
