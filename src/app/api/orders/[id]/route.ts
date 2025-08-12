import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params;

    console.log(`API: Fetching order details for order ${orderId}`);

    // Fetch order details with order items and product information
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(
        `
        *,
        order_items (
          *,
          products (
            name,
            description
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

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('API: Unexpected error fetching order:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
