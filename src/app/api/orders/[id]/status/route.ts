import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';
import { sendOrderStatusUpdateEmail } from '@/lib/email';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status } = await request.json();
    const { id: orderId } = await params;

    // Validate status
    const validStatuses = ['active', 'delivered'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        },
        { status: 400 }
      );
    }

    // Update order status
    const { data: order, error: updateError } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('*')
      .single();

    if (updateError) {
      console.error('Error updating order status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update order status' },
        { status: 500 }
      );
    }

    // Send status update email only for delivered status (optional)
    if (status === 'delivered') {
      try {
        const emailResult = await sendOrderStatusUpdateEmail(
          order.customer_email,
          order.customer_name,
          order.order_number,
          status
        );
        if (!emailResult) {
          console.error(
            `Status update email failed for order ${orderId}, but status was updated successfully`
          );
        }
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
        // Don't fail the status update if email fails
      }
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    console.error('Unexpected error updating order status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
