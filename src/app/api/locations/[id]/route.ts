import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data: location, error } = await supabase
      .from('locations')
      .select('*')
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const body = await request.json();
    const {
      name,
      address,
      location_url,
      pickup_hour_start,
      pickup_hour_end,
      active,
    } = body;

    // Validate required fields
    if (!name || !address || !pickup_hour_start || !pickup_hour_end) {
      return NextResponse.json(
        {
          error:
            'Name, address, pickup_hour_start, and pickup_hour_end are required',
        },
        { status: 400 }
      );
    }

    const { data: location, error } = await supabase
      .from('locations')
      .update({
        name,
        address,
        location_url,
        pickup_hour_start,
        pickup_hour_end,
        active: active !== undefined ? active : true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
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
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check if location is referenced by any drops
    const { data: drops, error: dropsError } = await supabase
      .from('drops')
      .select('id')
      .eq('location_id', id);

    if (dropsError) {
      console.error('Error checking drops:', dropsError);
      return NextResponse.json(
        { error: 'Failed to check location usage' },
        { status: 500 }
      );
    }

    if (drops && drops.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete location that has associated drops' },
        { status: 400 }
      );
    }

    // Soft delete by setting active to false
    const { error } = await supabase
      .from('locations')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

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
