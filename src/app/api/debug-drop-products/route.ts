import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Debug: Getting drop products...');

    // Get the next active drop first
    const { data: nextDrop, error: dropError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (dropError || !nextDrop || nextDrop.length === 0) {
      console.error('❌ Debug: Error getting next active drop:', dropError);
      return NextResponse.json({
        error: 'No active drop available',
        dropError: dropError,
      });
    }

    const activeDrop = nextDrop[0];
    console.log('✅ Debug: Active drop found:', activeDrop);

    // Get drop products for this drop
    const { data: dropProducts, error: productsError } = await supabase
      .from('drop_products')
      .select(
        `
        id,
        drop_id,
        product_id,
        stock_quantity,
        reserved_quantity,
        available_quantity,
        selling_price,
        products (
          id,
          name,
          description,
          category
        )
      `
      )
      .eq('drop_id', activeDrop.id);

    if (productsError) {
      console.error('❌ Debug: Error getting drop products:', productsError);
      return NextResponse.json({
        error: 'Failed to get drop products',
        productsError: productsError,
      });
    }

    console.log('✅ Debug: Drop products found:', dropProducts);

    return NextResponse.json({
      success: true,
      activeDrop: activeDrop,
      dropProducts: dropProducts,
    });
  } catch (error) {
    console.error('❌ Debug: Unexpected error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
