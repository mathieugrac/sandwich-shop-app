import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { dropDate, locationId } = await request.json();

    // Validate input
    if (!dropDate || !locationId) {
      return NextResponse.json(
        { error: 'Drop date and location ID are required' },
        { status: 400 }
      );
    }

    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('calculate_pickup_deadline', {
      p_drop_date: dropDate,
      p_location_id: locationId,
    });

    if (error) {
      console.error('Error calculating pickup deadline:', error);
      return NextResponse.json(
        { error: 'Failed to calculate pickup deadline' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      deadline: data,
    });
  } catch (error) {
    console.error('Unexpected error in calculate deadline:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
