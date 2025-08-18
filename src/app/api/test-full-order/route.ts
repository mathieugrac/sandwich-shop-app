import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST() {
  try {
    console.log('🧪 Testing full order creation process...');
    
    // Step 1: Get or create client
    console.log('👤 Step 1: Creating/getting client...');
    const { data: client, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      {
        p_name: 'Test Customer',
        p_email: 'mathieugrac@gmail.com',
        p_phone: '+33652413901',
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

    // Step 3: Create order
    console.log('📝 Step 3: Creating order...');
    const orderNumber = 'TEST-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(Math.random() * 9999).toString().padStart(4, '0');
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: activeDrop.id,
        client_id: client,
        pickup_time: '12:00',
        order_date: '2024-12-18',
        status: 'pending',
        total_amount: 10.00,
        special_instructions: 'Test order from API',
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

    // Step 4: Send email
    console.log('📧 Step 4: Sending confirmation email...');
    const emailResult = await sendOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: 'Test Customer',
      customerEmail: 'mathieugrac@gmail.com',
      pickupTime: '12:00',
      pickupDate: '2024-12-18',
      items: [
        {
          productName: 'Test Sandwich',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
        },
      ],
      totalAmount: 10.00,
      specialInstructions: 'Test order from API',
    });

    if (emailResult) {
      console.log('✅ Email sent successfully:', emailResult);
      return NextResponse.json({
        success: true,
        message: 'Full order process completed successfully',
        order: order,
        emailResult: emailResult,
      });
    } else {
      console.log('❌ Email failed - no result returned');
      return NextResponse.json({
        success: false,
        message: 'Order created but email failed',
        order: order,
      });
    }
    
  } catch (error) {
    console.error('❌ Full order test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
