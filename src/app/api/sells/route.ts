import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    const { data: sells, error } = await supabase
      .from('sells')
      .select('*')
      .order('sell_date', { ascending: false });

    if (error) {
      console.error('Error fetching sells:', error);
      return NextResponse.json(
        { error: 'Failed to fetch sells' },
        { status: 500 }
      );
    }

    return NextResponse.json(sells);
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
    const { sell_date, status, notes } = body;

    // Validate required fields
    if (!sell_date) {
      return NextResponse.json(
        { error: 'Sell date is required' },
        { status: 400 }
      );
    }

    const { data: sell, error } = await supabase
      .from('sells')
      .insert({
        sell_date,
        status: status || 'draft',
        notes,
        announcement_sent: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating sell:', error);
      return NextResponse.json(
        { error: 'Failed to create sell' },
        { status: 500 }
      );
    }

    return NextResponse.json(sell);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
