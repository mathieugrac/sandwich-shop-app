// Debug order creation
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://tutzpfqwiqhlpletexjg.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR1dHpwZnF3aXFobHBsZXRleGpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzNDUxNjAsImV4cCI6MjA2OTkyMTE2MH0.ln1wS7sg9s_oLbaXz06IFK5xI0VA0f1hsTecnbPwKPc';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOrderCreation() {
  try {
    console.log('Testing direct order creation...');

    // Get a product
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .eq('active', true)
      .limit(1);

    if (productsError) {
      throw new Error('Failed to fetch products: ' + productsError.message);
    }

    const product = products[0];
    console.log('Using product:', product.name);

    // Test creating order directly
    const orderData = {
      order_number: `TEST-${Date.now()}`,
      customer_name: 'Test Customer',
      customer_email: 'test@example.com',
      customer_phone: '+1234567890',
      pickup_time: '12:00',
      pickup_date: new Date().toISOString().split('T')[0],
      total_amount: product.price,
      special_instructions: 'Test order',
    };

    console.log('Attempting to create order...');
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation failed:', orderError);

      // Check if it's an RLS issue
      if (orderError.code === '42501') {
        console.log(
          "\n🔍 This is an RLS policy issue. Let's check the policies..."
        );

        // Try to check what policies exist
        const { data: policies, error: policiesError } = await supabase
          .from('orders')
          .select('count')
          .limit(1);

        if (policiesError) {
          console.error('Policy check error:', policiesError);
        } else {
          console.log('Policy check result:', policies);
        }
      }
    } else {
      console.log('✅ Order created successfully:', order);

      // Test creating order items
      const orderItemData = {
        order_id: order.id,
        product_id: product.id,
        quantity: 1,
        unit_price: product.price,
      };

      const { data: orderItem, error: itemError } = await supabase
        .from('order_items')
        .insert(orderItemData)
        .select()
        .single();

      if (itemError) {
        console.error('❌ Order item creation failed:', itemError);
      } else {
        console.log('✅ Order item created successfully:', orderItem);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

debugOrderCreation();
