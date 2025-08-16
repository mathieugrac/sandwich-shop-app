import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('get_admin_upcoming_drops');

    if (error) {
      console.error('Error fetching admin upcoming drops:', error);
      return NextResponse.json(
        { error: 'Failed to fetch upcoming drops' },
        { status: 500 }
      );
    }

    // Debug logging
    console.log('🔍 Admin upcoming drops API response:', {
      dataCount: data?.length || 0,
      firstDrop: data?.[0],
      sampleData: data?.slice(0, 2).map((d: { id: string; date: string; status: string; total_available: number }) => ({
        id: d.id,
        date: d.date,
        status: d.status,
        total_available: d.total_available,
      })),
    });

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Unexpected error in admin upcoming drops:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
