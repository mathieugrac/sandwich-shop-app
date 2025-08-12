import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🧪 Testing Supabase connection...');

    // Test basic connection
    const { data: products, error } = await supabase
      .from('products')
      .select('id, name')
      .limit(1);

    console.log('📊 Products test:', { products, error });

    if (error) {
      return NextResponse.json(
        { error: 'Supabase connection failed', details: error },
        { status: 500 }
      );
    }

    // Test the function
    const { data: nextSell, error: sellError } = await supabase.rpc(
      'get_next_active_sell'
    );

    console.log('📊 Next sell test:', { nextSell, sellError });

    return NextResponse.json({
      success: true,
      products: products,
      nextSell: nextSell,
      sellError: sellError,
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error },
      { status: 500 }
    );
  }
}
