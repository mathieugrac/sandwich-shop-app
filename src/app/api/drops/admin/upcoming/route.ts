import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();

    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('get_admin_upcoming_drops');

    if (error) {
      console.error('Error fetching admin upcoming drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch upcoming drops' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in admin upcoming drops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
