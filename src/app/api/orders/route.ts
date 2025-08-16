import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('API: Received order data:', body);

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
      console.log('API: Validation failed - missing required fields');
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the next active drop
    const { data: nextDrop, error: dropError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropError || !nextDrop || nextDrop.length === 0) {
      console.error('API: Error getting next active drop:', dropError);
      return NextResponse.json(
        { error: 'No active drop available for ordering' },
        { status: 400 }
      );
    }

    const activeDrop = nextDrop[0];
    console.log('API: Linking order to drop:', activeDrop);

    // Validate that the drop is still orderable using the new function
    const { data: isOrderable, error: orderableError } = await supabase.rpc(
      'is_drop_orderable',
      { p_drop_id: activeDrop.id }
    );

    if (orderableError) {
      console.error('API: Error checking drop orderability:', orderableError);
      return NextResponse.json(
        { error: 'Failed to validate drop status' },
        { status: 500 }
      );
    }

    if (!isOrderable) {
      console.log('API: Drop is no longer orderable:', activeDrop.id);
      return NextResponse.json(
        {
          error:
            'This drop is no longer accepting orders. The pickup time has passed.',
          drop_status: 'completed',
          drop_id: activeDrop.id,
        },
        { status: 400 }
      );
    }

    // Get or create client
    const { data: client, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      {
        p_name: customerName,
        p_email: customerEmail,
        p_phone: customerPhone,
      }
    );

    if (clientError) {
      console.error('API: Error getting/creating client:', clientError);
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 }
      );
    }

    // Generate simple order number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    console.log('API: Attempting to create order with number:', orderNumber);

    // Create order linked to the active drop
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: activeDrop.id, // Link to the active drop
        client_id: client,
        pickup_time: pickupTime,
        order_date: pickupDate,
        total_amount: totalAmount,
        special_instructions: specialInstructions,
      })
      .select()
      .single();

    if (orderError) {
      console.error('API: Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    console.log('API: Order created successfully:', order);
    console.log('API: Order ID for confirmation:', order.id);

    // Create order products linked to drop_products
    const orderProducts = [];
    for (const item of items) {
      // The item.id is now the drop_product_id from the cart
      orderProducts.push({
        order_id: order.id,
        drop_product_id: item.id, // Use the drop_product_id directly
        order_quantity: item.quantity,
      });
    }

    const { error: orderProductsError } = await supabase
      .from('order_products')
      .insert(orderProducts);

    if (orderProductsError) {
      console.error('Error creating order products:', orderProductsError);
      return NextResponse.json(
        { error: 'Failed to create order products' },
        { status: 500 }
      );
    }

    // Reserve inventory for each item using the new drop-based function
    for (const item of items) {
      const { data: reserved, error: reserveError } = await supabase.rpc(
        'reserve_drop_product_inventory',
        {
          p_drop_product_id: item.id,
          p_quantity: item.quantity,
        }
      );

      if (reserveError || !reserved) {
        console.error(
          'Error reserving inventory for item:',
          item.id,
          reserveError
        );
        // Don't fail the order - just log the error
        // The inventory system will handle this gracefully
      }
    }

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName,
        customerEmail,
        pickupTime,
        pickupDate,
        items,
        totalAmount,
      });
      console.log('API: Confirmation email sent successfully');
    } catch (emailError) {
      console.error('API: Error sending confirmation email:', emailError);
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

    console.log('API: Sending response:', response);
    return NextResponse.json(response);
  } catch (error) {
    console.error('API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
