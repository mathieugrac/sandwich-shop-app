import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ paymentIntentId: string }> }
) {
  try {
    const { paymentIntentId } = await params;

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, public_code, status')
      .eq('payment_intent_id', paymentIntentId)
      .single();

    if (error || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    return NextResponse.json({
      orderId: order.id,
      orderNumber: order.public_code, // Return public_code as orderNumber for compatibility
      status: order.status,
    });
  } catch (error) {
    console.error('Error fetching order by payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
