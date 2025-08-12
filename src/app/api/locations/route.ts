import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: locations, error } = await supabase
      .from('locations')
      .select('*')
      .eq('active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch locations' },
        { status: 500 }
      );
    }

    return NextResponse.json(locations);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, district, address, google_maps_link, delivery_timeframe } =
      body;

    // Validate required fields
    if (!name || !district || !address || !delivery_timeframe) {
      return NextResponse.json(
        {
          error: 'Name, district, address, and delivery_timeframe are required',
        },
        { status: 400 }
      );
    }

    const { data: location, error } = await supabase
      .from('locations')
      .insert({
        name,
        district,
        address,
        google_maps_link,
        delivery_timeframe,
        active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating location:', error);
      return NextResponse.json(
        { error: 'Failed to create location' },
        { status: 500 }
      );
    }

    return NextResponse.json(location);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
