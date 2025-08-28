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

    // Check if user is admin
    const { data: adminUser, error: adminCheckError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (adminCheckError || !adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      );
    }

    // Use the enhanced function from Phase 1
    try {
      // First, ensure the admin user exists in admin_users table
      let adminUserId: string;

      try {
        const { data: existingAdminUser } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (existingAdminUser) {
          // Admin user exists, use their ID
          adminUserId = existingAdminUser.id;
        } else {
          throw new Error('No admin user found');
        }
      } catch {
        // Admin user doesn't exist, create one
        const { data: newAdminUser, error: createError } = await supabase
          .from('admin_users')
          .insert({
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            role: 'admin',
          })
          .select('id')
          .single();

        if (createError) {
          console.error('❌ Error creating admin user:', createError);
          throw createError;
        }

        adminUserId = newAdminUser.id;
      }

      const { error: rpcError } = await supabase.rpc(
        'change_drop_status',
        {
          p_drop_id: id,
          p_new_status: newStatus,
          p_admin_user_id: adminUserId,
        }
      );

      if (rpcError) {
        throw rpcError;
      }
      
      return NextResponse.json({
        success: true,
        message: `Drop status changed to ${newStatus} successfully`,
      });
    } catch (rpcError: unknown) {
      console.error('❌ RPC function failed:', rpcError);
      const errorMessage =
        rpcError instanceof Error ? rpcError.message : 'Unknown RPC error';
      return NextResponse.json(
        {
          error: 'RPC function failed',
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
