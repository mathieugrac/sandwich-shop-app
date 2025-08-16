import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();

    // Use the new enhanced function from Phase 1
    const { data, error } = await supabase.rpc('is_drop_orderable', {
      p_drop_id: params.id
    });

    if (error) {
      console.error('Error checking if drop is orderable:', error);
      return NextResponse.json(
        { error: 'Failed to check drop orderability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      orderable: data
    });

  } catch (error) {
    console.error('Unexpected error in check drop orderable:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
