import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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

    // Get the current user (admin) from request headers
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.email);

    try {
      // Direct database update - simplified approach
      const { error: updateError } = await supabase
        .from('drops')
        .update({
          status: newStatus,
          status_changed_at: new Date().toISOString(),
          last_modified_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (updateError) {
        console.error('❌ Database update error:', updateError);
        throw updateError;
      }

      console.log('✅ Drop status updated successfully:', {
        dropId: id,
        newStatus,
      });

      return NextResponse.json({
        success: true,
        message: `Drop status changed to ${newStatus} successfully`,
      });
    } catch (updateError: unknown) {
      console.error('❌ Database update failed:', updateError);
      const errorMessage =
        updateError instanceof Error
          ? updateError.message
          : 'Unknown database error';
      return NextResponse.json(
        {
          error: 'Failed to update drop status',
          details: errorMessage,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in change drop status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
