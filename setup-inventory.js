// Script to set up inventory data for today
// Run this to populate inventory for testing

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDUxNjAsImV4cCI6MjA2OTkyMTE2MH0.ln1wS7sg9s_oLbaXz06IFK5xI0VA0f1hsTecnbPwKPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupInventory() {
  try {
    console.log('Setting up inventory for today...');

    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    console.log('Date:', today);

    // First, get all products
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name')
      .eq('active', true)
      .order('sort_order');

    if (productsError) {
      throw new Error('Failed to fetch products: ' + productsError.message);
    }

    console.log('Found products:', products.length);

    // Set up inventory for each product
    for (const product of products) {
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

      // Check if inventory already exists for today
      const { data: existingInventory } = await supabase
        .from('daily_inventory')
        .select('id')
        .eq('product_id', product.id)
        .eq('date', today)
        .single();

      if (existingInventory) {
        // Update existing inventory
        const { error: updateError } = await supabase
          .from('daily_inventory')
          .update({
            total_quantity: quantity,
            reserved_quantity: 0,
            updated_at: new Date().toISOString(),
          })
          .eq('product_id', product.id)
          .eq('date', today);

        if (updateError) {
          console.error(
            `Error updating inventory for ${product.name}:`,
            updateError
          );
        } else {
          console.log(
            `✅ Updated inventory for ${product.name}: ${quantity} available`
          );
        }
      } else {
        // Insert new inventory
        const { error: insertError } = await supabase
          .from('daily_inventory')
          .insert({
            product_id: product.id,
            date: today,
            total_quantity: quantity,
            reserved_quantity: 0,
          });

        if (insertError) {
          console.error(
            `Error inserting inventory for ${product.name}:`,
            insertError
          );
        } else {
          console.log(
            `✅ Created inventory for ${product.name}: ${quantity} available`
          );
        }
      }
    }

    console.log('\n🎉 Inventory setup complete!');
    console.log('\nTest the app now - you should see:');
    console.log('- Nutty Beet: SOLD OUT');
    console.log('- Umami Mush: 20 sandwiches left');
    console.log('- Burgundy Beef: 3 sandwiches left, hurry up!');
  } catch (error) {
    console.error('Error setting up inventory:', error);
  }
}

setupInventory();
