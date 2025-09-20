import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerName,
      customerEmail,
      customerPhone,
      pickupTime,
      pickupDate,
      items,
      specialInstructions,
      totalAmount,
      paymentIntentId,
    } = body;

    // Validate required fields
    if (
      !customerName ||
      !customerEmail ||
      !pickupTime ||
      !pickupDate ||
      !items?.length
    ) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get active drop with location in single query
    const { data: activeDrop, error: dropError } = await supabase
      .from('drops')
      .select(
        `
        id,
        location_id,
        locations (
          name,
          address,
          location_url
        )
      `
      )
      .eq('status', 'active')
      .limit(1)
      .single();

    if (dropError || !activeDrop) {
      return NextResponse.json(
        { error: 'No active drop available for ordering' },
        { status: 400 }
      );
    }

    // Get or create client (by email/phone only)
    const { data: clientId, error: clientError } = await supabase.rpc(
      'get_or_create_client',
      { p_email: customerEmail, p_phone: customerPhone }
    );

    if (clientError) {
      console.error('Error getting/creating client:', clientError);
      return NextResponse.json(
        { error: 'Failed to process customer information' },
        { status: 500 }
      );
    }

    // Generate order number using database function with drop_id
    const { data: orderNumber, error: orderNumberError } = await supabase.rpc(
      'generate_order_number',
      { p_drop_id: activeDrop.id }
    );

    if (orderNumberError) {
      console.error('Error generating order number:', orderNumberError);
      return NextResponse.json(
        { error: 'Failed to generate order number' },
        { status: 500 }
      );
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        drop_id: activeDrop.id,
        client_id: clientId,
        customer_name: customerName, // Store name at order level for delivery bag
        pickup_time: pickupTime,
        order_date: pickupDate,
        total_amount: totalAmount,
        special_instructions: specialInstructions,
        payment_intent_id: paymentIntentId, // Link to Stripe payment
        payment_method: paymentIntentId ? 'stripe' : null,
        status: paymentIntentId ? 'confirmed' : 'pending', // Paid orders are confirmed
      })
      .select('id, order_number, status')
      .single();

    if (orderError) {
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Batch create order products and reserve inventory
    const orderProducts = items.map(
      (item: { id: string; quantity: number }) => ({
        drop_product_id: item.id, // Map to the field name the database function expects
        order_quantity: item.quantity,
      })
    );

    // Reserve inventory for all items at once
    const { error: reservationError } = await supabase.rpc(
      'reserve_multiple_drop_products',
      { p_order_items: orderProducts }
    );

    if (reservationError) {
      console.error('❌ Inventory reservation error:', {
        error: reservationError,
        items: items,
        orderProducts: orderProducts,
      });
      return NextResponse.json(
        { error: 'Insufficient inventory available' },
        { status: 400 }
      );
    }

    // Create order products with the correct structure
    const orderProductsForInsert = items.map(
      (item: { id: string; quantity: number }) => ({
        order_id: order.id,
        drop_product_id: item.id,
        order_quantity: item.quantity,
      })
    );

    const { error: orderProductsError } = await supabase
      .from('order_products')
      .insert(orderProductsForInsert);

    if (orderProductsError) {
      console.error('Error creating order products:', orderProductsError);
      return NextResponse.json(
        { error: 'Failed to create order products' },
        { status: 500 }
      );
    }

    // Send confirmation email for paid orders (when paymentIntentId is provided)
    if (paymentIntentId) {
      try {
        const emailItems = items.map(
          (item: { id: string; quantity: number }) => {
            // We need to get product details for email
            // For now, we'll use basic info - could be enhanced later
            return {
              productName: `Product ${item.id}`, // TODO: Get actual product name
              quantity: item.quantity,
              unitPrice: 0, // TODO: Get actual price
              totalPrice: 0, // TODO: Calculate total
            };
          }
        );

        const pickupDateObj = new Date(pickupDate);
        const formattedPickupDate = pickupDateObj.toLocaleDateString('en-US', {
          month: 'long',
          day: 'numeric',
        });

        await sendOrderConfirmationEmail({
          orderNumber: order.order_number,
          customerName: customerName,
          customerEmail: customerEmail,
          pickupTime: pickupTime,
          pickupDate: formattedPickupDate,
          items: emailItems,
          totalAmount: totalAmount,
          specialInstructions: specialInstructions,
          locationName: activeDrop.locations?.name || 'Pickup Location',
          locationUrl: activeDrop.locations?.location_url || '#',
        });

        console.log(
          '✅ Order confirmation email sent for order:',
          order.order_number
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't fail the order if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        order_number: order.order_number,
        status: order.status,
      },
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
