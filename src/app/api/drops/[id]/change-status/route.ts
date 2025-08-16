import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    // Try to use the new enhanced function from Phase 1 first
    let statusChanged = false;
    try {
      const { data, error } = await supabase.rpc('change_drop_status', {
        p_drop_id: params.id,
        p_new_status: newStatus,
        p_admin_user_id: user.id,
      });

      if (error) {
        console.error('Enhanced function error:', error);
        console.error('Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
        });
        // Fall back to direct update method
        throw error;
      }

      if (data) {
        statusChanged = true;
      }
    } catch (enhancedError) {
      console.warn(
        'Enhanced function not available, falling back to direct update:',
        enhancedError
      );

      // Fallback: Update status directly
      const { error: updateError } = await supabase
        .from('drops')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', params.id);

      if (updateError) {
        console.error('Direct update error:', updateError);
        return NextResponse.json(
          {
            error: 'Failed to change drop status',
            details: updateError.message || 'Direct update failed',
          },
          { status: 500 }
        );
      }

      statusChanged = true;
    }

    if (!statusChanged) {
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
