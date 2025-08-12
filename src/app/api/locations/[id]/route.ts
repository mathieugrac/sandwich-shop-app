import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', params.id)
      .single();

    if (error) {
      console.error('Error fetching location:', error);
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
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

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      name,
      district,
      address,
      google_maps_link,
      delivery_timeframe,
      active,
    } = body;

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
      .update({
        name,
        district,
        address,
        google_maps_link,
        delivery_timeframe,
        active: active !== undefined ? active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating location:', error);
      return NextResponse.json(
        { error: 'Failed to update location' },
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

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Check if location is referenced by any sells
    const { data: sells, error: sellsError } = await supabase
      .from('sells')
      .select('id')
      .eq('location_id', params.id);

    if (sellsError) {
      console.error('Error checking sells:', sellsError);
      return NextResponse.json(
        { error: 'Failed to check location usage' },
        { status: 500 }
      );
    }

    if (sells && sells.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location that has associated sells' },
        { status: 400 }
      );
    }

    // Soft delete by setting active to false
    const { error } = await supabase
      .from('locations')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', params.id);

    if (error) {
      console.error('Error deleting location:', error);
      return NextResponse.json(
        { error: 'Failed to delete location' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Location deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
