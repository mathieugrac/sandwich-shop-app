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
        { error: 'No active drop available' },
        { status: 400 }
      );
    }

    const activeDrop = nextDrop[0];
    console.log('API: Linking order to drop:', activeDrop);

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

    // Create order products linked to drop_products
    const orderProducts = [];
    for (const item of items) {
      // Find the corresponding drop_product for this product
      const { data: dropProduct, error: dropProductError } = await supabase
        .from('drop_products')
        .select('id, selling_price')
        .eq('drop_id', activeDrop.id)
        .eq('product_id', item.id)
        .single();

      if (dropProductError || !dropProduct) {
        console.error('API: Error finding drop product:', dropProductError);
        return NextResponse.json(
          { error: 'Product not available for this drop' },
          { status: 400 }
        );
      }

      orderProducts.push({
        order_id: order.id,
        drop_product_id: dropProduct.id,
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
      // Find the drop_product_id for this product
      const { data: dropProduct } = await supabase
        .from('drop_products')
        .select('id')
        .eq('drop_id', activeDrop.id)
        .eq('product_id', item.id)
        .single();

      if (dropProduct) {
        const { error: reserveError } = await supabase.rpc(
          'reserve_drop_product_inventory',
          {
            p_drop_product_id: dropProduct.id,
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
        order_products: orderProducts,
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
