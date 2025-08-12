import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Debug: Checking database structure...');

    // Check if sells table exists and has data
    const { data: sells, error: sellsError } = await supabase
      .from('sells')
      .select('*')
      .limit(5);

    console.log('🔍 Debug: Sells query result:', { sells, sellsError });

    // Check if locations table exists and has data
    const { data: locations, error: locationsError } = await supabase
      .from('locations')
      .select('*')
      .limit(5);

    console.log('🔍 Debug: Locations query result:', {
      locations,
      locationsError,
    });

    // Check if sell_inventory table exists and has data
    const { data: inventory, error: inventoryError } = await supabase
      .from('sell_inventory')
      .select('*')
      .limit(5);

    console.log('🔍 Debug: Inventory query result:', {
      inventory,
      inventoryError,
    });

    // Check current date
    const currentDate = new Date().toISOString().split('T')[0];
    console.log('🔍 Debug: Current date:', currentDate);

    // Try the specific query from future sells
    const { data: futureSells, error: futureError } = await supabase
      .from('sells')
      .select(
        `
        *,
        locations (
          id,
          name,
          district,
          address,
          google_maps_link,
          delivery_timeframe
        )
      `
      )
      .gte('sell_date', currentDate)
      .order('sell_date', { ascending: true });

    console.log('🔍 Debug: Future sells query result:', {
      futureSells,
      futureError,
    });

    return NextResponse.json({
      success: true,
      currentDate,
      sells: { data: sells, error: sellsError },
      locations: { data: locations, error: locationsError },
      inventory: { data: inventory, error: inventoryError },
      futureSells: { data: futureSells, error: futureError },
    });
  } catch (error) {
    console.error('🔍 Debug: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Debug failed', details: error },
      { status: 500 }
    );
  }
}
