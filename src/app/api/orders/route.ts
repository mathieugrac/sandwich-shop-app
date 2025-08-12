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

    // Get the next active sell
    const { data: nextSell, error: sellError } = await supabase.rpc(
      'get_next_active_sell'
    );

    if (sellError || !nextSell || nextSell.length === 0) {
      console.error('API: Error getting next active sell:', sellError);
      return NextResponse.json(
        { error: 'No active sell available' },
        { status: 400 }
      );
    }

    const activeSell = nextSell[0];
    console.log('API: Linking order to sell:', activeSell);

    // Generate simple order number
    const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 9999)
      .toString()
      .padStart(4, '0');
    const orderNumber = `ORD-${timestamp}-${random}`;

    console.log('API: Attempting to create order with number:', orderNumber);

    // Create order linked to the active sell
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone,
        pickup_time: pickupTime,
        pickup_date: pickupDate,
        sell_id: activeSell.id, // Link to the active sell
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

    // Create order items
    const orderItems = items.map(
      (item: { id: string; quantity: number; price: number }) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        unit_price: item.price,
      })
    );

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError);
      return NextResponse.json(
        { error: 'Failed to create order items' },
        { status: 500 }
      );
    }

    // Reserve inventory for each item using the new sell-based function
    for (const item of items) {
      const { error: reserveError } = await supabase.rpc(
        'reserve_sell_inventory',
        {
          p_sell_id: activeSell.id,
          p_product_id: item.id,
          p_quantity: item.quantity,
        }
      );

      if (reserveError) {
        console.error('Error reserving inventory:', reserveError);
        return NextResponse.json(
          { error: 'Failed to reserve inventory' },
          { status: 500 }
        );
      }
    }

    // Send order confirmation email
    try {
      // Get product names for email
      const productIds = items.map((item: { id: string }) => item.id);
      const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('id', productIds);

      const productMap = new Map(
        products?.map(product => [product.id, product.name]) || []
      );

      const emailData = {
        orderNumber,
        customerName,
        customerEmail,
        pickupDate,
        pickupTime,
        items: items.map(
          (item: { id: string; quantity: number; price: number }) => ({
            productName: productMap.get(item.id) || 'Unknown Product',
            quantity: item.quantity,
            unitPrice: item.price,
            totalPrice: item.quantity * item.price,
          })
        ),
        totalAmount,
        specialInstructions,
      };

      const emailResult = await sendOrderConfirmationEmail(emailData);
      if (emailResult) {
        console.log('API: Order confirmation email sent successfully');
      } else {
        console.log(
          'API: Order confirmation email failed, but order was created successfully'
        );
      }
    } catch (emailError) {
      console.error(
        'API: Failed to send order confirmation email:',
        emailError
      );
      // Don't fail the order if email fails, but log the error
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        items: orderItems,
      },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
