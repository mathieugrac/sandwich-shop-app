import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

// Working order creation with real drop product IDs
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
      console.error('Error getting next active drop:', dropError);
      return NextResponse.json(
        { error: 'No active drop available for ordering' },
        { status: 400 }
      );
    }

    const activeDrop = nextDrop[0];

    // Get location information for the drop
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('name, address, location_url')
      .eq('id', activeDrop.location_id)
      .single();

    if (locationError) {
      console.error('Error fetching location:', locationError);
      // Don't fail the order if location fetch fails, just log it
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
      console.error('Error getting/creating client:', clientError);
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
      console.error('Error creating order:', orderError);
      return NextResponse.json(
        { error: 'Failed to create order' },
        { status: 500 }
      );
    }

    // Create order products and reserve inventory
    const orderProducts = [];

    // First, reserve inventory for each item
    for (const item of items) {
      const { data: reservationResult, error: reservationError } =
        await supabase.rpc('reserve_drop_product_inventory', {
          p_drop_product_id: item.id,
          p_quantity: item.quantity,
        });

      if (reservationError) {
        console.error('Inventory reservation error:', reservationError);
        return NextResponse.json(
          { error: 'Insufficient inventory available' },
          { status: 400 }
        );
      }

      if (!reservationResult) {
        console.error('Inventory reservation failed - insufficient stock');
        return NextResponse.json(
          { error: 'Insufficient inventory available' },
          { status: 400 }
        );
      }

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
      console.error('Error creating order products:', orderProductsError);
      return NextResponse.json(
        { error: 'Failed to create order products' },
        { status: 500 }
      );
    }

    // Send confirmation email
    try {
      // Transform items to match email function expectations
      const emailItems = items.map(
        (item: { name: string; quantity: number; price: number }) => ({
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          totalPrice: item.price * item.quantity,
        })
      );

      // Format pickup date for email (e.g., "August 19th")
      const pickupDateObj = new Date(pickupDate);
      const formattedPickupDate = pickupDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
      });

      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName,
        customerEmail,
        pickupTime,
        pickupDate: formattedPickupDate,
        items: emailItems,
        totalAmount,
        specialInstructions,
        locationName: location?.name || 'Pickup Location',
        locationUrl: location?.location_url || '#',
      });
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
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

    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Debug: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
