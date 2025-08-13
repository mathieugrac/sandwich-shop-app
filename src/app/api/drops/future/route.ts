import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: drops, error } = await supabase
      .from('drops')
      .select(
        `
        id,
        date,
        status,
        notes,
        locations (
          id,
          name,
          address,
          location_url,
          pickup_hour_start,
          pickup_hour_end
        )
      `
      )
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (error) {
      console.error('Error fetching future drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch future drops' },
        { status: 500 }
      );
    }

    // Calculate total available quantity for each drop
    const dropsWithTotal = await Promise.all(
      drops.map(async drop => {
        const { data: dropProducts, error: inventoryError } = await supabase
          .from('drop_products')
          .select('available_quantity')
          .eq('drop_id', drop.id);

        if (inventoryError) {
          console.error('Error fetching drop inventory:', inventoryError);
          return { ...drop, total_available: 0 };
        }

        const total_available =
          dropProducts?.reduce(
            (sum, dp) => sum + (dp.available_quantity || 0),
            0
          ) || 0;

        return { ...drop, total_available };
      })
    );

    return NextResponse.json(dropsWithTotal);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
