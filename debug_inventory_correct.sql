-- CORRECT query to check current inventory state
-- Run this in Supabase SQL Editor:

SELECT 
  dp.id,
  p.name as product_name,
  dp.stock_quantity,
  dp.reserved_quantity,
  dp.available_quantity,
  d.status as drop_status
FROM drop_products dp
JOIN products p ON dp.product_id = p.id  
JOIN drops d ON dp.drop_id = d.id
WHERE d.status = 'active'
ORDER BY p.name;
