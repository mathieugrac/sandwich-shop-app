import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { newStatus } = await request.json();

    // Validate the new status
    const validStatuses = ['upcoming', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        {
          error:
            'Invalid status. Must be one of: upcoming, active, completed, cancelled',
        },
        { status: 400 }
      );
    }

    // Get the current user (admin)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('change_drop_status', {
      p_drop_id: params.id,
      p_new_status: newStatus,
      p_admin_user_id: user.id,
    });

    if (error) {
      console.error('Error changing drop status:', error);
      return NextResponse.json(
        { error: 'Failed to change drop status' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `Drop status changed to ${newStatus} successfully`,
    });
  } catch (error) {
    console.error('Unexpected error in change drop status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
