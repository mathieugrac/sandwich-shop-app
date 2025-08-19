import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Single query with JOIN to get drops, locations, and total available quantities
    const { data: drops, error } = await supabase
      .from('drops')
      .select(
        `
        *,
        location:locations (
          id,
          name,
          address,
          district,
          location_url,
          pickup_hour_start,
          pickup_hour_end
        ),
        drop_products!inner (
          available_quantity
        )
      `
      )
      .order('date', { ascending: true });

    if (error) {
      console.error('❌ API: Error fetching drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drops' },
        { status: 500 }
      );
    }

    // Transform data to include total_available using database view
    const dropsWithTotal = drops.map(drop => {
      const total_available =
        drop.drop_products?.reduce(
          (sum: number, dp: { available_quantity: number | null }) =>
            sum + (dp.available_quantity || 0),
          0
        ) || 0;

      // Remove drop_products from response, keep only total
      const { drop_products, ...dropData } = drop;
      return { ...dropData, total_available };
    });

    return NextResponse.json(dropsWithTotal);
  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, location_id, status, notes } = body;

    // Validate required fields
    if (!date || !location_id) {
      return NextResponse.json(
        { error: 'Drop date and location are required' },
        { status: 400 }
      );
    }

    // Check if location exists and is active
    const { data: location, error: locationError } = await supabase
      .from('locations')
      .select('id')
      .eq('id', location_id)
      .eq('active', true)
      .single();

    if (locationError || !location) {
      return NextResponse.json(
        { error: 'Invalid or inactive location' },
        { status: 400 }
      );
    }

    const { data: drop, error } = await supabase
      .from('drops')
      .insert({
        date,
        location_id,
        status: status || 'upcoming',
        notes,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating drop:', error);
      return NextResponse.json(
        { error: 'Failed to create drop' },
        { status: 500 }
      );
    }

    // Don't automatically create drop products - let admin manage menu manually
    // This ensures only selected products are attached to drops

    return NextResponse.json(drop);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
