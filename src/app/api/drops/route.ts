import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 API: Fetching drops with location data...');

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

    console.log('✅ API: Drops fetched successfully:', drops);
    console.log('✅ API: First drop location data:', drops?.[0]?.location);

    return NextResponse.json(drops);
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
