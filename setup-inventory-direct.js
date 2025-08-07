// Direct inventory setup using service role key
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
// Using service role key to bypass RLS
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDM0NTE2MCwiZXhwIjoyMDY5OTIxMTYwfQ.eaESF2bqcIpRQhRXx0w0KW4WxIQ0Ihlf5iIROrYGk98';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupInventoryDirect() {
  try {
    console.log('Setting up inventory directly...');

    const today = new Date().toISOString().split('T')[0];
    console.log('Date:', today);

    // Get products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('sort_order');

    if (productsError) {
      throw new Error('Failed to fetch products: ' + productsError.message);
    }

    console.log('Found products:', products.length);

    // Clear existing inventory for today
    const { error: deleteError } = await supabase
      .from('daily_inventory')
      .delete()
      .eq('date', today);

    if (deleteError) {
      console.error('Error clearing inventory:', deleteError);
    } else {
      console.log('✅ Cleared existing inventory for today');
    }

    // Insert new inventory
    const inventoryData = products.map(product => {
      let quantity;
      switch (product.name) {
        case 'Nutty Beet':
          quantity = 0; // Sold out
          break;
        case 'Umami Mush':
          quantity = 20; // Available
          break;
        case 'Burgundy Beef':
          quantity = 3; // Low stock
          break;
        default:
          quantity = 10; // Default
      }

      return {
        product_id: product.id,
        date: today,
        total_quantity: quantity,
        reserved_quantity: 0,
      };
    });

    const { data: insertedInventory, error: insertError } = await supabase
      .from('daily_inventory')
      .insert(inventoryData)
      .select();

    if (insertError) {
      throw new Error('Failed to insert inventory: ' + insertError.message);
    }

    console.log(
      '✅ Inserted inventory data:',
      insertedInventory.length,
      'records'
    );

    // Verify the data
    const { data: verifyData, error: verifyError } = await supabase
      .from('daily_inventory')
      .select(
        `
        *,
        products (
          id,
          name
        )
      `
      )
      .eq('date', today);

    if (verifyError) {
      console.error('Error verifying data:', verifyError);
    } else {
      console.log('\n📊 Inventory Summary:');
      verifyData.forEach(item => {
        const status =
          item.total_quantity === 0
            ? 'SOLD OUT'
            : item.total_quantity <= 3
              ? 'LOW STOCK'
              : 'AVAILABLE';
        console.log(
          `- ${item.products.name}: ${item.total_quantity} available (${status})`
        );
      });
    }

    console.log('\n🎉 Inventory setup complete!');
    console.log('You can now test the app at http://localhost:3001');
  } catch (error) {
    console.error('Error setting up inventory:', error);
  }
}

setupInventoryDirect();
