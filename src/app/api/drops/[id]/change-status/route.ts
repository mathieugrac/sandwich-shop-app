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

    // Use the enhanced function from Phase 1
    console.log('🔍 Calling change_drop_status with params:', {
      p_drop_id: id,
      p_new_status: newStatus,
      p_admin_user_id: user.id,
      user_email: user.email,
    });

    // Temporary: Also log to a file or show in response for debugging
    console.log('🚨 DEBUG: About to call RPC function');

    // Test if the function exists first
    try {
      // First, ensure the admin user exists in admin_users table
      let adminUserId: string;

      try {
        const { data: adminUser, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .eq('email', user.email)
          .single();

        if (adminUser) {
          // Admin user exists, use their ID
          adminUserId = adminUser.id;
          console.log('✅ Found existing admin user:', adminUserId);
        } else {
          throw new Error('No admin user found');
        }
      } catch (error: any) {
        // Admin user doesn't exist, create one
        console.log('🔄 Creating new admin user for:', user.email);

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
        console.log('✅ Created new admin user:', adminUserId);
      }

      const { data: testData, error: testError } = await supabase.rpc(
        'change_drop_status',
        {
          p_drop_id: id,
          p_new_status: newStatus,
          p_admin_user_id: adminUserId,
        }
      );

      if (testError) {
        console.log('❌ RPC function error:', testError);
        throw testError;
      }

      console.log('✅ RPC function call successful:', testData);
      return NextResponse.json({
        success: true,
        message: `Drop status changed to ${newStatus} successfully`,
      });
    } catch (rpcError: any) {
      console.error('❌ RPC function failed:', rpcError);
      return NextResponse.json(
        {
          error: 'RPC function failed',
          details: rpcError?.message || 'Unknown RPC error',
        },
        { status: 500 }
      );
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
