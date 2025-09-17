import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import type { Database } from '@/types/database';

// Use types from database instead of duplicate interfaces
type OrderProduct = Database['public']['Tables']['order_products']['Row'] & {
  drop_products?: Database['public']['Tables']['drop_products']['Row'] & {
    products?: Database['public']['Tables']['products']['Row'];
  };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    // Determine if orderId is a UUID or payment intent ID
    const isUUID =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        orderId
      );

    // Fetch order details with order products, client, drop, and location information
    let query = supabase.from('orders').select(
      `
        *,
        clients (
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
    );

    // Apply the appropriate filter based on ID type
    if (isUUID) {
      query = query.eq('id', orderId);
    } else {
      query = query.eq('payment_intent_id', orderId);
    }

    const { data: order, error: orderError } = await query.single();

    if (orderError) {
      console.error('API: Error fetching order:', orderError);
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Transform the data to match the expected format
    const transformedOrder = {
      id: order.id,
      order_number: order.order_number,
      status: order.status, // Add the missing status field
      customer_name: order.customer_name || 'Unknown',
      customer_email: order.clients?.email || 'Unknown',
      customer_phone: order.clients?.phone || '',
      pickup_time: order.pickup_time,
      pickup_date: order.order_date,
      total_amount: order.total_amount,
      special_instructions: order.special_instructions || '',
      created_at: order.created_at,
      order_products:
        order.order_products?.map((op: OrderProduct) => ({
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
