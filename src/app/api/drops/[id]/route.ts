import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data: drop, error } = await supabase
      .from('drops')
      .select(
        `
        *,
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
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching drop:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drop' },
        { status: 500 }
      );
    }

    if (!drop) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    return NextResponse.json(drop);
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
    const { date, location_id, status, notes } = body;

    // Validate required fields
    if (!date || !location_id) {
      return NextResponse.json(
        { error: 'Drop date and location are required' },
        { status: 400 }
      );
    }

    const { data: drop, error } = await supabase
      .from('drops')
      .update({
        date,
        location_id,
        status,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating drop:', error);
      return NextResponse.json(
        { error: 'Failed to update drop' },
        { status: 500 }
      );
    }

    return NextResponse.json(drop);
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
    const { error } = await supabase.from('drops').delete().eq('id', id);

    if (error) {
      console.error('Error deleting drop:', error);
      return NextResponse.json(
        { error: 'Failed to delete drop' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'Drop deleted successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
