import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('get_admin_past_drops');

    if (error) {
      console.error('Error fetching admin past drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch past drops' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in admin past drops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
