import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    console.log(`API: Fetching order details for order ${orderId}`);

    // Fetch order details with order products, client, drop, and location information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        clients (
          name,
          email,
          phone
        ),
        drops (
          *,
          locations (
            name,
            address,
            location_url
          )
        ),
        order_products (
          *,
          drop_products (
            *,
            products (
              name,
              description
            )
          )
        )
      `
      )
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('API: Error fetching order:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    console.log('API: Order details fetched successfully:', order);

    // Transform the data to match the expected format
    const transformedOrder = {
      id: order.id,
      order_number: order.order_number,
      customer_name: order.clients?.name || 'Unknown',
      customer_email: order.clients?.email || 'Unknown',
      customer_phone: order.clients?.phone || '',
      pickup_time: order.pickup_time,
      pickup_date: order.order_date,
      total_amount: order.total_amount,
      special_instructions: order.special_instructions || '',
      created_at: order.created_at,
      order_items: order.order_products?.map((op: any) => ({
        id: op.id,
        quantity: op.order_quantity,
        unit_price: op.drop_products?.selling_price || 0,
        products: {
          name: op.drop_products?.products?.name || 'Unknown Product',
          description: op.drop_products?.products?.description || '',
        },
      })) || [],
      // Additional data for the confirmation page
      drop_info: {
        location: order.drops?.locations,
        date: order.drops?.date,
      },
    };

    return NextResponse.json({
      success: true,
      order: transformedOrder,
    });
  } catch (error) {
    console.error('API: Unexpected error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
