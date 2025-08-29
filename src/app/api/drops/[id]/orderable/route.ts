import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Handle both sync and async params
    const resolvedParams = await Promise.resolve(params);
    const { id } = resolvedParams;
    console.log('API called with drop ID:', id);

    // Get drop details with location info
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(
        `
        id,
        status,
        date,
        locations (
          id,
          name,
          district
        )
      `
      )
      .eq('id', id)
      .single();

    if (dropError || !drop) {
      console.error('Error fetching drop:', dropError);
      return NextResponse.json(
        { error: 'Drop not found', details: dropError?.message },
        { status: 404 }
      );
    }

    // Simple logic: drop is orderable if status is 'active'
    const isOrderable = drop.status === 'active';

    // Provide simple reason for why drop is not orderable
    let reason = null;
    if (!isOrderable) {
      if (drop.status === 'completed') {
        reason = 'This drop has been completed';
      } else if (drop.status === 'cancelled') {
        reason = 'This drop has been cancelled';
      } else if (drop.status === 'upcoming') {
        reason = 'This drop is not yet open for ordering';
      } else {
        reason = 'This drop is not currently accepting orders';
      }
    }

    return NextResponse.json({
      orderable: isOrderable,
      drop: {
        id: drop.id,
        status: drop.status,
        date: drop.date,
        location: drop.locations,
      },
      reason,
    });
  } catch (error) {
    console.error('Unexpected error in check drop orderable:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
