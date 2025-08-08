import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status } = await request.json();
    const orderId = params.id;

    console.log(`API: Updating order ${orderId} status to ${status}`);

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      console.error('API: Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Send status update email for certain statuses
    if (['confirmed', 'prepared', 'completed'].includes(status)) {
      try {
        await sendOrderStatusUpdateEmail(
          order.customer_email,
          order.customer_name,
          order.order_number,
          status
        );
        console.log(`API: Status update email sent for order ${orderId}`);
      } catch (emailError) {
        console.error('API: Failed to send status update email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('API: Unexpected error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
