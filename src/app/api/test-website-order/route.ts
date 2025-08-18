import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST() {
  try {
    console.log('🧪 Testing website order simulation...');
    
    // Simulate the exact data that comes from the website
    const websiteOrderData = {
      customerName: 'Test Customer',
      customerEmail: 'mathieugrac@gmail.com',
      customerPhone: '+33652413901',
      pickupTime: '12:00',
      pickupDate: '2024-12-18',
      items: [
        {
          id: 'test-product-id', // This should be a drop_product_id
          productName: 'Test Sandwich',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
        },
      ],
      totalAmount: 10.00,
      specialInstructions: 'Test order from website simulation',
    };

    console.log('📝 Website order data:', websiteOrderData);

    // Step 1: Get or create client
    console.log('👤 Step 1: Creating/getting client...');
    const { data: client, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      {
        p_name: websiteOrderData.customerName,
        p_email: websiteOrderData.customerEmail,
        p_phone: websiteOrderData.customerPhone,
      }
    );

    if (clientError) {
      console.error('❌ Client creation error:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Client creation failed',
        details: clientError,
      });
    }

    console.log('✅ Client created/retrieved:', client);

    // Step 2: Get active drop
    console.log('📅 Step 2: Getting active drop...');
    const { data: nextDrop, error: dropError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropError || !nextDrop || nextDrop.length === 0) {
      console.error('❌ Drop error:', dropError);
      return NextResponse.json({
        success: false,
        error: 'No active drop available',
        details: dropError,
      });
    }

    const activeDrop = nextDrop[0];
    console.log('✅ Active drop found:', activeDrop);

    // Step 3: Check if drop_products exist
    console.log('📦 Step 3: Checking drop products...');
    const { data: dropProducts, error: dropProductsError } = await supabase
      .from('drop_products')
      .select('id, product_id, stock_quantity, available_quantity')
      .eq('drop_id', activeDrop.id);

    if (dropProductsError) {
      console.error('❌ Drop products error:', dropProductsError);
      return NextResponse.json({
        success: false,
        error: 'Failed to get drop products',
        details: dropProductsError,
      });
    }

    console.log('✅ Drop products found:', dropProducts);

    // Step 4: Create order
    console.log('📝 Step 4: Creating order...');
    const orderNumber = 'WEB-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: activeDrop.id,
        client_id: client,
        pickup_time: websiteOrderData.pickupTime,
        order_date: websiteOrderData.pickupDate,
        status: 'pending',
        total_amount: websiteOrderData.totalAmount,
        special_instructions: websiteOrderData.specialInstructions,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Order creation error:', orderError);
      return NextResponse.json({
        success: false,
        error: 'Order creation failed',
        details: orderError,
      });
    }

    console.log('✅ Order created:', order);

    // Step 5: Send email
    console.log('📧 Step 5: Sending confirmation email...');
    const emailResult = await sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: websiteOrderData.customerName,
      customerEmail: websiteOrderData.customerEmail,
      pickupTime: websiteOrderData.pickupTime,
      pickupDate: websiteOrderData.pickupDate,
      items: websiteOrderData.items,
      totalAmount: websiteOrderData.totalAmount,
      specialInstructions: websiteOrderData.specialInstructions,
    });

    if (emailResult) {
      console.log('✅ Email sent successfully:', emailResult);
      return NextResponse.json({
        success: true,
        message: 'Website order simulation completed successfully',
        order: order,
        emailResult: emailResult,
        dropProducts: dropProducts,
      });
    } else {
      console.log('❌ Email failed - no result returned');
      return NextResponse.json({
        success: false,
        message: 'Order created but email failed',
        order: order,
        dropProducts: dropProducts,
      });
    }
    
  } catch (error) {
    console.error('❌ Website order simulation error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
