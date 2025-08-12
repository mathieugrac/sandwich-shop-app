import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    console.log('🔄 API: Fetching future sells...');

    // Get all future sells with location and inventory information
    const { data: sells, error } = await supabase
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
      .gte('sell_date', new Date().toISOString().split('T')[0])
      .order('sell_date', { ascending: true });

    if (error) {
      console.error('❌ API: Error fetching future sells:', error);
      return NextResponse.json(
        { error: 'Failed to fetch future sells' },
        { status: 500 }
      );
    }

    console.log('✅ API: Sells fetched:', sells);
    console.log('✅ API: Number of sells:', sells?.length || 0);

    // For each sell, get the total available inventory
    console.log('🔄 API: Calculating inventory for sells...');

    const sellsWithInventory = await Promise.all(
      sells.map(async sell => {
        const { data: inventory, error: inventoryError } = await supabase
          .from('sell_inventory')
          .select('available_quantity')
          .eq('sell_id', sell.id);

        if (inventoryError) {
          console.error(
            `❌ API: Error fetching inventory for sell ${sell.id}:`,
            inventoryError
          );
        }

        const totalAvailable =
          inventory?.reduce((sum, item) => sum + item.available_quantity, 0) ||
          0;

        console.log(
          `✅ API: Sell ${sell.id} - Total available: ${totalAvailable}`
        );

        return {
          ...sell,
          total_available: totalAvailable,
        };
      })
    );

    console.log('✅ API: Final result:', sellsWithInventory);
    return NextResponse.json(sellsWithInventory);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
