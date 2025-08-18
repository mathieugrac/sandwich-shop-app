import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🧪 Testing drop status...');
    
    // Get next active drop
    const { data: nextDrop, error: dropError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropError || !nextDrop || nextDrop.length === 0) {
      console.error('❌ Drop error:', dropError);
      return NextResponse.json({
        success: false,
        error: 'No active drop available',
        details: dropError,
      });
    }

    const activeDrop = nextDrop[0];
    console.log('✅ Active drop found:', activeDrop);

    // Check if drop is orderable
    const { data: isOrderable, error: orderableError } = await supabase.rpc(
      'is_drop_orderable',
      { p_drop_id: activeDrop.id }
    );

    if (orderableError) {
      console.error('❌ Orderability check error:', orderableError);
      return NextResponse.json({
        success: false,
        error: 'Failed to check drop orderability',
        details: orderableError,
      });
    }

    console.log('✅ Drop orderability check result:', isOrderable);

    return NextResponse.json({
      success: true,
      message: 'Drop status check completed',
      drop: activeDrop,
      isOrderable: isOrderable,
      currentTime: new Date().toISOString(),
    });
    
  } catch (error) {
    console.error('❌ Drop status test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
