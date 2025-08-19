import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    // Handle both sync and async params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    console.log('API called with drop ID:', id);

    // Test basic drop fetch first
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select('id, status, pickup_deadline, date')
      .eq('id', id)
      .single();

    if (dropError || !drop) {
      console.error('Error fetching drop:', dropError);
      return NextResponse.json(
        { error: 'Drop not found', details: dropError?.message },
        { status: 404 }
      );
    }

    // Get full drop details with location info
    const { data: fullDrop, error: fullDropError } = await supabase
      .from('drops')
      .select(
        `
        id,
        status,
        pickup_deadline,
        date,
        locations (
          id,
          name,
          pickup_hour_end
        )
      `
      )
      .eq('id', id)
      .single();

    if (fullDropError || !fullDrop) {
      console.error('Error fetching full drop details:', fullDropError);
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    // Use the database function to check if drop is orderable
    const { data: isOrderable, error: functionError } = await supabase.rpc(
      'is_drop_orderable',
      { p_drop_id: id }
    );

    if (functionError) {
      console.error('Database function error:', functionError);
      // Fallback to basic logic
      const fallbackOrderable =
        fullDrop.status === 'active' &&
        (!fullDrop.pickup_deadline ||
          new Date(fullDrop.pickup_deadline) > new Date());

      return NextResponse.json({
        orderable: fallbackOrderable,
        drop: {
          id: fullDrop.id,
          status: fullDrop.status,
          date: fullDrop.date,
          pickup_deadline: fullDrop.pickup_deadline,
          location: fullDrop.locations,
        },
        reason: fallbackOrderable ? null : 'Drop is not orderable',
        time_until_deadline: null,
        grace_period_active: false,
        note: 'Using fallback logic due to function error',
      });
    }

    // Apply grace period logic (15 minutes after pickup deadline)
    let finalOrderable = isOrderable;
    let gracePeriodActive = false;

    if (
      fullDrop.pickup_deadline &&
      !isOrderable &&
      fullDrop.status === 'active'
    ) {
      const deadline = new Date(fullDrop.pickup_deadline);
      const graceDeadline = new Date(deadline.getTime() + 15 * 60 * 1000); // 15 min grace
      const now = new Date();

      if (now <= graceDeadline) {
        finalOrderable = true;
        gracePeriodActive = now > deadline;
      }
    }

    // Provide detailed information about the drop status
    let reason = null;
    let timeRemaining = null;

    if (!finalOrderable) {
      if (fullDrop.status === 'completed') {
        reason = 'This drop has been completed';
      } else if (fullDrop.status === 'cancelled') {
        reason = 'This drop has been cancelled';
      } else if (fullDrop.status === 'upcoming') {
        reason = 'This drop is not yet open for ordering';
      } else if (
        fullDrop.pickup_deadline &&
        new Date(fullDrop.pickup_deadline) <= new Date()
      ) {
        reason = 'The pickup time has passed';
      } else {
        reason = 'This drop is not currently accepting orders';
      }
    } else if (fullDrop.pickup_deadline) {
      const deadline = new Date(fullDrop.pickup_deadline);
      const now = new Date();
      const diffMs = deadline.getTime() - now.getTime();

      if (diffMs > 0) {
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );

        if (diffHours > 0) {
          timeRemaining = `${diffHours}h ${diffMinutes}m`;
        } else {
          timeRemaining = `${diffMinutes}m`;
        }
      } else if (gracePeriodActive) {
        // Show grace period remaining time
        const graceDeadline = new Date(deadline.getTime() + 15 * 60 * 1000);
        const graceDiffMs = graceDeadline.getTime() - now.getTime();
        const graceDiffMinutes = Math.floor(graceDiffMs / (1000 * 60));
        timeRemaining = `Grace period: ${graceDiffMinutes}m remaining`;
      }
    }

    return NextResponse.json({
      orderable: finalOrderable,
      drop: {
        id: fullDrop.id,
        status: fullDrop.status,
        date: fullDrop.date,
        pickup_deadline: fullDrop.pickup_deadline,
        location: fullDrop.locations,
      },
      reason,
      time_until_deadline: timeRemaining,
      grace_period_active: gracePeriodActive,
    });
  } catch (error) {
    console.error('Unexpected error in check drop orderable:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
