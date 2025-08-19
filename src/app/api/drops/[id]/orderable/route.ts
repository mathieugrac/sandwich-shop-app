import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    // Get the drop details to provide more context
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(`
        id,
        status,
        pickup_deadline,
        date,
        locations (
          id,
          name,
          pickup_hour_end
        )
      `)
      .eq('id', id)
      .single();

    if (dropError || !drop) {
      console.error('Error fetching drop:', dropError);
      return NextResponse.json(
        { error: 'Drop not found' },
        { status: 404 }
      );
    }

    // Use the new enhanced function from Phase 1
    const { data: isOrderable, error: orderableError } = await supabase.rpc('is_drop_orderable', {
      p_drop_id: id,
    });

    if (orderableError) {
      console.error('Error checking if drop is orderable:', orderableError);
      return NextResponse.json(
        { error: 'Failed to check drop orderability' },
        { status: 500 }
      );
    }

    // Apply grace period logic (15 minutes after pickup deadline)
    let finalOrderable = isOrderable;
    let gracePeriodActive = false;
    
    if (drop.pickup_deadline && !isOrderable && drop.status === 'active') {
      const deadline = new Date(drop.pickup_deadline);
      const graceDeadline = new Date(deadline.getTime() + (15 * 60 * 1000)); // 15 min grace
      const now = new Date();
      
      if (now <= graceDeadline) {
        finalOrderable = true;
        gracePeriodActive = true;
      }
    }

    // Provide detailed information about the drop status
    let reason = null;
    let timeRemaining = null;

    if (!finalOrderable) {
      if (drop.status === 'completed') {
        reason = 'This drop has been completed';
      } else if (drop.status === 'cancelled') {
        reason = 'This drop has been cancelled';
      } else if (drop.status === 'upcoming') {
        reason = 'This drop is not yet open for ordering';
      } else if (drop.pickup_deadline && new Date(drop.pickup_deadline) <= new Date()) {
        reason = 'The pickup time has passed';
      } else {
        reason = 'This drop is not currently accepting orders';
      }
    } else if (drop.pickup_deadline) {
      const deadline = new Date(drop.pickup_deadline);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();
      
      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        
        if (diffHours > 0) {
          timeRemaining = `${diffHours}h ${diffMinutes}m`;
        } else {
          timeRemaining = `${diffMinutes}m`;
        }
      } else if (gracePeriodActive) {
        // Show grace period remaining time
        const graceDeadline = new Date(deadline.getTime() + (15 * 60 * 1000));
        const graceDiffMs = graceDeadline.getTime() - now.getTime();
        const graceDiffMinutes = Math.floor(graceDiffMs / (1000 * 60));
        timeRemaining = `Grace period: ${graceDiffMinutes}m remaining`;
      }
    }

    return NextResponse.json({
      orderable: finalOrderable,
      drop: {
        id: drop.id,
        status: drop.status,
        date: drop.date,
        pickup_deadline: drop.pickup_deadline,
        location: drop.locations,
      },
      reason,
      time_until_deadline: timeRemaining,
      grace_period_active: gracePeriodActive,
    });
  } catch (error) {
    console.error('Unexpected error in check drop orderable:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
