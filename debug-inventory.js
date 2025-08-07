// Debug script to check inventory data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDUxNjAsImV4cCI6MjA2OTkyMTE2MH0.ln1wS7sg9s_oLbaXz06IFK5xI0VA0f1hsTecnbPwKPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugInventory() {
  try {
    const today = new Date().toISOString().split('T')[0];
    console.log('Checking inventory for date:', today);

    // Check if inventory exists
    const { data: inventory, error } = await supabase
      .from('daily_inventory')
      .select('*')
      .eq('date', today);

    if (error) {
      console.error('Error fetching inventory:', error);
      return;
    }

    console.log('Raw inventory data:', inventory);
    console.log('Number of inventory records:', inventory?.length || 0);

    // Check products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .eq('active', true);

    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }

    console.log('Products:', products);

    // Check RLS policies
    console.log('\nChecking RLS policies...');

    // Try to fetch with the same query as our API
    const { data: inventoryWithProducts, error: inventoryError } =
      await supabase
        .from('daily_inventory')
        .select(
          `
        *,
        products (
          id,
          name,
          description,
          price,
          image_url
        )
      `
        )
        .eq('date', today);

    if (inventoryError) {
      console.error('Error with joined query:', inventoryError);
    } else {
      console.log('Inventory with products:', inventoryWithProducts);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugInventory();
