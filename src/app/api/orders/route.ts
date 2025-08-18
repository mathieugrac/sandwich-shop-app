import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Working order creation with real drop product IDs
export async function POST(request: Request) {
  try {
    console.log('🔍 Debug: Starting order creation...');

    // Log the request body
    const body = await request.json();
    console.log('🔍 Debug: Request body:', body);

    const {
      customerName,
      customerEmail,
      customerPhone,
      pickupTime,
      pickupDate,
      items,
      specialInstructions,
      totalAmount,
    } = body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !pickupTime ||
      !pickupDate ||
      !items ||
      items.length === 0
    ) {
      console.log('❌ Debug: Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log('✅ Debug: All required fields present');

    // Get the next active drop
    console.log('🔍 Debug: Getting next active drop...');
    const { data: nextDrop, error: dropError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropError || !nextDrop || nextDrop.length === 0) {
      console.error('❌ Debug: Error getting next active drop:', dropError);
      return NextResponse.json(
        { error: 'No active drop available for ordering' },
        { status: 400 }
      );
    }

    const activeDrop = nextDrop[0];
    console.log('✅ Debug: Active drop found:', activeDrop);

    // Get or create client
    console.log('🔍 Debug: Getting/creating client...');
    const { data: client, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      {
        p_name: customerName,
        p_email: customerEmail,
        p_phone: customerPhone,
      }
    );

    if (clientError) {
      console.error('❌ Debug: Error getting/creating client:', clientError);
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 }
      );
    }

    console.log('✅ Debug: Client created/found:', client);

    // Generate simple order number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    console.log('🔍 Debug: Creating order with number:', orderNumber);

    // Create order linked to the active drop
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: activeDrop.id,
        client_id: client,
        pickup_time: pickupTime,
        order_date: pickupDate,
        total_amount: totalAmount,
        special_instructions: specialInstructions,
      })
      .select()
      .single();

    if (orderError) {
      console.error('❌ Debug: Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('✅ Debug: Order created successfully:', order);

    // Create order products
    console.log('🔍 Debug: Creating order products...');
    const orderProducts = [];
    for (const item of items) {
      orderProducts.push({
        order_id: order.id,
        drop_product_id: item.id,
        order_quantity: item.quantity,
      });
    }

    const { error: orderProductsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (orderProductsError) {
      console.error(
        '❌ Debug: Error creating order products:',
        orderProductsError
      );
      return NextResponse.json(
        { error: 'Failed to create order products' },
        { status: 500 }
      );
    }

    console.log('✅ Debug: Order products created successfully');

    // Send confirmation email
    console.log('🔍 Debug: Sending confirmation email...');
    try {
      // Transform items to match email function expectations
      const emailItems = items.map((item: any) => ({
        productName: item.name,
        quantity: item.quantity,
        unitPrice: item.price,
        totalPrice: item.price * item.quantity,
      }));

      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName,
        customerEmail,
        pickupTime,
        pickupDate,
        items: emailItems,
        totalAmount,
        specialInstructions,
      });
      console.log('✅ Debug: Confirmation email sent successfully');
    } catch (emailError) {
      console.error('❌ Debug: Error sending confirmation email:', emailError);
      // Don't fail the order if email fails
    }

    const response = {
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
      },
      message: 'Order created successfully',
    };

    console.log('✅ Debug: Sending success response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Debug: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
